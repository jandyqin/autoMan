
window.command = '';
var CodeMirrorEditor = CodeMirror.fromTextArea(document.getElementById("message"), {
    lineNumbers: true,
    matchBrackets: true,
    continueComments: "Enter",
    styleActiveLine: true,
    foldGutter: true,
    lineWrapping: true,
    gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter', 'CodeMirror-lint-markers'],
    extraKeys: {
        "Ctrl": "autocomplete",
        "Ctrl-Q": "toggleComment",
        "Ctrl-M": function autoFormat(CodeMirrorEditor) {
            var totalLines = CodeMirrorEditor.lineCount();
            console.log(totalLines);
            CodeMirrorEditor.autoFormatRange({ line: 0, ch: 0 }, { line: totalLines });
        }
    }
});
if (localStorage.getItem("debugger") !== null) {
    window.command = localStorage.getItem("debugger");
}
CodeMirrorEditor.setValue(command);
function fireKeyEvent(el, evtType, keyCode) {
    var evtObj;

    if (document.createEvent) {
        if (window.KeyEvent) {//firefox 浏览器下模拟事件
            evtObj = document.createEvent('KeyEvents');
            evtObj.initKeyEvent(evtType, true, true, window, true, false, false, false, keyCode, 0);
        } else {//chrome 浏览器下模拟事件
            evtObj = document.createEvent('UIEvents');
            evtObj.initUIEvent(evtType, true, true, window, 1);

            delete evtObj.keyCode;
            if (typeof evtObj.keyCode === "undefined") {//为了模拟keycode
                Object.defineProperty(evtObj, "keyCode", { value: keyCode });
            } else {
                evtObj.key = String.fromCharCode(keyCode);
            }

            if (typeof evtObj.ctrlKey === 'undefined') {//为了模拟ctrl键
                Object.defineProperty(evtObj, "ctrlKey", { value: true });
            } else {
                evtObj.ctrlKey = true;
            }
        }
        console.log(evtObj);
        el.dispatchEvent(evtObj);

    } else if (document.createEventObject) {//IE 浏览器下模拟事件
        evtObj = document.createEventObject();
        evtObj.keyCode = keyCode
        el.fireEvent('on' + evtType, evtObj);
    }
}

this.CodeMirrorEditor.on("change", function () {
    //事件触发后执行事件
    //每次编辑器内容更改时触发
    window.command = this.CodeMirrorEditor.getValue();
    localStorage.setItem("debugger", window.command);
    // fireKeyEvent(document.getElementsByClassName('CodeMirror-scroll'), 'keydown', 87);
});
this.CodeMirrorEditor.on("cursorActivity", function () {
    //事件触发后执行事件 
    //当光标或选中(内容)发生变化，或者编辑器的内容发生了更改的时候触发
    selection = this.CodeMirrorEditor.getSelection();
    if (selection !== '') {
        window.command = selection;
    } else {
        window.command = this.CodeMirrorEditor.getValue();
    }
});
// document.getElementById('debuggerjs').innerHTML = `${window.location.origin}/console/debugger.js`;
var ws_url = `ws://${window.location.hostname}:${window.location.port}`;
var loadJs = function (loadUrl, callMyFun, argObj) {
    var loadScript = document.createElement('script');
    loadScript.setAttribute("type", "text/javascript");
    loadScript.setAttribute('src', loadUrl);
    console.log(loadUrl)
    document.getElementsByTagName("head")[0].appendChild(loadScript);
    loadScript.onload = function () {
        loadScript.onload = null;
        callMyFun();
    }

    console.log(argObj);
}
var debuggerName;
if (debuggerName === undefined) {
    debuggerName = "debugger";
}
var startWebSocket = function () {
    //建立连接
    // window.location
    // window.ws = new WebSocket("ws://"+window.location.hostname+":8888");
    if ("WebSocket" in window) {
        try {
            window.ws = new WebSocket(ws_url);
        } catch (error) {
            window.ws = new WebSocket(ws_url);
        }
    } else {
        // loadJs("testingtoolsjs/sockjs.js", function () {
        loadJs("testingtoolsjs/sockjs.min.js", function () {
            try {
                window.ws = new SockJS(ws_url);
            } catch (error) {
                window.ws = new SockJS(ws_url);
            }
        }, "SockJS加载完成");
        // });

    }

    var nickname = "";
    ws.onopen = function (e) {
        console.info('Connection to server opened');


        ws.send(JSON.stringify({
            "type": "hello", "data": {
                "device_name": "console"
            }
        }));
    }


    //收到消息处理
    ws.onmessage = function (e) {
        var msg = JSON.parse(e.data);
        var type = msg.type;
        var sender = msg.sender;
        var receiver = msg.receiver;
        var logTime = msg.logTime;
        var data = msg.data;

        console.info(JSON.stringify(msg));
        switch (type) {
            case 'systemMessage':
                window.loginToken = data.token;
                ws.send(JSON.stringify({
                    "type": 'login',
                    "sender": 'debugger',
                    'receiver': 'system',
                    "data": { 'token': loginToken, 'nickname': debuggerName }
                }));
                break;
            case 'command':
                appendLog(type, sender, data.script, logTime);
                window.scrollTo(0, document.body.scrollHeight);
                return;
            case 'log':
                window.deviceList = $("#organId").val();
                if (deviceList != undefined&&deviceList != null) {
                    for (let i = 0; i < deviceList.length; i++) {
                        if (deviceList[i] == sender) {
                            appendLog(type, sender, JSON.stringify(data), logTime);
                        }
                    }
                } else {
                    appendLog(type, sender, JSON.stringify(data), logTime);
                }


                window.scrollTo(0, document.body.scrollHeight);
                return;
            case 'notification':
                if (data.clientNameList !== undefined) {
                    console.info(data.clientNameList);
                    appendNameList(data.clientNameList);
                }
                appendLog(type, sender, JSON.stringify(data.systemMessage), logTime);
                window.scrollTo(0, document.body.scrollHeight);
                return;
            default:
                break;
        }

        appendLog(type, sender, JSON.stringify(data), logTime);
        // console.log("ID: [%s] = %s", data.id, data.message);
        window.scrollTo(0, document.body.scrollHeight);
        // new Function("return " + data.message)().apply(this);
    }
    //监听连接关闭情况
    ws.onclose = function (e) {
        appendLog("Connection closed");
        setTimeout(startWebSocket, 1000);
        console.log("Connection closed");
    }

}
function appendNameList(clientNameList) {

    var multiple_select = document.getElementById('multiple_select');
    if (multiple_select !== null) {
        multiple_select.parentNode.removeChild(multiple_select);
    }
    var selector = document.getElementById('selector');
    multiple_select = document.createElement('div');
    multiple_select.id = 'multiple_select';
    selector.appendChild(multiple_select);


    var nameList = document.createElement('select');
    nameList.id = 'organId';
    nameList.name = "organId";
    nameList.setAttribute('multiple', 'multiple');
    clientNameList.forEach((value, index, array) => {
        var option = document.createElement("option");
        option.value = value;
        option.innerHTML = value;

        nameList.appendChild(option);
    });
    multiple_select.appendChild(nameList);
    $(function () {
        $("#organId").fSelect();
    });
    window.deviceList = $("#organId").val();
}
//显示消息
function appendLog(type, nickname, message, logTime) {
    if (typeof message == "undefined") return;
    var messages = document.getElementById('messages');
    var messageElem = document.createElement("li");
    var preface_label;
    var message_text;
    let msg = message.replace(/^(\s|")+|(\s|")+$/g, '');
    msgs = msg.split('\\n');
    msgs.forEach((value, index, array) => {
        console.info(value, index);
    })
    if (type === 'notification') {
        preface_label = `<span class="label label-warning"><i class="glyphicon glyphicon-plus"></i></span>`;
        // message_text = `<p>${preface_label}&nbsp;&nbsp;${logTime} : </p>`
        // msgs.forEach((value, index, array) => {
        //     message_text += `<p>&nbsp;&nbsp;${value}</p>`
        // })
        p = document.createElement('p');
        p.innerHTML = `${preface_label}&nbsp;&nbsp;${logTime} : `;
        messageElem.appendChild(p);
        msgs.forEach((value, index, array) => {
            p = document.createElement('p');
            p.innerHTML = `&nbsp;&nbsp;${value}`
            messageElem.appendChild(p);
        })
    } else if (type == 'debugger') {
        preface_label = `<span class="label label-warning"><i class="glyphicon glyphicon-bullhorn"></i></span>`;
        // message_text = `<p>${preface_label}&nbsp;&nbsp;${logTime} : </p>`
        // msgs.forEach((value, index, array) => {
        //     message_text += `<p>&nbsp;&nbsp;${value}</p>`
        // })
        p = document.createElement('p');
        p.innerHTML = `${preface_label}&nbsp;&nbsp;${logTime} : `;
        messageElem.appendChild(p);
        msgs.forEach((value, index, array) => {
            p = document.createElement('p');
            p.innerHTML = `&nbsp;&nbsp;${value}`
            messageElem.appendChild(p);
        })
    } else {
        preface_label = `<span class="label label-info">${nickname}</span>`;
        p = document.createElement('p');
        p.innerHTML = `${preface_label}&nbsp;&nbsp;${logTime} : `;
        p.className = "user_msg";
        messageElem.appendChild(p);
        myvalue = '';
        msgs.forEach((value, index, array) => {
            if (value.length === 0) return;
            myvalue = `${myvalue}
            ${value.replace(/^\s+/, '').replace(/\\"/gm, '"').replace(/\\r/gm, '').replace(/\\t/gm, '')}
            ` ;


        })
        tabchar = ' ';
        tabsize = 4;
        var fjs = js_beautify(`${myvalue}`, tabsize, tabchar);
        var consoleLog = ``;
        let key_index = 0;
        try {
            if (typeof (fjs) === "object") {
                mylog = fjs;
            } else {
                mylog = JSON.parse(fjs);
            }

            for (let key in mylog) {
                if (parseInt(key) === key_index && mylog[key] === mylog[key_index]) {
                    thislog = mylog[key];
                    if (typeof (thislog) === "object") {
                        thislog = JSON.stringify(thislog, null, 4);
                    }
                    consoleLog = `${consoleLog} ${thislog}`;
                    key_index++;
                }
            }
            if (Object.keys(mylog).length === key_index) {
                fjs = consoleLog;
            }
        } catch (error) {
            // console.info(error);
        }
        textarea = document.createElement('textarea');
        // textarea.rows = rows;
        textarea.disabled = "disabled";
        textarea.readonly = "readonly";
        textarea.className = "textarea-inherit";
        textarea.innerHTML = `${fjs}`;
        textarea.rows = textarea.innerHTML.split("\n").length;
        messageElem.appendChild(textarea);
    }
    // messageElem.innerHTML = message_text;
    messages.appendChild(messageElem);
}
//发送消息
function sendMessage(type) {
    var messageField = document.getElementById('message');
    var scriptName = document.getElementById('scriptName').value;
    if (ws.readyState === WebSocket.OPEN) {
        // ws.send("function(){" + messageField.value + "}");command
        // ws.send(messageField.value);
        if (window.command === '') return;
        let receiver = $("#organId").val();
        if (receiver === null) {
            receiver = 'all';
        }
        const msg = {
            "data": {
                "name": scriptName,
                "script": window.command,
                "id": scriptName,
                "command": type
            },
            "type": "command",
            "command": type
        }
        ws.send(JSON.stringify({
            "type": 'command',
            "data": msg
        }));
    } else {

    }
    messageField.value = '';
    messageField.focus();
}
//script save
function saveScript() {
    var messageField = document.getElementById('message');
    if (ws.readyState === WebSocket.OPEN) {
        // ws.send("function(){" + messageField.value + "}");command
        // ws.send(messageField.value);
        if (window.command === '') return;
        let receiver = $("#organId").val();
        if (receiver === null) {
            receiver = 'all';
        }
        ws.send(JSON.stringify({
            "type": 'command',
            "sender": 'debugger',
            'receiver': receiver,
            "data": window.command,
            "commandType": "save"
        }));
    } else {

    }
    messageField.value = '';
    messageField.focus();
}
//修改名称
function changName() {
    var name = document.getElementById('name').value;
    if (ws.readyState === WebSocket.OPEN) {
        ws.send("/nick " + name);
    }
}
startWebSocket();



