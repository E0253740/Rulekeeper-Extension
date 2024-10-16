import * as vscode from "vscode";
import { exec } from "child_process";
import * as path from "path";

const filePath = path.join(__dirname, "..", "test.sh");

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
