const debug = require('debug')('linto-client:ctl')
require('./config')
const ora = require('ora')

class App {
    constructor() {
        // This LinTO terminal
        this.terminal = require('./lib/terminal') // Specific enrolments for this specific terminal
        // Load behaviors 
        process.env.COMPONENTS.split(',').reduce((prev, component) => {
            return prev.then(() => this.use(component))
        }, Promise.resolve())
    }

    async use(component) {
        let spinner = ora(`Loading behaviors : ${component}`).start()
        try {
            const injectComponent = require(`./components/${component}`) //component dependency injections with inversion of control
            await new injectComponent(this) //shall allways RESOLVE a component injected version of this.
            spinner.succeed(`Loaded : ${component}`)
            return
        } catch (e) {
            spinner.fail(`Error in component invocation : ${component}`)
            console.error(debug.namespace, e)
            process.exit(1)
        }
    }
}

module.exports = new App()