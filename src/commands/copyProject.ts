import * as vscode from "vscode";
import { exec } from "child_process";

export const copyFileWindows = vscode.commands.registerCommand(
  "extension.copyFolderToVagrant",
  async () => {
    // get local file path
    const folderPath = await vscode.window.showInputBox({
      prompt: "Enter the folder path to copy to Vagrant VM",
    });

    if (!folderPath) {
      vscode.window.showErrorMessage("No folder path provided!");
      return;
    }

    const vagrantPath = "/home/vagrant/tests"; // copied under this path

    const command = `scp -r "${folderPath}" rulekeeper_tests:${vagrantPath}`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        vscode.window.showErrorMessage(
          `Error copying folder: ${error.message}`
        );
        return;
      }
      vscode.window.showInformationMessage(
        "Folder copied to Vagrant VM successfully!"
      );
    });
  }
);
