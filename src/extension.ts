// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { exec, spawn, ChildProcessWithoutNullStreams } from "child_process";
import * as path from "path";
import * as Client from "scp2"; //For copying files
import * as fs from "fs";

const filePath = path.join(__dirname, "..", "src", "test.sh");
const vagrantPath = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "rulekeeper",
  "Usability Tests"
);
console.log(vagrantPath);

const identityFile =
  "/Users/KY/.vagrant.d/insecure_private_keys/vagrant.key.rsa";

let terminal: vscode.Terminal | null = null;

function createTerminal() {
  if (terminal) {
    terminal.show();
    return;
  }

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
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "helloworld" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = vscode.commands.registerCommand(
    "helloworld.helloWorld",
    () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      vscode.window.showInformationMessage("Hello VS Code");
    }
  );
  // Command to run shell script
  let runShell = vscode.commands.registerCommand(
    "extension.runShellScript",
    () => {
      const bashPath = "/bin/bash";
      const normalizedFilePath = path.posix.normalize(filePath); 
      //const bashPath = "D:\\Git\\usr\\bin\\bash.exe";
      // Run shell script with git bash
      exec(`"${bashPath}" "${normalizedFilePath}"`, (error, stdout, stderr) => {
      // exec(`"${bashPath}" "${filePath}"`, (error, stdout, stderr) => {
        if (error) {
          vscode.window.showErrorMessage(`Error: ${stderr}`);
          // vscode.window.showErrorMessage(`Error: ${filePath}`);
        } else {
          vscode.window.showInformationMessage(`Output: ${stdout}`);
        }
      });
    }
  );

  // Command to activate vagrant (Problem: vagrant will stop after running this command - use run vagrant persistently)
  let vagrantUp = vscode.commands.registerCommand(
    "extension.runVagrant",
    function () {
      // 1. start vagrant
      exec(`cd ${vagrantPath} && vagrant up`, (error, stdout, stderr) => {
        if (error) {
          vscode.window.showErrorMessage(`Error: ${error.message}`);
          return;
        }
        if (stderr) {
          vscode.window.showErrorMessage(`Stderr: ${stderr}`);
          return;
        }
        vscode.window.showInformationMessage("Vagrant VM started");

        executeSSHCommandPromise("ls -l", identityFile).then(() =>
          executeSSHCommandPromise("cd tests", identityFile).then(() =>
            executeSSHCommandPromise(`ls`, identityFile)
          )
        );
      });
    }
  );
  

  function executeSSHCommandPromise(command: string, identityFile: string) {
    return new Promise((resolve, reject) => {
      exec(
        `ssh -i ${identityFile} -p 2222 vagrant@127.0.0.1 "${command}"`,
        (error, stdout, stderr) => {
          if (error) {
            vscode.window.showErrorMessage(`SSH Error: ${error.message}`);
            reject(error);
            return;
          }
          if (stderr) {
            vscode.window.showErrorMessage(`SSH Stderr: ${stderr}`);
            reject(stderr);
            return;
          }

          const outputChannel =
            vscode.window.createOutputChannel("Vagrant SSH");
          outputChannel.show(true);
          outputChannel.append(stdout);

          resolve(stdout);
        }
      );
    });
  }

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

  const runAnotherCommand = vscode.commands.registerCommand(
    "extension.runAnotherCommand",
    () => {
      vscode.window
        .showInputBox({
          prompt: "Enter the project to run rulekeeper",
        })
        .then((project) => {
          if (project) {
            sendCommandToTerminal(`cd ${project} && ls`);
          }
        });
    }
  );
  // Function to find the Vagrantfile in the workspace
  function getVagrantfileDirectory(): string | null {
    const workspaceFolders = vscode.workspace.workspaceFolders;

    if (workspaceFolders && workspaceFolders.length > 0) {
      const rootPath = workspaceFolders[0].uri.fsPath;
      const vagrantfilePath = path.join(rootPath, "Vagrantfile");

      // Check if the Vagrantfile exists
      if (fs.existsSync(vagrantfilePath)) {
        return rootPath; // Return the directory containing the Vagrantfile
      } else {
        vscode.window.showErrorMessage("Vagrantfile not found in the workspace.");
        return null;
      }
    } else {
      vscode.window.showErrorMessage("No workspace is open.");
      return null;
    }
  }


  // Copying files from local to VM 
  function copyFileToVagrantDirectory(localPath: string, remotePath: string) {
    vscode.window.showInformationMessage("Hello...Im trying to copy now")
    if (!fs.existsSync(localPath)) {
      vscode.window.showErrorMessage("Local file does not exist.");
      return;
    }else{
      vscode.window.showErrorMessage("Local file exist.");
    }
    const config = {
      host: "127.0.0.1",
      port: 2222, // Vagrant SSH default port
      username: "vagrant",
      privateKey: require("fs").readFileSync("/Users/KY/.vagrant.d/insecure_private_keys/vagrant.key.rsa"), // Path to private key
    };
    
    //handling space in local Path 
    localPath = `${localPath}`
    console.log(localPath);

    Client.scp(localPath, { 
      host: config.host,
      port: config.port,
      username: config.username,
      privateKey: config.privateKey,
      path: remotePath,
    }, (err :any) => {
      vscode.window.showErrorMessage("SCP Callback reached")
      if (err) {
        vscode.window.showErrorMessage(`Failed to copy file: ${err.message}`);
      } else {
        vscode.window.showInformationMessage(`File copied to ${remotePath}`);
      }
    });
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
  // Function to copy files using SCP with Vagrant SSH config
  // async function copyFileUsingSCP(localFilePath: string, remoteFilePath: string) {
  //   try {
  //     const config = await getVagrantSSHConfig();
  
  //     Client.scp(localFilePath, {
  //       host: config.HostName,          // From vagrant ssh-config
  //       port: config.Port,              // From vagrant ssh-config
  //       username: config.User,          // From vagrant ssh-config
  //       privateKey: require("fs").readFileSync(config.IdentityFile),  // From vagrant ssh-config
  //       path: remoteFilePath,
  //     }, (err: any) => {
  //       if (err) {
  //         vscode.window.showErrorMessage(`Failed to copy file: ${err.message}`);
  //       } else {
  //         vscode.window.showInformationMessage(`File copied to ${remoteFilePath}`);
  //       }
  //     });
  //   } catch (err) {
  //     vscode.window.showErrorMessage(err.toString());
  //   }
  // }

  
  //Command to Copy files into SSH (Curently forced to be a certain location - future work to detect current location and copy work folder)
  const copyCommand = vscode.commands.registerCommand(
    "extension.copyToRemote", 
    () => {
      const destinationPath = "/home/vagrant/tests/MyCode/";
      vscode.window
        .showInputBox({
          prompt: "Enter the local path to your project",
        })
        .then((localPath) => {
          if (localPath) {
            copyFileToVagrantDirectory(localPath, destinationPath);
          }
          
          
        }); 
      vscode.window.showInformationMessage("Hello...Im trying");
    }
  );



  context.subscriptions.push(runShell);
  context.subscriptions.push(vagrantUp);
  context.subscriptions.push(connectCommand);
  context.subscriptions.push(runAnotherCommand);
  context.subscriptions.push(copyCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {}
