const moduleName = 'audio'
const debug = require('debug')(`linto-client:${moduleName}`)
const EventEmitter = require('eventemitter3')

class Audio extends EventEmitter {
    constructor(app) {
        super()
        this.nlpProcessing = new Array() //array of audiofiles id being submitted
        this.mic = require(`${process.cwd()}/lib/soundfetch`)
        return this.init(app)
    }

    async init(app) {
        return new Promise((resolve, reject) => {
            //register actions triggered by components
            require('./actions/localmqtt').bind(this)(app)
            require('./actions/logicmqtt').bind(this)(app)
            app[moduleName] = this
            resolve(app)
        })
    }
}

module.exports = Audio