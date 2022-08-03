const fs = require("fs").promises;
const path = require("path");
const inquirer = require("inquirer");
const generateMarkdown = require("./utils/generateMarkdown");

const questions = [];

async function fileExists(pathName) {
  try {
    return await fs.stat(pathName);
  } catch (error) {
    return false;
  }
}

function iterateFileName(fileName) {
  const readme = fileName.split(".")[0];
  const iteration = parseInt(readme.split("README")[1] || 0);
  let newIteration = (iteration + 1).toString();
  newIteration = newIteration.padStart(2, "0");
  return "README" + newIteration + ".md";
}

async function generateNewFileName(folder, fileName) {
  let i = 0;
  let newFile = fileName;
  while (true) {
    newFile = iterateFileName(newFile);
    const exists = await fileExists(path.resolve(folder, newFile));
    if (!exists) return newFile;
    i++;
    if (i > 10) return null;
  }
}

async function handleFileConflict(folder, fileName) {
  let filePath = path.resolve(folder, fileName);
  const exists = await fileExists(filePath);
  if (!exists) return filePath;
  const { option } = await inquirer.prompt([
    {
      type: "list",
      name: "option",
      message: "File already exists!",
      choices: ["Create new file", "Overwrite", "Cancel"],
    },
  ]);
  let newFile;
  switch (option) {
    case "Create new file":
      newFile = await generateNewFileName(folder, fileName);
      break;
    case "Overwrite":
      newFile = fileName;
      break;
    default:
      return null;
  }
  return path.resolve(folder, newFile);
}

async function writeToFile(fileName, data) {
  try {
    const folder = path.resolve(
      "generated-readme",
      data.title.trim().toLowerCase().replace(" ", "-")
    );
    const filePath = await handleFileConflict(folder, fileName);
    if (!filePath) return console.log("Application cancelled");
    await fs.mkdir(folder, { recursive: true });
    await fs.writeFile(filePath, data.body, { encoding: "utf-8" });
  } catch (error) {
    console.log(error);
  }
}

async function init() {
  const answers = await inquirer.prompt([
    { type: "input", name: "title", message: "Application Name" },
    { type: "input", name: "description", message: "Application description:" },
    {
      type: "list",
      name: "license",
      message: "Select applicable license",
      choices: [
        "MIT License",
        "GNU AGPLv3",
        "GNU GPLv3",
        "GNU LGPLv3",
        "Mozilla Public License 2.0",
        "Apache License 2.0",
        "Boost Software License 1.0",
      ],
    },
    {
      type: "input",
      name: "licenseDescription",
      message: "Provide license/copyright description",
    },
  ]);
  const markdown = generateMarkdown(answers);
  writeToFile("README.md", { title: answers.title, body: markdown });
}

init();
