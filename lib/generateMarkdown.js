const licenses = require("./licenses");

// Helper function to create a link to content in markdown
function renderLink(content, link) {
  return `[${content}](${link})`;
}

// Helper function to render a 'license' badge using img.shields.io
function renderLicenseBadge({ license }) {
  const url = new URL(`badge/License-${license}-blue`, "https://img.shields.io");
  const badge = renderBadge("License", url.toString());
  const link = licenses[license];
  return link ? renderLink(badge, link) : badge;
}

// Helper function to render a 'version' badge using img.shields.io
function renderVersionBadge({ version }) {
  const url = new URL(`badge/Version-${version}-blue`, "https://img.shields.io");
  return renderBadge("Version", url.toString());
}

// Helper function to render a 'top language' badge using img.shields.io
// Currently only for github accounts
function renderLanguageBadge({ username, repository, source }) {
  if (source !== "github.com") return "";
  const url = new URL(
    `github/languages/top/${username}/${repository}`,
    "https://img.shields.io"
  );
  url.searchParams = new URLSearchParams("style", "flat-square");
  return renderBadge("Github Top Language", url.toString());
}

function renderBadge(title, url) {
  return `![${title}](${url})`;
}

function generateMarkdown(data) {
  return `# ${data.title}

${renderLicenseBadge(data)} 
${data.repository ? renderLanguageBadge(data) : ""}
${data.version ? renderVersionBadge(data) : ""}

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
Project license: ${
    licenses[data.license] ? renderLink(data.license, licenses[data.license]) : data.license
  }. Copyright ${data.name} ${new Date().getFullYear()}

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
  )}).

For any further questions you can contact me [here](${data.email}).

`;
}

module.exports = generateMarkdown;
