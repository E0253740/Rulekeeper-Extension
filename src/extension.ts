// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { exec } from "child_process";
import * as path from "path";
import { spawn, ChildProcess } from "child_process";
import * as CLient from "scp2"; //For copying files
import * as fs from "fs";
import * as spawnConnection from "./commands/spawnConnection";
import { runShell, vagrantUp } from "./commands/utils";
import { ArrayDataProvider } from "./commands/ArrayItem";
import { runCommandAndCaptureOutput } from "./commands/spawnConnection";
import { showProject } from "./commands/showProject";

const vagrantPath = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "rulekeeper",
  "Usability Tests"
);
const identityFile =
  //"C:/Users/m1560/.vagrant.d/insecure_private_keys/vagrant.key.rsa";
  "/Users/KY/.vagrant.d/insecure_private_keys/vagrant.key.rsa";

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
      const output = data.toString();
      outputChannel.append(output);
    });

    // Capture standard error
    sshProcess?.stderr?.on("data", (data) => {
      const errorOutput = data.toString();
      outputChannel.append(`Error: ${errorOutput}`);

      // Show an error message in VSCode for more visibility
      vscode.window.showErrorMessage(`SSH Error: ${errorOutput}`);
    });

    // Log when the process closes
    sshProcess.on("close", (code) => {
      vscode.window.showErrorMessage(`SSH process closed with code ${code}.`);
    });
  }

  //Function to send command to SSHProcess
  function sendCommand(command: string) {
    if (sshProcess) {
      sshProcess?.stdin?.write(`${command}\n`);
      //sshProcess.stdin.write(`${command}`)
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
  }

  //Function to wait for prompt
  function detectPrompt(prompt: string): Promise<void> {
    return new Promise((resolve) => {
      // Continuously check the output for the prompt
      sshProcess?.stdout?.on("data", (data) => {
        const output = data.toString();
        if (output.includes(prompt)) {
          resolve(); // Resolve the promise when the prompt is detected
        }
      });
    });
  }

  const activateCommand = vscode.commands.registerCommand(
    "extension.activatePlugin",
    async () => {
      // Prompt for Project

      createSSHProcess();

      vscode.window.showInformationMessage("Im Waiting");
      const project = await vscode.window.showInputBox({
        prompt: "Enter the project to run rulekeeper",
        placeHolder: "Project Name",
        ignoreFocusOut: true,
      });

      if (project !== undefined && project.trim() !== "") {
        vscode.window.showInformationMessage("hehe");
        runAllCommand(project);
      } else {
        vscode.window.showErrorMessage(
          "No valid project entered. Please try again."
        );
      }
    }
  );

  //Working
  // const activateCommand = vscode.commands.registerCommand(
  //   "extension.activatePlugin",
  //   async () => {
  //     //connect to SSH
  //     createTerminal();
  //     vscode.window.showInformationMessage("SSH connection established.");
  //     sendCommandToTerminal("ls");
  //     sendCommandToTerminal("cd tests");
  //     sendCommandToTerminal("ls");
  //     // Prompt for Project
  //     const outputChannel = vscode.window.createOutputChannel("SSH Output");
  //     outputChannel.show(true);

  //     vscode.window.showInformationMessage("Im Waiting");
  //     const project = await vscode.window.showInputBox({
  //       prompt: "Enter the project to run rulekeeper",
  //       placeHolder: "Project Name",
  //       ignoreFocusOut: true,
  //     });

  //     if (project !== undefined && project.trim() !== "") {
  //       vscode.window.showInformationMessage("hehe");
  //       try {
  //         const output = await spawnConnection.runCommandAndCaptureOutput(
  //           identityFile,
  //           `cd tests && ./setup.sh ${project}`
  //         );
  //         vscode.window.showInformationMessage(`Setup output: ${output}`);
  //         //Wait for command to be completed
  //         const completionIndicator =
  //           "[INFO] - Running container neo4j-rulekeeper";
  //         outputChannel.append(output);
  //         if (output.includes(completionIndicator)) {
  //           //Send enter to terminal
  //           sendCommandToTerminal("");
  //           sendCommandToTerminal("cd webus");
  //         }
  //       } catch (error) {
  //         vscode.window.showErrorMessage(`Error: ${error}`);
  //       }
  //     }
  //   }
  // );

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

  function getVagrantfileDirectory(): string | null {
    const workspaceFolders = vscode.workspace.workspaceFolders;

    if (workspaceFolders && workspaceFolders.length > 0) {
      const rootPath = workspaceFolders[0].uri.fsPath;
      const vagrantfilePath = path.join(rootPath, "Vagrantfile");

      // Check if the Vagrantfile exists
      if (fs.existsSync(vagrantfilePath)) {
        return rootPath; // Return the directory containing the Vagrantfile
      } else {
        vscode.window.showErrorMessage(
          "Vagrantfile not found in the workspace."
        );
        return null;
      }
    } else {
      vscode.window.showErrorMessage("No workspace is open.");
      return null;
    }
  }

  function copyFileToVagrantDirectory(localPath: string, remotePath: string) {
    vscode.window.showInformationMessage("Hello...Im trying to copy now");
    if (!fs.existsSync(localPath)) {
      vscode.window.showErrorMessage("Local file does not exist.");
      return;
    } else {
      vscode.window.showInformationMessage("Local file exist.");
    }
    const config = {
      host: "127.0.0.1",
      port: 2222, // Vagrant SSH default port
      username: "vagrant",
      privateKey: require("fs").readFileSync(
        "/Users/KY/.vagrant.d/insecure_private_keys/vagrant.key.rsa"
        // "C:/Users/m1560/.vagrant.d/insecure_private_keys/vagrant.key.rsa"
      ), // Path to private key
    };

    //handling space in local Path
    localPath = `${localPath}`;
    console.log(localPath);

    const Client = require("scp2");
    Client.scp(
      localPath,
      {
        host: config.host,
        port: config.port,
        username: config.username,
        privateKey: config.privateKey,
        path: remotePath,
      },
      (err: any) => {
        vscode.window.showInformationMessage("SCP Callback reached");
        if (err) {
          vscode.window.showErrorMessage(`Failed to copy file: ${err.message}`);
        } else {
          vscode.window.showInformationMessage(`File copied to ${remotePath}`);
        }
      }
    );
  }

  //getting vagrant config
  function getVagrantSSHConfig(): Promise<any> {
    return new Promise((resolve, reject) => {
      exec("vagrant ssh-config", (error, stdout, stderr) => {
        if (error) {
          reject(`Error getting Vagrant SSH config: ${stderr}`);
        } else {
          // Parse the SSH config output
          const sshConfig: any = {};
          stdout.split("\n").forEach((line) => {
            const [key, value] = line.trim().split(" ");
            if (key && value) {
              sshConfig[key] = value;
            }
          });
          resolve(sshConfig);
        }
      });
    });
  }

  const copyCommand = vscode.commands.registerCommand(
    "extension.copyToRemote",
    () => {
      const destinationPath = "/home/vagrant/tests/";
      vscode.window
        .showInputBox({
          prompt: "Enter the local path to your project",
        })
        .then((localPath) => {
          if (localPath) {
            const folder = path.basename(localPath);
            const finalpath = path.join(destinationPath, folder, path.sep);
            console.log("final path: " + finalpath);
            copyFileToVagrantDirectory(localPath, finalpath);
          }
        });
      vscode.window.showInformationMessage("Hello...Im trying");
    }
  );

  let projectList = await showProject(identityFile);

  const arrayDataProvider = new ArrayDataProvider(projectList);

  // Register the tree view
  vscode.window.registerTreeDataProvider("arrayTreeView", arrayDataProvider);

  // Command to refresh the array
  let refreshCommand = vscode.commands.registerCommand(
    "extension.refreshArray",
    () => {
      arrayDataProvider.refresh();
      vscode.window.showInformationMessage("Project List Updated");
    }
  );

  context.subscriptions.push(refreshCommand);

  context.subscriptions.push(runShell);
  context.subscriptions.push(vagrantUp);
  context.subscriptions.push(connectCommand);
  context.subscriptions.push(runRuleKeeperOnProject);
  context.subscriptions.push(copyCommand);
  context.subscriptions.push(activateCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {}
