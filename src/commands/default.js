const path = require('path');
const PromptService = require('../Services/PromptService');
const { writeFile, readFile } = require('fs/promises');
const projectsPath = path.join(__dirname, '../../data/projects.json');

/**
 * $ test-lab <projectName>
 * @param {String} projectName - Name of project to use as default
 */
module.exports = async projectName => {
    const projects = await readFile(projectsPath,'utf-8').then(data => JSON.parse(data));

    // if no projectName prompt user for project.
    if (!projects[projectName] || !projectName) {
        projectName = await new PromptService()
            .choice('Choose a project to set as default', Object.keys(projects))
            .ask()
            .then(({ choice }) => choice);
    }
    if (!projectName) throw new Error('You must specifiy a project name');

    projects.default = projectName;
    await writeFile(projectsPath, JSON.stringify(projects, null, 2))

    console.log(`"${projectName}" is now your default project`);
};