$(function () {
    var socket = io();
    let users = {};
    let this_id = -1;
    if (document.cookie.split(';').some((item) => item.trim().startsWith('id='))) {
        this_id = Number(document.cookie.split('; ').find(row => row.startsWith('id')).split('=')[1]);
        socket.emit('handshake', this_id);
    } else {
        socket.emit('handshake new');
    }

    $('form').submit(function() {
        socket.emit('chat message', this_id, $('#m').val());
        $('#m').val('');
        return false;
    });

    socket.on('chat message', function(id, name, msg, time, colour) {
        msg = msg.replace(":)", String.fromCodePoint(0x1f600));
        msg = msg.replace(":(", String.fromCodePoint(0x1f626));
        msg = msg.replace(":o", String.fromCodePoint(0x1f62e));
        let newmsg = document.createElement("li");
        let usrnm = document.createElement("span");
        usrnm.className = "usr" + id;
        usrnm.style.color = "#" + zeroFill(colour.toString(16), 6);
        if(this_id == id) {
            usrnm.style.fontWeight = "bold";
        }
        usrnm.append(name + ": ");
        newmsg.append(usrnm);
        newmsg.append(msg);
        let time_element = document.createElement("span");
        time_element.style.textAlign = "right";
        time_element.append(time);
        newmsg.append(time_element);
        $('#messages').append(newmsg);
        window.scrollTo(0, document.body.scrollHeight);
        //console.log("#" + zeroFill(colour.toString(16),6));
    });

    socket.on('id', function(identification) {
        this_id = identification;
        document.cookie = "id=" + this_id;
        console.log(this_id);
    });

    socket.on('colour change', function(id, colour) {
        for(i of document.getElementsByClassName("usr" + id)) {
            i.style.color = "#" + zeroFill(colour.toString(16),6);
        }
        console.log(document.getElementsByClassName("usr" + id).length);
    });

    socket.on('server msg', function(msg) {
        let newmsg = document.createElement("li");
        newmsg.append(msg);
        $('#messages').append(newmsg);
        window.scrollTo(0, document.body.scrollHeight);
    });

    socket.on('my error', function(msg) {
        let newmsg = document.createElement("li");
        newmsg.style.color = "#ff0000";
        newmsg.style.fontWeight = "bold";
        newmsg.append(msg);
        $('#messages').append(newmsg);
        window.scrollTo(0, document.body.scrollHeight);
    });

    socket.on('ping', function() {
        socket.emit('pong', this_id);
    });
});

//https://stackoverflow.com/questions/1267283/how-can-i-pad-a-value-with-leading-zeros
function zeroFill(string, width)
{
  width -= string.length;
  if (width > 0)
  {
    return new Array(width + (/\./.test(string) ? 2 : 1)).join('0') + string;
  }
  return string + ""; // always return a string
}