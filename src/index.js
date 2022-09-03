const program = require('commander');
const path = require('path');
const commands = path.join(__dirname, './commands');

const handler = () => async function(...args) { require(path.join(commands, this._name))(...args); }

program
    .argument('[project]', 'project to run tests on')
    .option('-a, --all', 'Run every test')
    .action(handler());

const AddProject = new program.Command('add')
    .description('add a project to run tests on')
    .argument('<projectName>', 'This will be the command you call to run tests')
    .option('--path [filePath]', 'file path to project directory')
    .option('-a, --all [String]', 'It\'s meant to be a string')
    .action(handler());

const Default = new program.Command('default')
    .description('Set a default project!')
    .argument('[projectName]', 'This will be the command you call to run tests')
    .action(handler());

program
.addCommand(AddProject)
.addCommand(Default);

program.parse();