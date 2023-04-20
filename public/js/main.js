let socket;
let username = "";
let registered = false;
let roomID = window.location.pathname;
let dialogElement;
let inputElement;
let fileInputElement;

function changeUsername() {
    printMessage("请输入您的新昵称");
    registered = false;
}

function register() {
    if (username !== "") {
        socket.emit("register", username, roomID);
    }
}

function processInput(input) {
    input = input.trim();
    switch (input) {
        case "":
            break;
        case "help":
            printMessage("https://github.com/songquanpeng/chat-room", "System");
            break;
        case "clear":
            clearMessage();
            break;
        default:
            sendMessage(input);
            break;
    }
    clearInputBox();
}

function clearInputBox() {
    inputElement.value = "";
}

function clearMessage() {
    dialogElement.innerHTML = "";
}

function char2color(c) {
    let num = c.charCodeAt(0);
    let r = Math.floor(num % 255);
    let g = Math.floor((num / 255) % 255);
    let b = Math.floor((r + g) % 255);
    if (g < 20) g += 20;
    return `#${r.toString(16)}${g.toString(16)}${b.toString(16)}`;
}

function printMessage(content, sender = "系统", type = "TEXT") {
    let html;
    let firstChar = sender[0];
    switch (type) {
        case "IMAGE":
            html = `<div class="chat-message shown">
    <div class="avatar" style="background-color:${char2color(firstChar)}">${firstChar.toUpperCase()}</div>
    <div class="nickname">${sender}</div>
    <div class="message-box"><img src="${content}" alt="${content}"></div>
</div>`
            break;
        case "AUDIO":
            html = `<div class="chat-message shown">
    <div class="avatar" style="background-color:${char2color(firstChar)}">${firstChar.toUpperCase()}</div>
    <div class="nickname">${sender}</div>
    <div class="message-box"><audio controls src="${content}"></div>
</div>`
            break;
        case "VIDEO":
            html = `<div class="chat-message shown">
    <div class="avatar" style="background-color:${char2color(firstChar)}">${firstChar.toUpperCase()}</div>
    <div class="nickname">${sender}</div>
    <div class="message-box"><video controls><source src="${content}"></video></div>
</div>`
            break;
        case "FILE":
            let parts = content.split('/');
            let text = parts[parts.length - 1];
            html = `<div class="chat-message shown">
    <div class="avatar" style="background-color:${char2color(firstChar)}">${firstChar.toUpperCase()}</div>
    <div class="nickname">${sender}</div>
    <div class="message-box"><a href="${content}" download="${text}">${text}</a></div>
</div>`
            break;
        case "TEXT":
        default:
            html = `<div class="chat-message shown">
    <div class="avatar" style="background-color:${char2color(firstChar)}">${firstChar.toUpperCase()}</div>
    <div class="nickname">${sender}</div>
    <div class="message-box"><p>${content}</p></div>
</div>`
            break;
    }
    dialogElement.insertAdjacentHTML('beforeend', html)
    dialogElement.scrollTop = dialogElement.scrollHeight;
}

function sendMessage(content, type = "TEXT") {
    let data = {
        content,
        type,
    };
    socket.emit("message", data, roomID);
}

function initSocket() {
    socket = io();
    socket.on("message", function (message) {
        player.danmu.sendComment({  //发送弹幕
            duration: 10000,
            id: new Date().valueOf(),
            start: 0,
            txt: message.content.replace("<p>", "").replace("</p>", ""),
            style: {
                color: '#ffffff',
                fontSize: '20px',
                border: 'solid 1px #ff9500',
                borderRadius: '50px',
                padding: '5px 11px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }
        })
        printMessage(message.content, message.sender, message.type);
    });
    socket.on("register success", function () {
        registered = true;
        localStorage.setItem("username", username);
        clearInputBox();
    });
    socket.on("conflict username", function () {
        registered = false;
        localStorage.setItem("username", "");
        printMessage(
            "该昵称已被占用，请输入新的昵称"
        );
    });
}

function send() {
    let input = inputElement.value;
    if (registered) {
        processInput(input);
    } else {
        username = input;
        register();
    }
}

function sendByDanma(input) {
    processInput(input);
}

window.onload = function () {
    initSocket();
    dialogElement = document.getElementById("dialog");
    inputElement = document.getElementById("input");
    fileInputElement = document.getElementById("fileInput");
    inputElement.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            e.preventDefault();
            send();
        }
    });
    username = localStorage.getItem("username");
    if (username) {
        register();
    } else {
        printMessage("请输入您的昵称");
    }
};
