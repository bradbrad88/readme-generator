#!/usr/bin/env node

const fs = require("fs").promises;
const ff = require("fs");
const path = require("path");
var argv = require("minimist")(process.argv.slice(2));
const inquirer = require("inquirer");
const simpleGit = require("simple-git");
const GitUrlParse = require("git-url-parse");
const generateMarkdown = require("../lib/generateMarkdown");

// Create git object for checking if app is executed in a git repository and accessing config (name, email, origin-url)
const git = simpleGit();

// Promise a boolean value on whether current directory is in a git repository
let isGitRepo = new Promise(resolve => {
  // If app is not launched in a git repo then quit
  git.checkIsRepo().then(res => {
    resolve(res);
  });
});

// Promise a boolean value on whether we're in the root directory of npm repo by checking for package.json file
let isNpmRepo = new Promise(resolve => {
  resolve(!ff.existsSync("package.json"));
});

// Questions to prompt user
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

// Filter out questions that the program was already able to gather data for
// Only runs if program run with -y flag
function filterQuestions(data) {
  const provided = Object.keys(data);
  return questions.filter(question => !provided.includes(question.name));
}

// Dynamically add default answers to questions based on information the program could find through git, package.json and directory structure
function provideDefaultsToQuestions(data) {
  return questions.map(question => ({
    ...question,
    default: data[question.name] ? data[question.name] : question.default,
  }));
}

// Obtain source, repository and username of remote origin from url
function parseGitUrl(gitData) {
  if (!gitData.url) return {};
  const { source, name, owner } = GitUrlParse(gitData.url);
  return { source, repository: name, username: owner };
}

async function getGitData() {
  if (!(await isGitRepo)) return {};
  const { value: url } = await git.getConfig("remote.origin.url");
  const { value: email } = await git.getConfig("user.email");
  const { value: name } = await git.getConfig("user.name");
  return { url, email, name };
}

// Obtain version and license information from package.json file
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
  if (json.description) {
    data.description = json.description;
  }
  return data;
}

function formatFolderAsTitle(title = "") {
  const titleWithSpaces = title.replace(/[\W_]/gi, " ");
  const regex = /^(.)|(?<=\s)./gi;
  return titleWithSpaces.replace(regex, val => val.toUpperCase());
}

// Run through a series of functions to automatically obtain data and save unneccessary user input
async function getProjectData() {
  const packageJSON = await getPackageJSONData();
  const gitData = await getGitData();
  const urlInfo = parseGitUrl(gitData);
  const title = formatFolderAsTitle(process.cwd().split(path.sep).pop());
  return { ...packageJSON, ...urlInfo, ...gitData, title };
}

// Util function to check if a file exists
async function fileExists(pathName) {
  try {
    return await fs.stat(pathName);
  } catch (error) {
    return false;
  }
}

// In the case of filename conflict, this function will take a string of README####.md and iterate it, eg: README.md => README01.md => README02.md
function iterateFileName(fileName) {
  const readme = fileName.split(".")[0];
  const iteration = parseInt(readme.split("README")[1] || 0);
  let newIteration = (iteration + 1).toString();
  newIteration = newIteration.padStart(2, "0");
  return "README" + newIteration + ".md";
}

// Return a README##.md filepath that doesn't conflict with any files in directory
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

// Provide the user with options on how to handle a README.md file that already exists
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

// Create the README file
async function writeToFile(fileName, data) {
  try {
    const filePath = await handleFileConflict(fileName);
    if (!filePath) return console.log("Application cancelled");
    await fs.writeFile(filePath, data.body, { encoding: "utf-8" });
  } catch (error) {
    console.log(error);
  }
}

// Initialise app
async function init() {
  // Get data automatically from package.json, git config variables and root directory
  const projectData = await getProjectData();
  // Create questions array based off the global constant 'questions'
  // Edited based on user input when app initialised
  // If -y flag is used, then filter out questions that we could already gather data for
  // Default mode will leave all questions in but add default answers to information we were able to gather
  const questions = argv.y
    ? filterQuestions(projectData)
    : provideDefaultsToQuestions(projectData);
  const answers = await inquirer.prompt(questions);
  const consolidatedData = { ...projectData, ...answers };
  const markdown = generateMarkdown(consolidatedData);
  writeToFile("README.md", { title: consolidatedData.title, body: markdown });
}

init();
