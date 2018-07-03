const moduleName = 'logicmqtt'
const debug = require('debug')(`linto-client:${moduleName}`)
const EventEmitter = require('eventemitter3')
const Mqtt = require('mqtt')
const stream = require('stream')


class LogicMqtt extends EventEmitter {
    constructor(app) {
        super()
        this.pubTopicRoot = `${app.terminal.info.scope}/${app.terminal.info.fromMeTopic}/${app.terminal.info.SN}`
        this.subTopic = `${app.terminal.info.scope}/${app.terminal.info.towardsMeTopic}/${app.terminal.info.SN}/#`
        this.cnxParam = {
            clean: true,
            servers: [{
                host: process.env.LOGIC_MQTT_ADDRESS,
                port: process.env.LOGIC_MQTT_PORT
            }],
            keepalive: parseInt(process.env.LOGIC_MQTT_KEEP_ALIVE), //can live for LOCAL_MQTT_KEEP_ALIVE seconds without a single message sent on broker
            reconnectPeriod: Math.floor(Math.random() * 1000) + 1000, // ms for reconnect,
            will: {
                topic: `${this.pubTopicRoot}/status`,
                retain: true,
                payload: JSON.stringify({
                    connexion: "offline"
                })
            },
            qos: 2
        }
        this.on(`${moduleName}::connect`, () => {
            this.publish(`status`, { //send retained online status
                "connexion": "online",
                "on": new Date().toJSON()
            }, 0, true)

            app.localmqtt.publish(`connected`, { //send retained connected status in lintoclient/connected
                "connexion": "online",
                "on": new Date().toJSON()
            }, 0, true)
        })
        return this.init(app)
    }

    async init(app) {
        return new Promise((resolve, reject) => {
            let cnxError = setTimeout(() => {
                return reject("Unable to connect");
            }, 2000)
            this.client = Mqtt.connect(this.cnxParam)
            this.client.on("error", e => {
                console.error("broker error : " + e)
            })
            this.client.on("connect", () => {
                this.emit(`${moduleName}::connect`)
                //clear any previous subsciptions
                this.client.unsubscribe(this.subTopic, (err) => {
                    if (err) debug('disconnecting while unsubscribing', err)
                    //Subscribe to the client topics
                    debug(`subscribing topics...`)
                    this.client.subscribe(this.subTopic, (err) => {
                        if (!err) {
                            debug(`subscribed successfully to ${this.subTopic}`)
                        } else {
                            debug(err)
                        }
                    })
                })
            })
            this.client.once("connect", () => {
                clearTimeout(cnxError)
                this.client.on("offline", () => {
                    app.localmqtt.publish(`disconnected`, { //send retained connected status
                        "connexion": "offline",
                        "on": new Date().toJSON()
                    }, 0, true)
                    debug("broker connexion down")
                })
                app[moduleName] = this
                resolve(app)
            })
            this.client.on('message', (topic, payload) => {
                try {
                    let topicArray = topic.split("/")
                    payload = JSON.parse(payload.toString())
                    payload = Object.assign(payload, {
                        topicArray
                    })
                    this.emit(`${moduleName}::message`, payload)
                } catch (err) {
                    debug(err)
                }
            })
        })
    }

    publish(topic, value, qos = 2, retain = false, requireOnline = false) {
        const pubTopic = this.pubTopicRoot + '/' + topic
        const pubOptions = {
            "qos": qos,
            "retain": retain
        }
        if (requireOnline === true) {
            if (this.client.connected === true) {
                this.client.publish(pubTopic, JSON.stringify(value), pubOptions, function (err) {
                    if (err) debug("publish error", err)
                })
            }
        } else {
            this.client.publish(pubTopic, JSON.stringify(value), pubOptions, function (err) {
                if (err) debug("publish error", err)
            })
        }
    }

    publishaudio(audioStream) {
        const FileWriter = require('wav').FileWriter
        const outputFileStream = new FileWriter('/tmp/command.wav', {
            sampleRate: 16000,
            channels: 1
        })
        audioStream.pipe(outputFileStream)
        const pubOptions = {
            "qos": 0,
            "retain": false
        }
        const fileId = Math.random().toString(16).substring(4)
        const pubTopic = `${this.pubTopicRoot}/nlp/file/${fileId}`
        return new Promise((resolve, reject) => {
            try {
                let fileBuffers = []
                outputFileStream.on('data', (data) => {
                    fileBuffers.push(data)
                })
                outputFileStream.on('end', () => {
                    const sendFile = Buffer.concat(fileBuffers)
                    this.client.publish(pubTopic, sendFile, pubOptions, (err) => {
                        if (err) return reject(err)
                        resolve(fileId)
                    })
                })
            } catch (e) {
                console.log(e)
            }

        })
    }
}

module.exports = LogicMqtt