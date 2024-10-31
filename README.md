# Rulekeeper Extension for Visual Studio Code

This is the README for the rulekeeper plugin, which is used for user to check if their project is GDPR compliant based on the rulekeeper algorithm. This plugin helps to connect your local machine to the virtual machine containing the rulekeeper algorithm.

## Configurations

- To connect the virtual machine, your rsa key is required for ssh connection. Configure the local file path in settings: **Rulekeeper** › **Connection**: **Rsa File**

## Features

Below are the features this plugin can bring you.

- connect to the virtual machine
- Copy code folder into virtual machine (Your entire code folder needs to be in the virtual machine for the rulekeeper to assess the compliant)
- Run Rulekeeper
  Describe specific features of your extension including screenshots of your extension in action. Image paths are relative to this README file.
- Check available projects in the VM

For example if there is an image subfolder under your extension project workspace:

\!\[feature X\]\(images/feature-x.png\)

> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow.

## Requirements

Before running this plugin, you will need to have Vagrant and VirtualBox installed. It is needed to connect your local machine to the virtual machine containing the rulekeeper algorithm. Also, remember to start your virtual machine by running `vagrant up` in your bash terminal.

## Extension Settings

- `extension.runShellScript`: run shell script
- `extension.persistentVagrantSsh`: connect to Vagrant persistently
- `extension.copyToRemote`: copy local projects into VM
- `extension.activatePlugin`: run rulekeeper on project

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of ...

### 1.0.1

Fixed issue #.

### 1.1.0

Added features X, Y, and Z.

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

- [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

- Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
- Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
- Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

- [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
- [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
