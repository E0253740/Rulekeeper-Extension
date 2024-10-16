import { spawn, ChildProcessWithoutNullStreams } from "child_process";

export async function runCommandAndCaptureOutput(
  identityFile: string,
  command: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const sshProcess = spawn("ssh", [
      "-i",
      identityFile,
      "-p",
      "2222",
      "vagrant@127.0.0.1",
      command,
    ]);
    let output = "";
    sshProcess.stdout.on("data", (data) => {
      output += data.toString();
    });
    // sshProcess.stderr.on('data', (data) => {
    //     output += data.toString();
    // });
    sshProcess.on("close", (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(`Command failed with code ${code}: ${output}`);
      }
    });
  });
}
