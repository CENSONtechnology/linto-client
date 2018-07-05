/**
 * Actions for audio component triggered by the localmqtt component 
 */
const debug = require('debug')(`linto-client:audio:actionsFromLocalMQTT`)

function localMqttActions(app) {
    if (!app.localmqtt || !app.logicmqtt) return

    app.localmqtt.on("localmqtt::wuw/spotted", async (payload) => {
        return
    })

    app.localmqtt.on("localmqtt::utterance/stop", async (payload) => {
        if (payload.reason === "canceled") return
        // "this" is the bound Audio app component
        const audioStream = this.mic.readStream()
        const audioRequestID = await app.logicmqtt.publishaudio(audioStream)
        // Notify for noew request beign sent
        app.localmqtt.publish("request/send", {
            "on": new Date().toJSON(),
            "requestId": audioRequestID
        }, 0, false)
        this.nlpProcessing.push(audioRequestID)
    })
}

module.exports = localMqttActions