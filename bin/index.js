#!/usr/bin/env node

const fs = require("fs").promises;
const path = require("path");
var argv = require("minimist")(process.argv.slice(2));
const inquirer = require("inquirer");
const simpleGit = require("simple-git");
const GitUrlParse = require("git-url-parse");
const generateMarkdown = require("../lib/generateMarkdown");

const git = simpleGit();

const questions = [
  { type: "input", name: "name", message: "Your name:" },
  { type: "input", name: "email", message: "Your email address:" },
  { type: "input", name: "username", message: "Remote repository username:" },
  { type: "input", name: "title", message: "Application Name" },
  { type: "input", name: "description", message: "Application description:" },
  {
    type: "list",
    name: "license",
    message: "Select applicable license:",
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
    name: "installation",
    message: "Commands required to install application:",
    default: "npm i",
  },
  {
    type: "input",
    name: "usage",
    message: "Provide usage information:",
  },
  {
    type: "input",
    name: "contributing",
    message: "Provide information on how a developer may contribute to the project:",
  },
  {
    type: "input",
    name: "tests",
    message: "Commands required to run tests:",
    default: "npm test",
  },
];

function filterQuestions(data) {
  const provided = Object.keys(data);
  return questions.filter(question => !provided.includes(question.name));
}

function provideDefaultsToQuestions(data) {
  return questions.map(question => ({
    ...question,
    default: data[question.name] ? data[question.name] : question.default,
  }));
}

function parseGitUrl(url) {
  if (!url) return {};
  const { source, name, owner } = GitUrlParse(url);
  return { source, repository: name, username: owner };
}

async function getPackageJSONData() {
  const package = await fs.readFile("package.json");
  const json = JSON.parse(package.toString());
  const data = {};
  if (json.version) {
    data.version = json.version;
  }
  if (json.license) {
    data.license = json.license;
  }
  return data;
}

async function getProjectData() {
  const { value: url } = await git.getConfig("remote.origin.url");
  const { value: email } = await git.getConfig("user.email");
  const { value: name } = await git.getConfig("user.name");
  const urlInfo = parseGitUrl(url);
  const packageJSON = await getPackageJSONData();
  const title = process.cwd().split(path.sep).pop();
  return { ...urlInfo, ...packageJSON, email, name, title };
}

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

async function generateNewFileName(fileName) {
  let i = 0;
  let newFile = fileName;
  while (true) {
    newFile = iterateFileName(newFile);
    const exists = await fileExists(path.resolve(newFile));
    if (!exists) return newFile;
    i++;
    if (i > 10) return null;
  }
}

async function handleFileConflict(fileName) {
  let filePath = path.resolve(fileName);
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
      newFile = await generateNewFileName(fileName);
      break;
    case "Overwrite":
      newFile = fileName;
      break;
    default:
      return null;
  }
  return path.resolve(newFile);
}

async function writeToFile(fileName, data) {
  try {
    const filePath = await handleFileConflict(fileName);
    if (!filePath) return console.log("Application cancelled");
    await fs.writeFile(filePath, data.body, { encoding: "utf-8" });
  } catch (error) {
    console.log(error);
  }
}

async function init() {
  const projectData = await getProjectData();
  const questions = argv.y
    ? filterQuestions(projectData)
    : provideDefaultsToQuestions(projectData);
  const answers = await inquirer.prompt(questions);
  const consolidatedData = { ...projectData, ...answers };
  const markdown = generateMarkdown(consolidatedData);
  writeToFile("README.md", { title: consolidatedData.title, body: markdown });
}

init();