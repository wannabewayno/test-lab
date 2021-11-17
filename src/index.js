const program = require('commander');
const path = require('path');
const PromptService = require('./Services/PromptService');
const { createWriteStream } = require('fs');
const { writeFile, readFile } = require('fs/promises');
const { spawn } = require('child_process');

program
    .argument('<project>', 'project to run tests on')
    .option('-a, --all', 'Run every test')
    .action(async project => {
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

program
    .command('add')
    .description('add a project to run tests on')
    .argument('<projectName>', 'This will be the command you call to run tests')
    .option('--path [file path]', 'file path to project directory')
    .action( async projectName => {
        console.log(`Adding "${projectName}" to known projects`);
        let { path: filePath } = program.opts();
        // open a file prompt to 
        // if (!filePath) {
        //     // prompt the user to pick a file path to set as the root directory.
        //     await new PromptService()
        //         .file('Choose path to project\'s root directory', { root: })
        //         .ask()
        //         .then(({ file }) => filePath = file);
        // }
        console.log(path.parse(__dirname));
        const { root } = path.parse(__dirname);
        const result = path.join(root,'/Users/wayne');
        console.log(result);
        if (!filePath) {
        //     // prompt the user to pick a file path to set as the root directory.
            await new PromptService()
                .fileSearch('Choose path to project\'s root directory', {
                    excludePath: path => (/node_modules/).test(path),
                    excludeFilter: path => (/\\\./).test(path),
                    rootPath: result,
                    itemType: 'directory',
                    depthLimit: 3,
                })
                .ask()
                .then(({ fileSearch }) => filePath = fileSearch);
        }
        //  if (!filePath) {
        //     // prompt the user to pick a file path to set as the root directory.
        //     await new PromptService()
        //         .file('Choose path to project\'s root directory', { root: result })
        //         .ask()
        //         .then(({ file }) => filePath = file);
        // }
        console.log({ filePath });
        const projectsPath = path.join(__dirname, '../data/projects.json') 

        const projects = await readFile(projectsPath,'utf-8').then(data => JSON.parse(data));
        projects[projectName] = filePath;
        console.log(projects);
        await writeFile(projectsPath, JSON.stringify(projects, null, 2))
    });

program.parse();