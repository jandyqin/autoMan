// ws.js
const mutils = require('../utils');
var express = require('express');
var expressWs = require('express-ws');
const util = require('util');
const broadcast = require('./broadcast');
var router = express.Router();
expressWs(router);
const logTime = mutils.TIME;
var uuid = require('uuid');        //引入创建唯一id模块

router
    .ws('/', function (ws, _req) {
        var UUID = uuid.v4();
        broadcast.login(UUID, ws, UUID, {});
        /*监听消息*/
        ws.on('message', function (message) {
            console.log("接收:","UUID:", UUID,"message:", message);
            try {
                message = JSON.parse(JSON.stringify(message));
            } catch (error) {
                console.error(error);
                ws.send(util.inspect(error));
                return;
            }
            if (message === "monitor") {
                broadcast.login(UUID, ws, ["monitor"], {});
                broadcast.send({"data":{ "deviceList": broadcast.deviceList() }}, ["monitor"]);
                return;
            }
            try {
                broadcast.controller(UUID, message);
            } catch (error) {
                console.error(error);
                ws.send(util.inspect(error));
                return;
            }
        });
        /*监听断开连接*/
        ws.on('close', function () {
            broadcast.logout(UUID);
        })
    })



module.exports = router;