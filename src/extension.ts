// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { exec } from "child_process";
import * as path from "path";
import { spawn, ChildProcessWithoutNullStreams } from "child_process";

const filePath = path.join(__dirname, "..", "src", "test.sh");
const vagrantPath = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "rulekeeper",
  "Usability Tests"
);
const identityFile =
  "C:/Users/m1560/.vagrant.d/insecure_private_keys/vagrant.key.rsa";

let sshProcess: ChildProcessWithoutNullStreams | null = null;

// create persistent SSH session
function createPersistentSSH(
  identityFile: string
): ChildProcessWithoutNullStreams {
  return spawn("ssh", [
    "-t",
    "-i",
    identityFile,
    "-p",
    "2222",
    "vagrant@127.0.0.1",
  ]);
}

// send commend to ssh session
function sendCommandToSSH(command: string) {
  if (sshProcess) {
    sshProcess.stdin.write(`${command}\n`);
  } else {
    vscode.window.showErrorMessage("SSH connection is not established.");
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

  let runShell = vscode.commands.registerCommand(
    "extension.runShellScript",
    () => {
      const bashPath = "D:\\Git\\usr\\bin\\bash.exe";
      // Run shell script with git bash
      exec(`"${bashPath}" "${filePath}"`, (error, stdout, stderr) => {
        if (error) {
          vscode.window.showErrorMessage(`Error: ${stderr}`);
          // vscode.window.showErrorMessage(`Error: ${filePath}`);
        } else {
          vscode.window.showInformationMessage(`Output: ${stdout}`);
        }
      });
    }
  );

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

          // 输出结果
          const outputChannel =
            vscode.window.createOutputChannel("Vagrant SSH");
          outputChannel.show(true);
          outputChannel.append(stdout);

          // 解析命令执行成功
          resolve(stdout);
        }
      );
    });
  }

  // command for persistentVagrantSsh
  const connectCommand = vscode.commands.registerCommand(
    "extension.persistentVagrantSsh",
    () => {
      // create persistent ssh connection
      sshProcess = createPersistentSSH(identityFile);

      const outputChannel = vscode.window.createOutputChannel("Vagrant SSH");

      // capture SSH output and show in VSCode output window
      sshProcess.stdout.on("data", (data) => {
        outputChannel.show(true);
        outputChannel.append(data.toString());
      });

      // capture error information
      sshProcess.stderr.on("data", (data) => {
        vscode.window.showErrorMessage(`SSH Error: ${data.toString()}`);
      });

      // when close SSH session
      sshProcess.on("close", (code) => {
        vscode.window.showInformationMessage(
          `SSH session closed with code ${code}`
        );
        sshProcess = null; // 清空 SSH 进程状态
      });

      // send first command after connection
      vscode.window.showInformationMessage("SSH connection established.");
      sendCommandToSSH("ls");
      sendCommandToSSH("cd tests");
      sendCommandToSSH("ls");
    }
  );

  context.subscriptions.push(runShell);
  context.subscriptions.push(vagrantUp);
  context.subscriptions.push(connectCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {}
