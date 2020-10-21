
const util = require('util');
const mutils = require('../utils');
const HashMap = require('hashmap'); //引入hashmap模块
var clients = new HashMap();//{uuid:{"name":"","ws":ws,"device":{}},uuid:{...}}
var userList = new HashMap();//{"name":[uuid,uuid]}

var deviceList = [];
/**
 * 向客户端发送消息
 * @param  {Object} messageData  消息
 * @param  {Array}  acceptor 广播方式(指定用户还是全部)
 */
function broadcastSend(messageData, acceptor) {
    if (typeof (acceptor) == "string") {
        acceptor = [acceptor];
    }
    function send(_ws) {
        if (_ws != undefined && _ws.readyState == _ws.OPEN) {
            _ws.send(JSON.stringify(messageData),function(){
                console.log("发送： ",messageData);
            });
        } else {
            console.error(util.inspect(client), '连接已断开');
            return;
        }
    }
    if (acceptor == undefined || acceptor.length == 0) {
        clients.keys().forEach(key => {
            client = clients.get(key);
            send(client.ws)
        });
    } else if (util.isArray(acceptor)) {
        acceptor.forEach(acc => {
            if (userList.has(acc)) {
                userList.get(acc).forEach(uuid => {
                    send(clients.get(uuid).ws);
                })
            }
        })
    }
}
/**
 * 登记 ws
 * @param {String} name 名称
 * @param {*} ws ws链接
 * @param {Object} device 设备信息
 */
function enroll(UUID, ws, name, device) {
    Device = device;
    Device["id"] = UUID;
    clients.set(UUID, { "name": name, "ws": ws, "device": Device, "UUID": UUID });
    if (userList.has(name)) {
        let clientList = userList.get(name);
        clientList.push(UUID);
        userList.set(name, clientList);
    } else {
        let clientlist = [];
        clientlist.push(UUID);
        userList.set(name, clientlist);
    }
}
/**
 * 设备 登出
 * @param {String} UUID 客户端的uuid
 */
function logout(UUID) {
    const clientName = clients.get(UUID)["name"];
    let clientList = userList.get(clientName);
    if (clientList !== undefined) {
        if (clientList.length > 1) {
            for (let i = 0; i < clientList.length; i++) {
                if (clientList[i] == UUID) {
                    clientList.splice(i, 1);
                }
            }
        } else {
            userList.delete(clientName);
        }
    }
    clients.delete(UUID);
}
/**
 * 设备是否在线
 * @param {*} UUID   客户端的uuid
 */
function iSonline(UUID) {
    if (clients.get(UUID).ws.readyState == clients.get(UUID).ws.OPEN) {
        return true;
    } else {
        logout(UUID);
        return false;
    }
}
/**
 * 设备列表
 */
function devices() {
    deviceList = [];
    clients.keys().forEach(key => {
        client = clients.get(key);
        if (iSonline(key)) {
            if (Object.keys(client.device).length > 1) {
                deviceList.push(client.device);
            }

        }
    });
    return deviceList;
}
/**
 * 控制器
 * @param {String} UUID 
 * @param {Object} args 
 */
function controller(UUID, args) {
    try {
        args = JSON.parse(args);
    } catch (error) {
        throw error;
    }

    let result;
    switch (args.type) {
        case 'hello':
            result = login(args, UUID);
            break;
        case 'log':
            // result = mdebugger(args, UUID);
            break;
        case 'onSocketData':
            // result = onSocketData(args, UUID);
            break;
            case 'onSocketError':
            // result = onSocketError(args, UUID);
            break;
        case 'command':
            result = command(args, UUID);
            break;
        case 'monitor':
            result = monitor(args, UUID);
            break;
        case 'screenBase64':
            result = screenBase64(args, UUID);
            break;
        // case 'device':
        //     result = setDevice(args, UUID);
        //     break;
        default:
            result = custom(args, UUID);
            break;
    }
}
function custom(args, UUID) {
    args["sender"] = clients.get(UUID).name;
    args["logTime"] = mutils.TIME();
    broadcastSend(args, ['console']);
}
function setDevice(args, UUID) {

}
function screenBase64(args) {
    broadcastSend({ 'clienList': clients.keys(), "screenUri": args.data, "deviceList": deviceList }, ['monitor']);
}
function monitor(args, UUID) {
    let device = {}
    try {
        device = JSON.parse(args.data.monitor);
    } catch (error) {
        device = args.data.monitor;
    }
    if (device !== undefined && device.IP !== undefined) {
        clients.get(UUID).device["IP"] = device.IP;
        clients.get(UUID).device["port"] = device.port;
    }
    devices();
    console.log(deviceList);
    broadcastSend({ "data": { "deviceList": deviceList } }, ['monitor']);
}
function mdebugger(args, UUID) {
    args["sender"] = clients.get(UUID).name;
    args["logTime"] = mutils.TIME();
    broadcastSend(args, ['console']);
};

function command(args, UUID) {
    args["data"]["sender"] = clients.get(UUID).name;
    args["data"]["logTime"] = mutils.TIME();
    broadcastSend(args.data);
};
/**
 * 登录
 * @param {Object} args 
 * @param {String} UUID 
 */
function login(args, UUID) {
    let clientName = args.data.device_name;
    const ws = clients.get(UUID).ws;
    const script = `log("automan:device:"+device)`;
    const getDevice = {
        "data": {
            "name": "getDevice",
            "script": script,
            "id": "getDevice",
            "command": "run"
        },
        "type": "command",
        "command": "run"
    }
    ws.send(util.inspect({
        "type": "hello", "data": {
            "server_version": 2
        }
    }));
    ws.send(util.inspect(getDevice));
    enroll(UUID, clients.get(UUID).ws, clientName, args.data);
    args["sender"] = clients.get(UUID).name;
    args["logTime"] = mutils.TIME();
    broadcastSend(args);
}


module.exports = {
    clients: clients,
    userList: userList,
    deviceList: devices,
    send: broadcastSend,
    login: enroll,
    logout: logout,
    controller: controller
}