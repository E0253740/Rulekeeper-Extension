import * as vscode from "vscode";
import { exec } from "child_process";
import * as path from "path";

const filePath = path.join(__dirname, "..", "test.sh");

const vagrantPath = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "rulekeeper",
  "Usability Tests"
);

export const runShell = vscode.commands.registerCommand(
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

const identityFile =
  //"C:/Users/m1560/.vagrant.d/insecure_private_keys/vagrant.key.rsa";
  "/Users/KY/.vagrant.d/insecure_private_keys/vagrant.key.rsa";

export const vagrantUp = vscode.commands.registerCommand(
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
        const outputChannel = vscode.window.createOutputChannel("Vagrant SSH");
        outputChannel.show(true);
        outputChannel.append(stdout);

        // 解析命令执行成功
        resolve(stdout);
      }
    );
  });
}
