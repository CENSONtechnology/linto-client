/**
 * Actions for audio component triggered by the localmqtt component 
 */
function localMqttActions(app) {
    if (!app.localmqtt || !app.logicmqtt) return

    app.localmqtt.on("localmqtt::wuw/spotted", async (payload) => {
        return
    })

    app.localmqtt.on("localmqtt::utterance/stop", async (payload) => {
        // "this" is the bound Audio app component
        const audioStream = this.mic.readStream()
        const audioFileId = await app.logicmqtt.publishaudio(audioStream)
        this.nlpProcessing.push(audioFileId)
    })
}

module.exports = localMqttActions