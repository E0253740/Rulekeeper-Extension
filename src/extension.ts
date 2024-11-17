// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { exec } from "child_process";
import * as path from "path";
import { spawn, ChildProcess } from "child_process";
import * as fs from "fs";
import * as spawnConnection from "./commands/spawnConnection";
import { runShell, vagrantUp } from "./commands/utils";
import { ArrayDataProvider } from "./commands/ArrayItem";
import { runCommandAndCaptureOutput } from "./commands/spawnConnection";
import { showProject } from "./commands/showProject";
import { copyFileWindows } from "./commands/copyProject";
import { visualizeJson } from "./commands/visualize";
import {copyFileToVagrantDirectory} from "./commands/SSHcopyDirecToVM";

const vagrantPath = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "rulekeeper",
  "Usability Tests"
);
// const identityFile =
//   //"C:/Users/m1560/.vagrant.d/insecure_private_keys/vagrant.key.rsa";
// // "/Users/KY/.vagrant.d/insecure_private_keys/vagrant.key.rsa";


const config = vscode.workspace.getConfiguration("rulekeeper");
const identityFile: string = config.get("connection.rsaFile") || "";

let terminal: vscode.Terminal | null = null;

function createTerminal() {
  if (terminal) {
    // if the terminal exists, just reuse
    terminal.show();
    return;
  }

  // create new vscode terminal
  terminal = vscode.window.createTerminal({
    name: "Vagrant SSH",
    shellPath: "ssh",
    shellArgs: ["-i", identityFile, "-p", "2222", "vagrant@127.0.0.1"],
  });

  terminal.show();
}

function sendCommandToTerminal(command: string) {
  if (terminal) {
    terminal.sendText(command);
  } else {
    vscode.window.showErrorMessage("Terminal is not open.");
  }
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "helloworld" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json

  let sshProcess: ChildProcess | undefined;
  let output = "";

  //Initializing sshProcess
  function createSSHProcess() {
    sshProcess = spawn("ssh", [
      "-tt",
      "-i",
      identityFile,
      "-p",
      "2222",
      "vagrant@127.0.0.1",
    ]);

    const outputChannel = vscode.window.createOutputChannel("SSH Output");
    outputChannel.show(true);

    //capture output
    sshProcess?.stdout?.on("data", (data) => {
      let output = data.toString();
    //   output = output.replace(
    //     /\x1b\[[0-9;]*[a-zA-Z]/g,
    //     ""
    // ).replace(/[\r\n]+/g, '\n');
      outputChannel.append(output);
    });

    // Capture standard error
    sshProcess?.stderr?.on("data", (data) => {
      const errorOutput = data.toString();
      outputChannel.append(`Error: ${errorOutput}`);

      vscode.window.showErrorMessage(`SSH Error: ${errorOutput}`);
    });

    sshProcess.on("close", (code) => {
      vscode.window.showErrorMessage(`SSH process closed with code ${code}.`);
    });
  }

  // Function to detect pattern and let user know which part of the code has problem -- what if there is 2 difference?
  function alertCode(output: string, project: string) {
    const match = output.match(/Set\((\d+)\) \{(.+?)\}/);
    if (match) {
      const number = parseInt(match[1], 10);
      // let phrases = match[2].trim();
      let phrases = match[2].split(/,\s*/);

      phrases.forEach((phrase) => {
        {
          phrase = phrase.trim().replace(/^['"]|['"]$/g, ""); // Remove surrounding quotes
          console.log("Processing phrase:", phrase);

          // Convert HTTP method phrase to router method format
          const httpMethodMatch = phrase.match(/(GET|POST|PUT|DELETE) (\/.+)/);
          //console.log("look at me", httpMethodMatch);
          if (httpMethodMatch) {
            const method = httpMethodMatch[1].toLowerCase();
            //const path = httpMethodMatch[2].match(/\/(\w+)'?$/); //this path cannot be identified in windows
            let path = httpMethodMatch[2];
            // console.log('initial path', path);
            path = path.replace(/\\/g, '/');
            // console.log("method", method);
            // console.log("normalizedpath", path);
            const pathMatch = path.match(/\/([\w-]+)/); // This captures the last part after the slash
            let routerphrase = `router.${method}(`;
            if (pathMatch) {
              let searchPath = pathMatch[1];
              // console.log("searchPath", searchPath);
              searchPhraseInFiles(searchPath, routerphrase, project);
            }
          }
        }
      });
      vscode.window.showErrorMessage(
        "GPRD Non-compliance detected, please check problem tab",
        { modal: true }
      );
    }
  }

  // Function to search files in the code base and report issues in problem tab to let user know which part of the code has problem
  function searchPhraseInFiles(path: string, phrase: string, project: string) {
    if (!sshProcess) return;

    // Construct the grep command to search recursively in the project folder for the given phrase
    const grepCommand = `grep -rn '${project}' -e '${phrase}'`;

    // Send the command to the SSH process
    sshProcess.stdin?.write(`${grepCommand}\n`);

    // Capture the grep output
    sshProcess.stdout?.on("data", (data) => {
      let output = data.toString();       
      // console.log("output",output);

      const lines = output.split('\n');
      lines.forEach((line:any) => {
        let cleanedLine = line.trim();
        cleanedLine = cleanedLine
        .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "") // Remove ANSI codes
        .replace(/[^\x20-\x7E]/g, "");    // Remove non-ASCII characters
        // console.log("Processing Line:", cleanedLine);

      //   for (let i = 0; i < cleanedLine.length; i++) {
      //     console.log(`Character: '${cleanedLine[i]}' | Code: ${cleanedLine.charCodeAt(i)}`);
      // };

        // Apply the regex on each line separately
        const matches = cleanedLine.match(/^(.+?):(\d+):(.+)/g);
        if (matches) {
          // console.log("it matches");
          matches.forEach((match: { match: (arg0: RegExp) => any[] }) => {
            const [, filePath, line, text] =
            match.match(/^(.+):(\d+):(.*)$/) || [];

            if (filePath && line && text && text.includes(path)) {
              const lineNumber = parseInt(line, 10) - 1; // Convert to 0-based index for VSCode

              // Add the issue to VSCode Problems tab
              const diagnosticCollection =
                vscode.languages.createDiagnosticCollection("sshOutput");
              const uri = vscode.Uri.file(filePath);
              const diagnostic = new vscode.Diagnostic(
                new vscode.Range(lineNumber, 0, lineNumber, text.length),
                `Please check ${filePath} , ${text} function for GDPR Non-compliance`,
                vscode.DiagnosticSeverity.Warning
              );

              diagnosticCollection.set(uri, [diagnostic]);
            }
          });
        }
      });
    });
  }

  let projectList = await showProject(identityFile);

  const arrayDataProvider = new ArrayDataProvider(projectList);

  // Register the tree view
  vscode.window.registerTreeDataProvider("arrayTreeView", arrayDataProvider);

  //Function to send command to SSHProcess
  function sendCommand(command: string) {
    if (sshProcess) {
      sshProcess?.stdin?.write(`${command}\n`);
    } else {
      vscode.window.showErrorMessage("SSH process is not running.");
    }
  }

  async function runAllCommand(project: string) {
    sendCommand(`cd tests && ./setup.sh ${project}`);
    vscode.window.showInformationMessage("Running Setup");
    await detectPrompt("INFO  Started.");
    sendCommand("");
    vscode.window.showInformationMessage("Finish Setup");
    sendCommand(`./run.sh ${project}`);
    vscode.window.showInformationMessage("Finish run.sh");

    sshProcess?.stdout?.on("data", (data) => {
      alertCode(data.toString(), project);
    });
  }

  //Function to wait for prompt
  function detectPrompt(prompt: string): Promise<void> {
    return new Promise((resolve) => {
      // Continuously check the output for the prompt
      sshProcess?.stdout?.on("data", (data) => {
        const output = data.toString();
        if (output.includes(prompt)) {
          resolve();
        }
      });
    });
  }

  const activateCommand = vscode.commands.registerCommand(
    "extension.activatePlugin",
    async () => {
      // Prompt for Project

      createSSHProcess();

      const project = await vscode.window.showInputBox({
        prompt: "Enter the project to run rulekeeper",
        placeHolder: "Project Name",
        ignoreFocusOut: true,
      });

      if (
        project !== undefined &&
        project.trim() !== "" &&
        projectList.indexOf(project) !== -1
      ) {
        
        runAllCommand(project);
      } else {
        vscode.window.showErrorMessage(
          "No valid project entered. Please try again."
        );
      }
    }
  );

  // command for persistentVagrantSsh
  const connectCommand = vscode.commands.registerCommand(
    "extension.persistentVagrantSsh",
    () => {
      createTerminal();
      vscode.window.showInformationMessage("SSH connection established.");
      sendCommandToTerminal("ls");
      sendCommandToTerminal("cd tests");
      sendCommandToTerminal("ls");
    }
  );

  const runRuleKeeperOnProject = vscode.commands.registerCommand(
    // May not need it if spawn can do this all in 1 shot
    "extension.runRuleKeeperOnProject",
    () => {
      vscode.window
        .showInputBox({
          prompt: "Enter the project to run rulekeeper",
        })
        .then((project) => {
          if (project) {
            sendCommandToTerminal(`./setup.sh ${project}`);
          }
        });
    }
  );

  const copyCommand = vscode.commands.registerCommand(
    "extension.copyToRemote",
    () => {
      const destinationPath = "/home/vagrant/tests/";
      vscode.window
        .showInputBox({
          prompt: "Enter the local directory to your project",
        })
        .then((localPath) => {
          if (localPath) {
            const folder = path.basename(localPath);
            const finalpath = path.join(destinationPath, folder, path.sep);
            const normalizedPath = finalpath.replace(/\\/g, "/");
            console.log("final path: " + finalpath);
            console.log("normalized path" + normalizedPath);
            copyFileToVagrantDirectory(localPath, normalizedPath, identityFile);
          }
        });
    }
  );

  // Command to refresh the array
  let refreshCommand = vscode.commands.registerCommand(
    "extension.refreshArray",
    async () => {
      const newProjectList = await showProject(identityFile);
      if (JSON.stringify(newProjectList) !== JSON.stringify(projectList)) {
        projectList = newProjectList;
        arrayDataProvider.updateData(projectList);
        vscode.window.showInformationMessage("Project List Updated");
      } else {
        vscode.window.showInformationMessage("No changes in Project List.");
      }
    }
  );

  context.subscriptions.push(refreshCommand);

  context.subscriptions.push(runShell);
  context.subscriptions.push(vagrantUp);
  context.subscriptions.push(connectCommand);
  context.subscriptions.push(runRuleKeeperOnProject);
  context.subscriptions.push(copyCommand);
  context.subscriptions.push(activateCommand);
  context.subscriptions.push(copyFileWindows);
  context.subscriptions.push(visualizeJson);
}

// This method is called when your extension is deactivated
export function deactivate() {}
