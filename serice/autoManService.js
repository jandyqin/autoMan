// ws.js
const mutils = require('../utils');
var express = require('express');
var expressWs = require('express-ws');
const util = require('util');
var router = express.Router();
expressWs(router);
const logTime = mutils.TIME;
let uuid = require('uuid');        //引入创建唯一id模块
let HashMap = require('hashmap'); //引入hashmap模块

let clientsMAp = new HashMap();     //创建客户端列表，用于保存客户端及相关连接信息
let clientNameMAp = new HashMap();  //创建客户端列表，用于保存客户端及相关连接信息
let clientIPMAp = new HashMap();  //创建客户端列表，用于保存客户端及相关连接信息

function removalDuplicate(args) {
    let strlist = [];
    let map = new Map();
    args.forEach(value => {
        if (map.has(value)) {  // 如果有该key值
            map.set(value, true);
        } else {
            map.set(value, false);   // 如果没有该key值
            strlist.push(value);
        }
    })
    return strlist;
}
/**
 * 广播所有客户端消息
 * @param  {String} type     广播方式(指定用户还是全部)
 * @param  {String} message  消息
 * @param  {String} sender   发送方
 * @param  {String} receiver 接收方
 */
function broadcastSend(type, sender, receiver, message, _Type, _name) {
    scriptName = "autoMan"
    commandType = "save";
    if (_Type !== undefined) {
        commandType = _Type
    }
    if (_name !== undefined && _name !== "") {
        scriptName = _name
    }
    if (type === "monitor") {
        clientsMAp.forEach(function (value, key) {
            if (value.ws === undefined || value.ws.readyState != value.ws.OPEN) {
                console.error(value, '连接已断开')
                return;
            }
            if (value.name == 'monitor') {
                value.ws.send(util.inspect({
                    "data": message,
                    "sender": sender,
                    'receiver': receiver,
                    'logTime': logTime(),
                    "type": type
                }));
                return;
            }

        });
    }
    if (typeof (receiver) === 'object') {
        receiver.forEach(value => {
            let clientList = clientNameMAp.get(value);

            if (clientList !== undefined) {
                clientList = removalDuplicate(clientList);
                clientList.forEach(value => {
                    if (clientsMAp.get(value).ws === undefined) {
                        console.error(value, '连接已断开')
                        return;
                    }
                    clientsMAp.get(value).ws.send(util.inspect({
                        "data": {
                            "name": scriptName,
                            "script": message,
                            "id": scriptName,
                            "command": commandType
                        },
                        "sender": sender,
                        'receiver': receiver,
                        'logTime': logTime(),
                        "type": type,
                        "command": commandType
                    }));
                });
            };
        });
    } else {
        let clientList = clientNameMAp.get(receiver);
        if (receiver !== 'all') {
            if (clientList !== undefined) {
                clientList = removalDuplicate(clientList);
                clientList.forEach(value => {
                    if (clientsMAp.get(value).ws === undefined) {
                        console.error(value, '连接已断开')
                        return;
                    }
                    clientsMAp.get(value).ws.send(util.inspect({
                        "data": {
                            "name": scriptName,
                            "script": message,
                            "id": scriptName,
                            "command": commandType
                        },
                        "sender": sender,
                        'receiver': receiver,
                        'logTime': logTime(),
                        "type": type,
                        "command": commandType
                    }));
                });
            }
        } else {
            clientsMAp.forEach(function (value, key) {
                if (value.ws === undefined || value.ws.readyState != value.ws.OPEN) {
                    console.error(value, '连接已断开')
                    return;
                }
                value.ws.send(util.inspect({
                    "data": {
                        "name": scriptName,
                        "script": message,
                        "id": scriptName,
                        "command": commandType
                    },
                    "sender": sender,
                    'receiver': receiver,
                    'logTime': logTime(),
                    "type": type,
                    "command": commandType
                }));
            });
        }
    };

}
var clientIndex = 1;


router
    .ws('/', function (ws, req) {
        let client_token = uuid.v4();
        let nickname = `AnonymousUser${clientIndex++}`;
        clientsMAp.set(client_token, {
            "id": client_token,
            "ws": ws,
            "name": nickname
        });
        /*监听消息*/
        ws.on('message', function (message) {
            console.log("UUID:", client_token)
            try {
                message = JSON.parse(JSON.stringify(message));
            } catch (error) {
                console.error(error);
                ws.send(util.inspect(error));
                return;
            }

            console.log(message);

            if (message === "monitor") {
                clientsMAp.set(client_token, {
                    "id": client_token,
                    "ws": ws,
                    "name": "monitor"
                });
                var deviceList = [];
                clientIPMAp.forEach((_device) => {
                    deviceList.push(_device);
                })

                broadcastSend('monitor', 'system', 'monitor', { 'clienList': clientNameMAp.keys(), "deviceList": deviceList });
                return;
            }
            try {
                controller(message);
            } catch (error) {
                console.error(error);
                ws.send(util.inspect(error));
                return;
            }


        });
        /*监听断开连接*/
        ws.on('close', function () {
            closeSocket();
        })
        /**
         * 关闭服务，从客户端监听列表删除
         */
        function closeSocket() {
            let clientName = clientsMAp.get(client_token).name;
            let clientList = clientNameMAp.get(clientName);

            if (clientList !== undefined) {
                if (clientList.length > 1) {
                    for (let i = 0; i < clientList.length; i++) {
                        if (clientList[i] == client_token) {
                            clientList.splice(i, 1);
                        }
                    }
                } else {
                    clientNameMAp.delete(clientName);
                }
            }
            clientsMAp.delete(client_token);
            broadcastSend("monitor", 'system', 'all', { 'clienList': clientNameMAp.keys() });

        }

        /* 
        {type:'type',data:'data'}
        控制器
        */
        function controller(args) {
            args = JSON.parse(args);
            let result;
            switch (args.type) {
                case 'hello':
                    result = login(args);
                    break;
                case 'log':
                    result = mdebugger(args);
                    break;
                case 'custom':
                    result = custom(args);
                    break;
                case 'command':
                    result = command(args);
                    break;
                case 'monitor':
                    result = monitor(args);
                    break;
                case 'screenBase64':
                    result = screenBase64(args);
                default:
                    break;
            }
            if (result !== null && result !== undefined) {
                ws.send(util.inspect(result));
            }
        }
        function screenBase64(args) {
            broadcastSend(args.type, 'system', 'monitor', { 'clienList': clientNameMAp.keys(), "screenUri": args.data, "deviceList": deviceList });
        }
        function monitor(args) {
            let device = {}
            try {
                device = JSON.parse(args.data.monitor);
            } catch (error) {
                device = args.data.monitor
            }
            if (device !== undefined && device.IP !== undefined) {
                clientIPMAp.set(device.IP, device);
            }
            var deviceList = [];
            clientIPMAp.forEach((_device) => {
                deviceList.push(_device);
            })

            broadcastSend(args.type, 'system', 'monitor', { 'clienList': clientNameMAp.keys(), "screenUri": args.data, "deviceList": deviceList });
        }
        function mdebugger(args) {
            broadcastSend("logging", "client", "debugger", args.data);
        };

        function command(args) {
            broadcastSend(args.type, args.sender, "all", args.data, args.commandType, args.scriptName);
        };
        /**
           * login
           */
        function login(args) {
            let clientName = args.data.device_name;
            ws.send(util.inspect({
                "type": "hello", "data": {
                    "server_version": 2
                }
            }));
            clientsMAp.set(client_token, {
                "id": args.token,
                "ws": ws,
                "name": clientName,
                "device": {
                    "name": clientName
                }
            });
            if (clientNameMAp.has(clientName)) {
                let clientList = clientNameMAp.get(clientName);
                clientList.push(client_token)
                clientNameMAp.set(clientName, clientList);
            } else {
                let client_tokenlist = [];
                client_tokenlist.push(client_token);
                clientNameMAp.set(clientName, client_tokenlist);
            }
            let disconnect_message = `Client 【${clientName}】is online login`;
            // if (clientNameMAp.get('monitor') !== undefined) {
            //     clientNameMAp.get('monitor').forEach(client => {
            //         client.ws.send({ 'clienList': clientNameMAp.keys() });
            //     })
            // }
            broadcastSend("monitor", 'system', 'all', { 'clienList': clientNameMAp.keys() });
        }

    })



module.exports = router;