const inquirer = require('inquirer'); // https://www.npmjs.com/package/inquirer

module.exports = class Prompt {
    constructor (prompts = []) {
        this.inquirer = inquirer
        this.inquirer.registerPrompt('file-tree-selection', require('inquirer-file-tree-selection-prompt')); // https://github.com/anc95/inquirer-file-tree-selection
        this.inquirer.registerPrompt('fuzzypath', require('inquirer-fuzzy-path')) // https://github.com/adelsz/inquirer-fuzzy-path

        this.prompts = prompts;
    }

    ask(answers = {}) { return this.inquirer.prompt(this.prompts, answers); }

    addPrompts(...prompts) {
        this.prompts.push(...prompts);
        return this;
    }
    confirm(...inputs) { return this.addPrompts(Prompt.confirm(...inputs)); }

    file(...inputs) { return this.addPrompts(Prompt.file(...inputs)); }

    fileSearch(...inputs)  { return this.addPrompts(Prompt.fileSearch(...inputs)); }

    date(...inputs) { return this.addPrompts(Prompt.date(...inputs)); }

    choice(...inputs) { return this.addPrompts(Prompt.choice(...inputs)); }

    choices(...inputs) { return this.addPrompts(Prompt.choices(...inputs)); }

    input(...inputs) { return this.addPrompts(Prompt.input(...inputs)); }

    password(...inputs) { return this.addPrompts(Prompt.password(...inputs)); }

    selectLine(...inputs) { return this.addPrompts(Prompt.selectLine(...inputs)); }

    static parseMessage = (input = {}) => {
        if (typeof input === 'string') return { message: input };
        else {
            const [[name, message]] = Object.entries(input);
            return { name, message };
        }
    }

    static file = (message, options = {}) => {
        return {
            type: 'file-tree-selection',
            name: 'file',
            ...Prompt.parseMessage(message),
            ...options
        };
    }

    static selectLine = (message, choices, options = {}) => {
        return {
            type: 'selectLine',
            name: 'selectLine',
            choices,
            ...Prompt.parseMessage(message),
            ...options
        };
    }

    static date = (message, options = {}) => {
        return {
            type: 'date',
            name: 'date',
            ...Prompt.parseMessage(message),
            ...options
        };
    }

    static confirm = (message, options = {}) => {
        return {
            type: 'confirm',
            name: 'confirm',
            ...Prompt.parseMessage(message),
            ...options
        };
    }

    static choice = (message, choices, options = {}) => {
        return {
            type: 'list',
            name: 'choice',
            choices,
            ...Prompt.parseMessage(message),
            ...options
        };
    }

    static choices = (message, choices, options = {}) => {
        return {
            type: 'checkbox',
            name: 'choices',
            choices,
            ...Prompt.parseMessage(message),
            ...options
        }
    }

    static input = (message, options = {}) => {
        return {
            type: 'input',
            name: 'input',
            ...Prompt.parseMessage(message),
            ...options
        }
    }

    static password = (message, options = {}) => {
        return {
            type: 'password',
            name: 'password',
            ...Prompt.parseMessage(message),
            ...options
        }
    }

    /**
     * 
     * @param {*} message 
     * @param {*} options - available options for this
     * @param {String} [options.itemType='any'] - enum: 'any', 'directory', 'file'
     * @param {String} [options.rootPath='app'] - root directory to start with
     * @param {Function} [options.excludePath] - exclude these
     * @param {Function} [options.excludeFilter] - filter by..
     * @param {String} [options.default] - idk
     * @param {Boolean} [options.suggestOnly] - Restrict prompt answer to available choices or use them as suggestions
     * @param {Number} [options.depthLimit] - Limit the depth of sub-folders to scan, Defaults to infinite depth if undefined 
     * @returns 
     */
    static fileSearch = (message, options = {}) => {
        return {
            type: 'fuzzypath',
            name: 'fileSearch',
            ...Prompt.parseMessage(message),
            ...options
        }
    }

    static separator = () => new inquirer.Separator();

    static loopInput = (message, callback, { exit = 'exit', onExit, ...options } = {}) => { 
        return this.PromptLoop(() => new this().input({ choice: message }, options), callback, { exit, onLoop, onExit })
    }

    /**
     * 
     * @param {String} message 
     * @param {Object[]|String[]} choices 
     * @param {Function} callback 
     * @param {Object} options
     * @param {String|Function} [options.exit='exit'] - Default exit signal.
     * @param {Object} [options.onExit] - a callback to run when the loop exits, the return value of onExit will be the return value of this function.
     * @returns 
     */
    static loopChoose = (message, choices, callback, { exit = 'exit', onExit, ...options } = {}) => {
        return this.PromptLoop(choices => new this().choice({ choice: message }, choices, options), callback, { exit, onLoop:  () => choices().concat(exit), onExit })
    }
    static loopConfirm = (message, callback, { exit = false, onExit, ...options } = {}) => { 
        return this.PromptLoop(() => new this().confirm({ choice: message }, options), callback, { exit: false, onLoop, onExit })
    }

    /**
     * Useful loop for asking reoccuring questions to then do something.
     * @param {Function} prompt - A function that returns a prompt, passed the return value of onLoop(). Note the is expecting a 'choice' key
     * @param {Function} callback - callback to execute on every loop that doesn't call exit, will be passed the answers hash of prompt
     * @param {String|Boolean|Number} [options.exit='exit'] - Default exit handle, prompt.ask() must return this value to exit the loop
     * @param {Function} [options.onLoop] - Optional set up function, called at the beginning of loop and it's return value passed to initiate the prompt 
     */
    static PromptLoop = async (prompt, callback, { exit = 'exit', onLoop = () => {}, onExit = () => {} }) => {
        const shouldExit = exit instanceof Function ? exit : choice => choice === exit;
        let done = false;
        while (!done) {
            const { choice, ...answers } = await prompt(onLoop()).ask();
            if (shouldExit(choice, answers)) done = true;
            else await callback(choice, answers); // must return a promise.
        }
        return onExit();
    }
}