/**
 * Actions for audio component triggered by the logicmqtt component 
 */
const debug = require('debug')(`linto-client:audio:actionsFromLogicMQTT`)

function logicMqttActions(app) {
    if (!app.localmqtt || !app.logicmqtt) return
    app.logicmqtt.on('logicmqtt::message', (message) => {
        debug("Received %O", message)
        // NLP file Processed
        if (!!message.topicArray && message.topicArray[3] === "nlp" && message.topicArray[4] === "file" && !!message.topicArray[5]) {
            // Do i still wait for this file to get processed ?
            if (this.nlpProcessing.includes(message.topicArray[5])) {
                this.nlpProcessing = this.nlpProcessing.filter(e => e !== message.topicArray[5]) //removes from array of files to process
                app.localmqtt.publish("say", {
                    "value": message.behavior.say,
                    "on": new Date().toJSON()
                }, 0)
            } else return
        }
        if (!!message.topicArray && message.topicArray[3] === "say") {
            // Basic say for demo purpose
                app.localmqtt.publish("say", {
                    "value": message.behavior.say,
                    "on": new Date().toJSON()
                }, 0)
        }
    })
}

module.exports = logicMqttActions