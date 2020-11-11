var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3002;

class user {
    constructor(num) {
        this.name = "User" + num;
        this.colour = (0x0000ff ** num) % 0x1000000;
        this.online = true;
    }
}

class log_entry {
    constructor(args) {
        this.args = args;
    }
}

let users = [];
let log = [];

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/chat.js', function (req, res) {
    res.sendFile(__dirname + '/chat.js');
});

app.get('/style.css', function (req, res) {
    res.sendFile(__dirname + '/style.css');
});

io.on('connection', function (socket) {
    socket.on('handshake', function (id) {
        if(id >= users.length || id == -1) {
            id = users.length;
            socket.emit('id', id);
            users.push(new user(users.length));
        } else {
            users[id].online = true;
        }
        for(entry of log) {
            if(entry.args[0] == 'chat message') {
                socket.emit(entry.args[0], entry.args[1], entry.args[2], entry.args[3], entry.args[4], users[entry.args[1]].colour);
            }
            else if(entry.args[0] == 'server msg') {
                socket.emit(entry.args[0], entry.args[1]);
            }
        }
        for(let i = 0; i < users.length; i++) {
            if(users[i].online) {
                io.emit('user online', i, users[i].name, users[i].colour);
            }
        }
    });

    socket.on('chat message', function (id, msg) {
        if(msg.length == 0) return;
        if(msg.split("")[0] == '/') {
            if(msg.split(" ")[0] == '/name') {
                let new_name = msg.substring(6);
                for(i of users) {
                    if(i.name == new_name) {
                        socket.emit('my error', "Username taken");
                        return;
                    }
                }
                io.emit('name change', id, users[id].name, new_name);
                log.push(new log_entry(['server msg', users[id].name + " has changed names to " + new_name]));
                users[id].name = new_name;
                return;
            }
            if(msg.split(" ")[0] == '/color') {
                let new_colour = parseInt(msg.split(" ")[1], 16);
                if(isNaN(new_colour) || !is_colour(msg.split(" ")[1])) {
                    socket.emit('my error', "Invalid colour");
                    return;
                }
                //console.log(new_colour);
                users[id].colour = new_colour;
                io.emit('colour change', id, new_colour);
                return;
            }
            socket.emit('my error', "Invalid command");
            return;
        }

        let now = new Date();
        time = now.getHours() + ":";
        if (now.getMinutes() < 10)
            time += "0";
        time += now.getMinutes();
        io.emit('chat message', id, users[id].name, msg, time, users[id].colour);
        log.push(new log_entry(['chat message', id, users[id].name, msg, time]));
        //console.log(msg + "\t" + time);
    });

    socket.on('disconnect', function () {
        io.emit('ping');
        for(i of users) {
            i.online = false;
        }
        setInterval(online_check, 10000, socket);
    });

    socket.on('pong', function (id) {
        if(id < users.length)
            users[id].online = true;
    });
});

http.listen(port, function () {
    console.log('listening on *:' + port);
});

function online_check() {
    for(let i = 0; i < users.length; i++) {
        if(!users[i].online) {
            //console.log(i);
            io.emit('user disconnect', i);
        }
    }
}

function is_colour(colour) {
    if(colour.length != 6) {
        return false;
    }
    for(let i = 0; i < colour.length; i++) {
        let code = colour.charCodeAt(i);
        if(code < 48 || (code > 57 && code < 65) || (code > 70 && code < 97) || code > 102) {
            return false;
        }
    }
    return true;
}
