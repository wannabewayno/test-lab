const path = require('path');
const os = require("os");
const PromptService = require('../Services/PromptService');
const { writeFile, readFile } = require('fs/promises');
const projectsPath = path.join(__dirname, '../../data/projects.json');

/**
 * $ test-lab add <projectName> [--path: String]
 * @param {String} projectName - Name of the project to add [Required]
 * @param {Object} options - Options
 * @param {String} [options.path] - Absolute Path to file from users home directory
 */
module.exports = async (projectName, { path: filePath }) => {
    const userHomeDir = os.homedir();

     if (filePath) filePath = path.join(userHomeDir, filePath);
     else {
        // prompt the user to pick a file path to set as the root directory.
        await new PromptService()
            .file('Choose path to project\'s root directory', { root: userHomeDir, onlyShowDir: true })
            .ask()
            .then(({ file }) => filePath = file);
    }

    const projects = await readFile(projectsPath, 'utf-8').then(data => JSON.parse(data));
    projects[projectName] = filePath;
    if (!projects.default) projects.default = projectName;
    await writeFile(projectsPath, JSON.stringify(projects, null, 2))

    console.log(`Added "${projectName}" to known projects`);
};