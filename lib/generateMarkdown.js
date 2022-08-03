// TODO: Create a function that returns a license badge based on which license is passed in
// If there is no license, return an empty string
function renderLicenseBadge({ license }) {
  const url = new URL(`badge/License-${license}-blue`, "https://img.shields.io").toString();
  return `[![License](${url})](${url})`;
}

function renderVersionBadge({ version }) {
  const url = new URL(`badge/Version-${version}-blue`, "https://img.shields.io").toString();
  return `[![Version](${url})](${url})`;
}

function renderLanguageBadge({ username, repository }) {
  const url = new URL(
    `github/languages/top/${username}/${repository}`,
    "https://img.shields.io"
  );
  url.searchParams = new URLSearchParams("style", "flat-square");
  return `![Github Top Language](${url.toString()})`;
}

// TODO: Create a function that returns the license link
// If there is no license, return an empty string
function renderLicenseLink(license) {}

// TODO: Create a function that returns the license section of README
// If there is no license, return an empty string
function renderLicenseSection(license) {}

// TODO: Create a function to generate markdown for README
function generateMarkdown(data) {
  return `# ${data.title}

${renderLicenseBadge(data)} 
${renderLanguageBadge(data)}
${renderVersionBadge(data)}

## Description
${data.description}

## Table of Contents
- [Installation](#installation)
- [Usage](#usage)
- [License](#license)
- [Contributing](#contributing)
- [Tests](#tests)
- [Questions](#questions)

## Installation
To install necessary dependencies, run the following command:
\`\`\`bash
${data.installation}
\`\`\`

## Usage
${data.usage}

## License
Project license: ${data.license}. Copyright ${data.name} ${new Date().getFullYear()}

## Contributing
${data.contributing}

## Tests
To run tests, run the following command:
\`\`\`bash
${data.tests}
\`\`\`

## Questions
For any questions about the project, please raise an issue at [this issues page](${new URL(
    data.username + "/" + data.repository + "/issues",
    "https://github.com"
  )})
For any further questions you can contact me [here](${data.email})

`;
}

module.exports = generateMarkdown;
