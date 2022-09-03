const path = require('path');
const glob = require('glob');
const colors = require('colors');
const os = require("os");
const PromptService = require('../Services/PromptService');
const { loopChoose, separator } = require('../Services/PromptService');
const { createWriteStream } = require('fs');
const { writeFile, readFile } = require('fs/promises');
const { spawn } = require('child_process');
const projectsPath = path.resolve(__dirname, '/src/data/projects.json');
const logs = path.join(__dirname,'../../tmp/');
const logFilePath = path.join(logs,'./log.json');
// const Cmd = require('../Services/Processes/Cmd');
const { exec } = require('child_process');
const { Transform } = require('stream');
const minimumFilesPerCPU = 24;
const bufferAmount = 4;

const runCmd = async cmd => new Promise((resolve, reject) => {
    const process = exec(cmd);
    process.on('close', code => {
        console.log(`${cmd} exited with code ${code}`);
        resolve();
    });
    process.on('error', err => {
        console.error(`${cmd} ran into an error!`);
        reject(err);
    });
});

module.exports = async (projectName, { all }) => {
    console.log({ projectName });
    console.log('Number Of CPUS:', os.cpus().length);
    const spareCPUS = os.cpus().slice(1);
    console.log('Number of Spare cpus:', spareCPUS.length);

    // we can use os.cpus() to work out how many child processes to spawn. Or workers to construct.
    const projects = await readFile(projectsPath,'utf-8').then(data => JSON.parse(data));
    if (!projectName) projectName = projects.default;
    project = projects[projectName];
    if (!project) throw new Error('project not registered! run test-lab add <projectName> to set up your project')

    // TODO perf_hooks to measure how long this takes overall.
    const srcDir = path.join(project, '/src').replace(/\\/g,'/');
    const files = new glob.sync(path.join(srcDir,'/**/*.test.js'));

    // how many processes to spin up
    const numberOfProcesses = Math.min(Math.round(files.length / minimumFilesPerCPU), spareCPUS.length);
    const filesPerProcess = Math.ceil(files.length / numberOfProcesses) + bufferAmount;
    // const processes =  new Array(numberOfProcesses).fill(null).map((_, index) => {
    //     const start = index * filesPerProcess;
    //     const end = (index + 1) * filesPerProcess;
    //     const testFiles = files.slice(start, end);
    //     return testFiles.map(fileName => fileName.replace(srcDir, ''));
    // });
    // console.log(processes);
    // ideally we'll want to have the same number of files per process...
    // each file could 100% be different... but on average this should be close.
    
    // ok we now have all the files per process to find and run. it would be best to collapse them into globs.
    // ideally we want one glob to encapsulate all files.
    // we also want to keep the same dirs per process to make things easy.
    // so... instead of chunking these first, chunk them last.
    const testFiles = files.reduce((obj, file, files) => {
        file = file.replace(srcDir, '');
        // TODO: Why use regex? use path.basename(file), path.dirname(file) etc...
        const [dir, fileName] = file.split(/\/(?=[\w.-]+$)/);
        if (!obj[dir]) obj[dir] = 0
        obj[dir]++
        return obj;
    }, {});

    console.log(testFiles);
    console.log({ numberOfProcesses, filesPerProcess });

    const { globs } = Object.entries(testFiles).reduce((globContainer, [glob, count], index, arr) => {
        const newTotal = globContainer.total + count;
        if (globContainer.globs.length < numberOfProcesses && newTotal > filesPerProcess) { // cap off this process and start a new one.
            globContainer.globs.unshift([]); // new process
            globContainer.total = 0; // reset count
            // we now need to turn these into a single glob.
        }
        globContainer.total += count;
        globContainer.globs[0].push(glob);
        return globContainer;
    }, { total: 0, process: 0, globs: [[]] });

    console.log(globs, globs.length);

    const uniquePaths = sets => {
        // so find all sets of size 1
        let uniquePaths = sets.filter(set => set.size === 1).flatMap(set => Array.from(set));
        // now with unique paths check to see if each path pops up more than once.
        uniquePaths = uniquePaths.map(path => {
            [index, ...others] = sets.map((set, index) => set.has(path) ? index : null).filter(v => v !== null);
            if (others.length) index = null;
            return [path, index]
        })
        return uniquePaths.filter(([_, index]) => index !== null);
    }

    /*
    /controller/AdminController/__test__:3
    first key: 'controller', fn = undefined
    so we pass down fn = (length, fn) => (() => controller)() + fn(length)
        then next key: AdminController, fn = Function
        length => fn(length, length => AdminController + fn(length))
            then next key is __test__
    */

    const globFromObject = (object, index, common, fn) => {
        console.log('\n',{ object, index });
        if (typeof object === 'number') return object;
        const keys = Object.keys(object);
        console.log({ keys })
        const strings = keys.map(key => {
            const commonKey = length => common[key]?.(length).includes(index) ? '' : `${key}`;
            const value = object[key];
            console.log({ key, value });
            if (typeof value === 'number') return fn(value, () => commonKey(value));
            const fnProp = fn
            ? (length, fn) => commonKey(length) + fn(length)
            : (length, fn) => fn(length) + commonKey(length)
            
            return globFromObject(value, index + 1, common, fnProp);
        });
        console.log({ strings });
        if (strings.length === 1) return `/${strings[0]}`;
        return `/{${strings.join(',')}}`;
    }

    // const singularGlobs = globs.map(globs => {
    //     // console.log(globs);
    //     // we need to split each glob, and walk through them.
    //     let back = [];
    //     let forward = [];
    //     let minLength = 0;
    //     globMap = globs.reduce((map, glob) => { 
    //         const splitGlob = glob.split('/').filter(v => v);
    //         minLength = Math.min(splitGlob.length, minLength||splitGlob.length); 
    //         splitGlob.reduce((map, path, index, arr) => {
    //             if (!back[Math.abs(index - arr.length + 1)]) back[Math.abs(index - arr.length + 1)] = new Set();
    //             if (!forward[index]) forward[index] = new Set();
    //             if (!map[path]) {
    //                 map[path] = arr.length - 1 === index ? arr.length : {};
    //             }

    //             back[Math.abs(index - arr.length + 1)].add(path);
    //             forward[index].add(path);
    //             return map[path];
    //         }, map)
    //         return map;
    //     }, {});
    //     // Filter out common patterns
    //     const commonBack = uniquePaths(back).map(([path, index]) => [path, length => length - index]);
    //     const commonForward = uniquePaths(forward).map(([path, index]) => [path, () => index]);
    //     const commonPaths = commonBack.concat(commonForward).reduce((obj, [path, fn]) => {
    //         if (!obj[path]) obj[path] = [fn];
    //         obj[path].push(fn);
    //         return obj;
    //     },{});

    //     for (const path in commonPaths) {
    //         const fns = commonPaths[path];
    //         commonPaths[path] = length => fns.map(fn => fn(length));
    //     }

    //     // const commonPaths = Array.from(new Set(commonBack.concat(commonForward))).map(path => path.split(':'));
    //     const bigGlob = new Array(minLength);
    //     // commonPaths.forEach(([path, index]) => bigGlob.splice(index, 1, path));


    //     // we then need splice common paths out of globs

    //     return { globs, commonPaths, minLength, bigGlob, globMap, glob: globFromObject(globMap, 0, commonPaths) };
    // });

    // console.dir(singularGlobs,{ depth: 3 });
    const testglob = '/{container,controllers/{,AdminController,AuthController,AuthEmailsController,ChatFlagsController,ChatMessagesController}}/__test__/*.test.js'
    const testFilesFromGlob = new glob.sync(path.join(srcDir,testglob)).reduce((obj, file, files) => {
        file = file.replace(srcDir, '');
        const [dir, fileName] = file.split(/\/(?=[\w.-]+$)/);
        if (!obj[dir]) obj[dir] = 0
        obj[dir]++
        return obj;
    }, {});
    console.log(testFilesFromGlob);

    const globMap = {
        container: { __test__: 2 },
        controllers: {
          __test__: 2,
          AdminController: { __test__: 3 },
          AuthController: { __test__: 3 },
        }
    }

    const commonPaths = {
        __test__: length => [length => length - 1].map(fn => fn(length)),
    }

    const result = globFromObject(globMap, 0, commonPaths);
    console.log(result);

    // const failedTests = {};
    // const array = [];
    // let passing = 0;
    // let failing = 0;
    // const printToArray = new Transform({
    //     transform(chunk, encoding, callback) {
    //         // This is where we check encoding...
    //         printToArray.push(chunk);
    //         const string = chunk.toString();
    //         const passes = string.match(/✔/);
    //         const fails = string.match(/ {4}\d+\)\s.+/);
    //         if (passes) passing += passes.length;
    //         if (fails) failing += fails.length;

    //         // Mocha will print out all failed context at the end, for progress tracking, we need to keep it lightweight.
    //         // TODO: dry run for totals? will need to...
    //         const failures = string.match(/(\d+\)\s.+\n)(.+\n)+(\s+at processImmediate \(internal\/timers\.js:461:21\))/g);

    //         // TODO: Format error file under suites... go into the suite open at the appropriate line and fix..., then re-run..
    //         if (failures) {
    //             failures.forEach(fail => {
    //                 // For each failure
    //                 let { error, file, suite, name } = {};
    //                 // find index for the error... splice it out
    //                 const lines = fail.split(/\n\s+/);
    //                 const errorIndex = lines.findIndex(line => (/(Error:).+/).test(line));
    //                 [name, ...suite] = lines.slice(0, errorIndex).reverse();
    //                 [error, file] = lines.slice(errorIndex);
    //                 const [filePath, line, column] = file.replace(/^.*\(|\).*$/g,'').split(':');
    //                 suite = suite.reverse().join(' -> ').replace(/^\d+\) /, match => {
    //                     name = match + name;
    //                     return ''
    //                 })
    //                 failedTests[name] = { pass: false, file: filePath, line, column, error, suite };
    //             });
    //         }
    //         callback();
    //     }
    // });

    // // need to count globally what's happening and report this to one progress bar... (with a spinner)
    // // TODO: spawn as many processes as cpus
    // // Will need to scan the test directories and break the work up into chunks.
    // // Combine the stdout streams of all childprocesses into a single stream... then transform this stream into counts.
    // const ls = new Promise((resolve, reject) => {
    //     // then we need to run test-lab...
    //     const logStream = createWriteStream(logFilePath, { flags: 'a', encoding: 'utf8' });

    //     console.log(`Running tests on: ${projectName}`);
    //     // look up known project to find dir..
    //     const ls = exec('npm run test', { encoding: 'utf8' });

    //     ls.stdout.pipe(printToArray).pipe(logStream);
    //     ls.stderr.on('data', (data) => {
    //         console.error(`stderr: ${data}`);
    //         logStream.close();
    //     });
    //     ls.on('close', (code) => {
    //         console.log(`child process exited with code ${code}`);
    //         resolve()
    //     });
    // });
    // await ls;
    // console.log(failedTests);
    // console.log({ passing, failing });

    // const choices = () => {
    //     Object.keys(failedTests)
    //     return [
    //         separator(),
    //         ...Object.entries(failedTests).map(([name, value]) => ({ name, value })),
    //         separator(),
    //         { name: 'Re-run all failed tests', value: 'all-failed' },
    //         { name: 'Re-run all', value: 'all' }
    //     ];
    // };
    // // do a list by suite... every option will have the ability to re-run unless exit is called.
    // await loopChoose('Inspect a failed test:', choices, async test => {
    //     if (test === 'all-failed') return console.log('Running all failed tests again');
    //     if (test === 'all') return console.log('Running every test');
    //     const { file, line, column , pass } = test;
    //     await loopChoose(
    //         `${pass ? ' PASS '.bgGreen : ' FAIL '.bgRed} Choose an action:`,
    //         () => [
    //             { name: 'Re-run this test', value: 'rerun' },
    //             { name: 'Open at failed line', value: 'open' },
    //         ],
    //         async choice => {
    //             switch (choice) {
    //                 case 'rerun': break; // TODO: run test at path.join(project,file);
    //                 case 'open': await runCmd(`code -g ${file}:${line}:${column}`);
    //             }
    //         },
    //         { exit: 'Go back' });
    // })

    // TODO: opening a file 

    // TODO: Spawn multiple instances of mocha tests for faster tests!
    // Will need to break this up into dirs...
    // Read how many top-level directories contain .test.js files
    // cap it at some depth level. You can choose which ones to run.
    // Or run all.
    // each file will then require the necessary files via a scoped glob...
    // and break these up based on some performance calculation.
    // running 16 tests on 1 thread is more performant then trying to set up 1 test on 16 threads and combine the results.
    // have a tests/thread ratio to respect.
    // this will also come into file considerations to simply just pass down one TEST_GLOB.
    // each thread will then recieve a glob of it's own in process.env.TEST_GLOB if you want to handle this your self.
    // otherwise... it'll go ahead and run tests for you from this glob pattern via mocha.
    // We can tests on a dir basis so split up from there.
    // we're going to need to do this anyway

    // TODO: Run a regex on failed tests, or on when on.data recieves data, push and store this in a log file
    // Refer to this when re-running tests. to only re-run failed tests.

    // TODO: open failed tests up at the spot they failed at (highlight it) `code ./path/to/file <lineNumber>:<rowNumber>`

    // TODO: Show a spinner and the current running test. (for each thread) No need for a huge rolling stdout log.

    if (all) { } // run everything for this project
    else { 
        // prompt the user to run tests in a certain directory
    }
};