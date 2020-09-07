// app.js
const express = require('express'),
    router = express.Router(),
    expressWs = require('express-ws'),
    bodyParser = require('body-parser'),
    os = require("os"),
    path = require("path"),
    fs = require('fs'),
    mime = require('mime'),
    app = express(),
    swig = require('swig'),
    autoManService = require('./autoMan'),
    mutils = require('../utils');
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