// app.js
const express = require('express'),
    router = express.Router(),
    expressWs = require('express-ws'),
    bodyParser = require('body-parser'),
    os = require("os"),
    path = require("path"),
    app = express(),
    swig = require('swig'),
    autoManService = require('./autoMan'),
    mutils = require('../utils'),
    util = require('util');
    mosca = require("mosca");

const MqttServer = new mosca.Server({
    port: 9960,
    backend: {//数据库
        type: "mongo",
        url: "mongodb://localhost:27017/mqtt",
        pubsubCollection: "ascoltatori",
        mongo: {}
    },
    persistence: {
        factory: mosca.persistence.Mongo,
        url: 'mongodb://localhost:27017/mqtt'
    },
    http: {
        port: 9980,
        bundle: true,
        static: './'
    }
});
MqttServer.on("clientConnected", function (client) {
    //当有客户端连接时的回调.
    console.log("client connected", client.id);
});
/**
 * 监听MQTT主题消息
 * 当客户端有连接发布主题消息时
 **/
MqttServer.on("published", function (packet, client) {
    var topic = packet.topic;
    switch (topic) {
        case "temperature":
            // console.log('message-publish', packet.payload.toString());
            //MQTT可以转发主题消息至其他主题
            MqttServer.publish({ topic: 'other', payload: packet.payload.toString() });
            break;
        case "other":
            // console.log(packet.payload.toString());
            break;
        default:
            MqttServer.publish({ topic: 'default', payload: packet.payload.toString() });
            break;
    }
});
app.use(express.static(path.dirname(require.resolve("mosca")) + "/public"));



//设置渲染文件的目录
app.set('views', path.join(__dirname, '../views'));
//设置html模板渲染引擎
app.engine('html', swig.renderFile);
//设置渲染引擎为html
app.set('view engine', 'html');
expressWs(app);
module.exports = function (_path, _port) {
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.use('/', router.all('/', function (request, response, next) {
        response.sendFile(path.join(__dirname, '../public/app.html'));
    }));
    app.use('/', router.all('/index.html', function (request, response, next) {
        response.sendFile(path.join(__dirname, '../public/index.html'));
    }));
    app.use('/', autoManService);
    app.use('/', express.static(path.join(path.resolve(__dirname, '..'), 'android-remote-control')));
    app.use('/', express.static(path.join(path.resolve(__dirname, '..'), 'monitor')));
    app.use('/', express.static(path.join(path.resolve(__dirname, '..'), 'public')));
    app.use('/docs', express.static(path.join(path.resolve(__dirname, '..'), 'docs')));
    var port = 9317;
    if (_port !== undefined) {
        port = _port;
    }
    let ts = `
    Starting up testingtools server, serving ./public
    Available on:
    `;
    mutils.portIsOccupied(port)
        .then(port => {
            app.listen(port, function () {
                var ifaces = os.networkInterfaces();
                console.info(ts);
                for (var dev in ifaces) {
                    ifaces[dev].forEach(function (details) {

                        if (details.family == 'IPv4') {
                            if (dev === "en0") {
                                // config.set({ "server": { "address": details.address, "port": port } })
                            }
                            console.info(`http://${details.address}:${port}
                    `);
                        }
                    });
                }
                console.log(`Hit CTRL-C to stop the server`);
            });
        })
}