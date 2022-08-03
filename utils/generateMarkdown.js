// TODO: Create a function that returns a license badge based on which license is passed in
// If there is no license, return an empty string
function renderLicenseBadge(license) {
  const url = new URL(`badge/License-${license}-blue`, "https://img.shields.io").toString();
  return `[![License](${url})](${url})`;
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

${renderLicenseBadge(data.license)} 

## Description
${data.description}

## Table of Contents
- [Installation](#installation)
- [Usage](#usage)
- [Credits](#credits)
- [License](#license)

## Installation

## Usage

Lorem, ipsum dolor sit amet consectetur adipisicing elit. Amet vitae aut, laboriosam repellat iusto doloribus, vero exercitationem sed aperiam repellendus quas id voluptate ipsam unde 

## Credits

## License
${data.licenseDescription}
`;
}

module.exports = generateMarkdown;
