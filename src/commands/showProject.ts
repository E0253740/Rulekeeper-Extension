import { runCommandAndCaptureOutput } from "./spawnConnection";

export const showProject = async (identityFile: string) => {
  let availableProjects = await runCommandAndCaptureOutput(
    identityFile,
    "cd tests && ls"
  );

  let projectList: string[] = availableProjects.split("\n");

  // exclude non project items
  const nonProjectItems = ["", "rulekeeper", "run.sh", "setup.sh"];

  projectList = projectList.filter(
    (item) => nonProjectItems.indexOf(item) === -1
  );

  return projectList;
};
