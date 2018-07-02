const moduleName = 'terminal'
const debug = require('debug')(`linto-client:${moduleName}`)
const _ = require('lodash')
const networkInterfaces = require('os').networkInterfaces()
const ora = require('ora')

class Terminal {
    constructor() {
        // This LinTO terminal
        this.info = require('./linto.json')
        this.info.macAdress = this.getMacAddress()
    }

    /**
     * Gets this terminal MAC address in this order : wlan0, eth0 or randomstring starting with a z
     * - random value is a failback for no interface up at the moment of the linto client boot
     */
    getMacAddress() {
        let macAddress
        if (_.get(networkInterfaces, 'wlan0[0].mac')) {
            macAddress = networkInterfaces.wlan0[0].mac
            debug(`MAC adress from wlan0 : ${macAddress}`)
        } else if (_.get(networkInterfaces, 'eth0[0].mac')) {
            macAddress = networkInterfaces.eth0[0].mac
            debug(`MAC address from eth0 : ${macAddress}`)
        } else {
            macAddress = "z" + Math.random().toString(16).substring(4) //random 11 base 16 caracters concatened to a z
            debug(`Random mac address starting with z: ${macAddress}`)
        }
        macAddress = macAddress.replace(/:/g, '')
        return macAddress
    }
}

module.exports = new Terminal()