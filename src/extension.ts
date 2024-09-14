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

let terminal: vscode.Terminal | null = null;

function createTerminal() {
  if (terminal) {
    // 如果已经存在终端，则重新使用
    terminal.show();
    return;
  }

  // 创建新的 VSCode 终端
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
      createTerminal();
      vscode.window.showInformationMessage("SSH connection established.");
      sendCommandToTerminal("ls");
      sendCommandToTerminal("cd tests");
      sendCommandToTerminal("ls");
    }
  );

  context.subscriptions.push(runShell);
  context.subscriptions.push(vagrantUp);
  context.subscriptions.push(connectCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {}
