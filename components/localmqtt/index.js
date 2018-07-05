const moduleName = 'localmqtt'
const debug = require('debug')(`linto-client:${moduleName}`)
const EventEmitter = require('eventemitter3')
const Mqtt = require('mqtt')

class LocalMqtt extends EventEmitter {
    constructor(app) {
        super()
        this.subTopics = [
            "wuw/wuw-spotted",
            "utterance/stop"
        ]
        this.cnxParam = {
            clean: true,
            servers: [{
                host: process.env.LOCAL_MQTT_ADDRESS,
                port: process.env.LOCAL_MQTT_PORT
            }],
            keepalive: parseInt(process.env.LOCAL_MQTT_KEEP_ALIVE), //can live for LOCAL_MQTT_KEEP_ALIVE seconds without a single message sent on broker
            reconnectPeriod: Math.floor(Math.random() * 1000) + 1000, // ms for reconnect,
            will: {
                topic: `lintoclient/status`,
                retain: true,
                payload: JSON.stringify({
                    connexion: "offline"
                })
            },
            qos: 2
        }
        this.on(`localmqtt::connect`, () => {
            this.publish('status', { //send retained online status
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
                this.subTopics.map((topic) => {
                    this.client.unsubscribe(topic, (err) => {
                        if (err) debug('disconnecting while unsubscribing', err)
                        //Subscribe to the client topics
                        debug(`subscribing topics...`)
                        this.client.subscribe(topic, (err) => {
                            if (!err) {
                                debug(`subscribed successfully to ${topic}`)
                            } else {
                                debug(err)
                            }
                        })
                    })
                })
            })
            this.client.once("connect", () => {
                clearTimeout(cnxError)
                app[moduleName] = this
                this.client.on("offline", () => {
                    debug("broker connexion down")
                })
                resolve(app)
            })
            this.client.on('message', (topic, payload) => {
                try {
                    // @TODO : refactor
                    let subTopics = topic.split("/")
                    payload = JSON.parse(payload.toString())
                    let command = subTopics.pop()
                    let topicRoot = subTopics.pop()
                    this.emit(`${moduleName}::${topicRoot}/${command}`, payload)
                } catch (err) {
                    debug(err)
                }
            })
        })
    }

    publish(topic, value, qos = 2, retain = false, requireOnline = false) {
        const pubTopic = 'lintoclient' + '/' + topic
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
}

module.exports = LocalMqtt