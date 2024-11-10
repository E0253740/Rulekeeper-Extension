import * as vscode from "vscode";
import { exec } from "child_process";
import path from "path";
import fs from "fs";

export const visualizeJson = vscode.commands.registerCommand(
  "extension.fetchAndDisplayJSON",
  async () => {
    try {
      const project = await vscode.window.showInputBox({
        prompt: "Enter the project name",
      });

      if (!project) {
        vscode.window.showErrorMessage("No file path provided.");
        return;
      }
      fetchAndVisualize(project, "app-analysis-result.json", "static");
      fetchAndVisualize(project, "gdpr-manifest-parsed.json", "result");
    } catch (error) {
      vscode.window.showErrorMessage(`Error: ${error}`);
    }
  }
);

async function fetchAndVisualize(project: string, file: string, type: string) {
  const localPath = path.join(__dirname, "data.json");
  const basePath = "/home/vagrant/tests";

  const command = `scp rulekeeper_tests:${basePath}/${project}/${file} "${localPath}"`;

  // Step 2: Use scp to fetch JSON file from VM
  await new Promise((resolve, reject) => {
    exec(
      `scp rulekeeper_tests:${basePath}/${project}/${file} "${localPath}"`,
      (error, stdout, stderr) => {
        if (error) {
          vscode.window.showErrorMessage(`Failed to fetch JSON: ${stderr}`);
          return reject(error);
        }
        resolve(stdout);
      }
    );
  });

  // Step 3: Read and parse the JSON file
  const fileContent = fs.readFileSync(localPath, "utf-8");
  const jsonData = JSON.parse(fileContent);

  const table = `<table border="1" style="border-collapse:collapse; width:100%;"><tr><th>Key</th><th>Value</th></tr>${jsonToTable(
    jsonData
  )}</table>`;

  // Step 4: Display the table in a new VSCode webview
  const panel = vscode.window.createWebviewPanel(
    "jsonTable",
    `JSON Data Table - ${type}`,
    vscode.ViewColumn.One,
    {}
  );

  panel.webview.html = `<html><body>${table}</body></html>`;
}

type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
interface JSONObject {
  [key: string]: JSONValue;
}
interface JSONArray extends Array<JSONValue> {}

function jsonToTable(obj: any, parentKey = ""): string {
  let html = "";

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      html += `<tr><td colspan="2"><strong>Index: ${index}</strong></td></tr>`;
      html += jsonToTable(item, parentKey);
    });
  } else if (typeof obj === "object" && obj !== null) {
    for (const key in obj) {
      const fullKey = parentKey ? `${parentKey}.${key}` : key;
      const value = obj[key];

      if (typeof value === "object") {
        html += `<tr><td>${fullKey}</td><td>${jsonToTable(
          value,
          fullKey
        )}</td></tr>`;
      } else {
        html += `<tr><td>${fullKey}</td><td>${value}</td></tr>`;
      }
    }
  } else {
    html += `<tr><td>${parentKey}</td><td>${obj}</td></tr>`;
  }

  return html;
}
