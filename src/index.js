const program = require('commander');
const path = require('path');
const os = require("os");
const PromptService = require('./Services/PromptService');
const { createWriteStream } = require('fs');
const { writeFile, readFile } = require('fs/promises');
const { spawn } = require('child_process');

program
    .argument('<project>', 'project to run tests on')
    .option('-a, --all', 'Run every test')
    .action(async project => {
        const projects = await readFile(projectsPath,'utf-8').then(data => JSON.parse(data));
        // path to project from root.
        // if !project[project] throw an error, project not registered! run test-lab add <projectName> to set up your project
        // then we need to run test-lab...
        const logStream = createWriteStream('./logFile.json', { flags: 'a' });
        console.log(`Running tests on: ${project}`);
        // look up known project to find dir..
        const ls = spawn('ls');
        logStream.on('data', data => {
            console.log(data);
        })

        ls.stdout.pipe(logStream);
        // ls.stdout.on('data', (data) => {
        //   console.log(`stdout: ${data}`);
        // });
          
        ls.stderr.on('data', (data) => {
          console.error(`stderr: ${data}`);
          logStream.close();
        });
          
        ls.on('close', (code) => {
          console.log(`child process exited with code ${code}`);
        });

        const { all } = program.opts();
        if (all) { } // run everything for this project
        else { 
            // prompt the user to run tests in a certain directory
        }
    })

const AddProject = new program.Command('add')
    .description('add a project to run tests on')
    .argument('<projectName>', 'This will be the command you call to run tests')
    .option('--path [filePath]', 'file path to project directory')
    .action( async projectName => {
        let { path: filePath } = AddProject.opts();
        const userHomeDir = os.homedir();

         if (filePath) filePath = path.join(userHomeDir,filePath);
         else {
            // prompt the user to pick a file path to set as the root directory.
            await new PromptService()
                .file('Choose path to project\'s root directory', { root: userHomeDir, onlyShowDir: true })
                .ask()
                .then(({ file }) => filePath = file);
        }
        const projectsPath = path.join(__dirname, '../data/projects.json') 

        const projects = await readFile(projectsPath,'utf-8').then(data => JSON.parse(data));
        projects[projectName] = filePath;
        await writeFile(projectsPath, JSON.stringify(projects, null, 2))

        console.log(`Added "${projectName}" to known projects`);
    });

program.addCommand(AddProject);
program.parse();