# Rulekeeper Extension for Visual Studio Code

This is the README for the rulekeeper plugin, which is used for user to check if their project is GDPR compliant based on the rulekeeper algorithm. This plugin helps to connect your local machine to the virtual machine containing the rulekeeper algorithm.

## Configurations

- To connect the virtual machine, your rsa key is required for ssh connection. Configure the local file path in settings: **Rulekeeper** › **Connection**: **Rsa File**

## Features

Below are the features this plugin can bring you.

- connect to the virtual machine
- Check available projects in the VM
- Copy code folder into virtual machine (Your entire code folder needs to be in the virtual machine for the rulekeeper to assess the compliant)
- Run Rulekeeper
  Describe specific features of your extension including screenshots of your extension in action. Image paths are relative to this README file.
- Visualize RuleKeeper results in table format

## Requirements

Before running this plugin, you will need to have Vagrant and VirtualBox installed. It is needed to connect your local machine to the virtual machine containing the rulekeeper algorithm. Also, remember to start your virtual machine by running `vagrant up` in your bash terminal, the path should be where your Vagrantfile is saved at.

## Extension Settings

- `extension.runShellScript`: run shell script
- `extension.persistentVagrantSsh`: connect to Vagrant persistently
- `extension.copyToRemote`: copy local projects into VM (MacOS)
- `extension.copyFolderToVagrant`: copy local projects into VM (for all OS)
- `extension.activatePlugin`: run rulekeeper on project

## Release Notes

Release history for RuleKeeper Extension

### 1.0.0

Initial release of RuleKeeper Extension
