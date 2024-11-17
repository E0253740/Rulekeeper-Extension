import * as vscode from "vscode";
const Client = require('ssh2-sftp-client');
import * as fs from "fs";
import * as path from "path";

export async function copyFileToVagrantDirectory(localPath: string, remotePath: string, identityFile: string,) {
    if (!fs.existsSync(localPath)) {
            vscode.window.showErrorMessage("Local file does not exist.");
            return;
        } else {
            vscode.window.showInformationMessage("Local file exist.");
        }
    const sftp = new Client();

    const privateKeyPath = path.resolve(identityFile);
    const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

    const config = {
        host: "127.0.0.1",
        port: 2222,
        username: "vagrant",
        privateKey: privateKey,
    };

    try {
        await sftp.connect(config);

        await sftp.uploadDir(localPath, remotePath);
        vscode.window.showInformationMessage(`File copied to ${remotePath} successfully!`);
    } catch (err: any) {
        vscode.window.showErrorMessage(`Failed to copy file: ${err.message}`);
    } finally {
        await sftp.end();
    }
}

// Obsolete due to scp2 is an obsolete package
  // function copyFileToVagrantDirectory(localPath: string, remotePath: string) {
  //   vscode.window.showInformationMessage("Hello...Im trying to copy now");
  //   if (!fs.existsSync(localPath)) {
  //     vscode.window.showErrorMessage("Local file does not exist.");
  //     return;
  //   } else {
  //     vscode.window.showInformationMessage("Local file exist.");
  //   }
  //   const config = {
  //     host: "127.0.0.1",
  //     port: 2222, // Vagrant SSH default port
  //     username: "vagrant",
  //     privateKey: fs.readFileSync("/Users/KY/.vagrant.d/insecure_private_keys/vagrant.key.rsa"), // Path to private key
  //   };
    
  //   //handling space in local Path
  //   localPath = `${localPath}`;
  //   console.log(localPath);
  //   console.log(config);

  //   // const Client = require('scp2');
  //   console.log(Client.scp);
  //   Client.on('error', (err: any) => {
  //     console.error("Global SCP error:", err);
  //   });
  //   Client.defaults({ debug: (msg: any) => console.log(`[DEBUG] ${msg}`) });
  //   console.log("Starting SCP transfer...");
  //   Client.scp(
  //     localPath,
  //     {
  //       host: config.host,
  //       port: config.port,
  //       username: config.username,
  //       privateKey: config.privateKey,
  //       path: remotePath,
  //       timeout: 10000
  //     },
  //     (err: any) => {
  //       vscode.window.showInformationMessage("SCP Callback reached");
  //       if (err) {
  //         vscode.window.showErrorMessage(`Failed to copy file: ${err.message}`);
  //       } else {
  //         vscode.window.showInformationMessage(`File copied to ${remotePath}`);
  //       }
  //     }
  //   );
  //   console.log("im done....")
  // }


