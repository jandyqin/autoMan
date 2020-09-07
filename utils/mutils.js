#!/usr/bin/env node

let currentPath = process.cwd(),
    path = require('path'),
    fs = require('fs');
function createDirectory(_filepath) {

    function create(directoryPath) {
        if (!fs.existsSync(directoryPath)) {
            fs.mkdirSync(directoryPath);
            // console.log(directoryPath, '创建成功');
        } else {
            // console.log(directoryPath, '已经存在');
        }
    }
    filePath = _filepath.split('/');
    directoryPath = '';
    filePath.forEach(element => {
        directoryPath = `${directoryPath}/${element}`
        create(directoryPath);
    });
    return true;
}
exports.createDirectory = createDirectory;
// 对Date的扩展，将 Date 转化为指定格式的String
// 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符， 
// 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字) 
// 例子： 
// (new Date()).Format("yyyy-MM-dd HH:mm:ss.S") ==> 2006-07-02 08:09:04.423 
// (new Date()).Format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18 
Date.prototype.Format = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1, //月份 
        "d+": this.getDate(), //日 
        "H+": this.getHours(), //小时 
        "m+": this.getMinutes(), //分 
        "s+": this.getSeconds(), //秒 
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
        "S": this.getMilliseconds() //毫秒 
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

// // 调用： 
// var time1 = new Date().Format("yyyy-MM-dd");
// var time2 = new Date().Format("yyyy-MM-dd HH:mm:ss.S");

function logTime(format) {
    try {
        return new Date().Format(format)
    } catch (error) {
        return new Date().Format("yyyy-MM-dd HH:mm:ss.S");
    }
}
exports.logTime = logTime;

function getIPAddress() {
    var interfaces = require('os').networkInterfaces();
    for (var devName in interfaces) {
        var iface = interfaces[devName];
        for (var i = 0; i < iface.length; i++) {
            var alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                return alias.address;
            }
        }
    }
}

exports.LOCAL_IP = getIPAddress();

function portIsOccupied(port) {
    const server = require('net').createServer().listen(port)
    return new Promise((resolve, reject) => {
        server.on('listening', () => {
            server.close()
            resolve(port)
        })
        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                resolve(portIsOccupied(parseInt(port) + 1))//注意这句，如占用端口号+1
            } else {
                reject(err)
            }
        })
    })

}

exports.portIsOccupied = portIsOccupied;

if (console) {
    var _console = {
        log: console.log,
        error: console.error,
        info: console.info,
        warn: console.warn,
        debug: console.debug,
    };
    const chalk = require('chalk');
    function parsing(str) {
        if (typeof (str) === 'object') {
            return chalk.bold.cyan(JSON.stringify(str, null, 4));
        } else {
            return chalk.bold.cyan(str);
        }
    }
    console.log = function () {
        // 做自己的处理
        msg = [`${logTime('yyyy-MM-dd HH:mm:ss')} ${(new Error()).stack.split("\n")[2].trim().split(" ")[2]}`, '\n', '\n'];
        for (var i = 0; i < arguments.length; i++) {
            msg.push(parsing(arguments[i]));
        }
        msg.push('\n');
        // 调用原方法输出
        _console.log.apply(this, msg);
    };
    console.error = function () {
        // 做自己的处理
        msg = [`${logTime('yyyy-MM-dd HH:mm:ss')} ${(new Error()).stack.split("\n")[2].trim().split(" ")[2]}`, '\n', '\n'];
        for (var i = 0; i < arguments.length; i++) {
            msg.push(parsing(arguments[i]));
        }
        msg.push('\n');
        // 调用原方法输出
        _console.error.apply(this, msg);
    };
    console.info = function () {
        // 做自己的处理
        msg = [];
        // msg = [`${logTime()}`,`-info : `];
        for (var i = 0; i < arguments.length; i++) {
            msg.push(arguments[i]);
        }
        // 调用原方法输出
        _console.info.apply(this, msg);
    };
    console.warn = function () {
        // 做自己的处理
        msg = []
        // msg = [`${logTime()}`,`-info : `];
        for (var i = 0; i < arguments.length; i++) {
            msg.push(arguments[i]);
        }
        // 调用原方法输出
        _console.warn.apply(this, msg);
    };
    console.debug = function () {
        // 做自己的处理
        msg = []
        // msg = [`${logTime()}`,`-info : `];
        for (var i = 0; i < arguments.length; i++) {
            msg.push(arguments[i]);
        }
        // 调用原方法输出
        _console.debug.apply(this, msg);
    };
    // warn、debug、error同理
}
