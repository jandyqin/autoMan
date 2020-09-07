#!/usr/bin/env node

const mutils = require("./mutils");


module.exports = {
    createDirectory: mutils.createDirectory,
    portIsOccupied:mutils.portIsOccupied,
    TIME:mutils.logTime,
    LOCAL_IP:mutils.LOCAL_IP
}