var hosturl = 'https://ralphcord.herokuapp.com';

var socket = io(hosturl);
var myPeer = new Peer(undefined, {
    host: 'my-peerjs-server-chat.herokuapp.com',
    port: '443'
});

var videoGrid = document.getElementById('video-grid');
var myVideo = document.createElement('video');
myVideo.muted = true;

var message = document.getElementById('message');
var handle = document.getElementById('handle');
var sendmessage = document.getElementById('send');
var output = document.getElementById('output');
var feedback = document.getElementById('feedback');
var wind = document.getElementById('chat-window');
var joinbtn = document.getElementById('joinroom-button');
var roomIdCode = document.getElementById('roomIdCode');
var idbox = document.getElementById('id-box');

var joinsfx = new Audio('joinsfx.wav');
var leavesfx = new Audio('leavesfx.wav');

idbox.innerHTML = ROOM_ID;

var peers = {};
var notifications = 0;

navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(function(stream) {

    var myVideobox = document.createElement('div');
    //myVideobox.style.border = "thick solid #0000FF";

    myVideobox.append(myVideo);
    myVideobox.id = ('videobox');

    addVideoStream(myVideobox, stream);

    myPeer.on('call', function(call) {
        call.answer(stream);

        peers[call.peer] = call;

        var video = document.createElement('video');
        var videobox = document.createElement('div');
        var volume = document.createElement('input');
        //videobox.style.border = "thick solid #0000FF";
        videobox.id = ('videobox');
        videobox.append(video);
        volume.id = 'volume';
        volume.min = 0;
        volume.max = 100;

        volume.type = 'range';
        videobox.append(volume);

        volume.addEventListener('input', function(){
            this.previousSibling.volume = this.value / 100;
        });
        
        call.on('stream', function(userVideoStream) {
            addVideoStream(videobox, userVideoStream);
        });

        call.on('close', function() {
            videobox.remove();
        })
    });
    socket.on('user-connected', function(userId){
        joinsfx.play();
        setTimeout(connectToNewUser, 1500, userId, stream);
        addnotif();
    });
});

socket.on('user-disconnected', function(userId){
    leavesfx.play();
    if (peers[userId]) {
        peers[userId].close();
        delete peers.userId;
    }
    addnotif();
});

myPeer.on('open', function(id){
    socket.emit('join-room', ROOM_ID, id);
});

var handle_chosen = false;

handle.addEventListener('keydown', function(e){
    if (e.key === ('Enter') && handle.value != '' && !handle_chosen){
        handle.placeholder = handle.value;
        handle_chosen = true;
        sendmessage.innerHTML = 'Send';
        message.style.visibility = 'visible';
        handle.disabled = true;
    }
});

message.addEventListener('keypress', function(){
        socket.emit('typing', ROOM_ID, handle.value);
});

message.addEventListener('keydown', function(e){
    if (e.key === 'Backspace'){
        socket.emit('erased', ROOM_ID);
    }
    else if (e.key === 'Enter'){
        setTimeout(function(){
            socket.emit('erased', ROOM_ID);
        }, 2);
    }
})
sendmessage.addEventListener('click', function(){

    if (!handle_chosen && handle.value != "") {
        handle.placeholder = handle.value;
        handle_chosen = true;
        handle.disabled = true;
        message.style.visibility = 'visible';
        sendmessage.innerHTML = "Send";
    }
    else if (handle_chosen) {
        sendmessage.style.backgroundColor = '#171A53';
        setTimeout(function(){
            sendmessage.style.backgroundColor = '#292F95';
    }, 70);

        socket.emit('chat', ROOM_ID, {
            message: message.value,
            handle: handle.value
        });

        message.value = '';
    }
});

message.addEventListener('keydown', function(e){
    if (e.key === 'Enter'){
        sendmessage.style.backgroundColor = '#171A53';
        setTimeout(function(){
            sendmessage.style.backgroundColor = '#292F95';
        }, 70);

        socket.emit('chat', ROOM_ID, {
            message: message.value,
            handle: handle.value
        });

        socket.emit('erased', ROOM_ID);
    }
});

joinbtn.addEventListener('click', function(){
    joinbtn.style.backgroundColor = '#171A53';
    setTimeout(function(){
        joinbtn.style.backgroundColor = '#292F95';
    }, 70);

    //socket.emit('pressed-join', roomIdCode.value);

    //roomIdCode must be 8 characters long
    if (roomIdCode.value.length == 8 && onlyLetters(roomIdCode.value)){
        document.location.href = hosturl + '/' + roomIdCode.value;
    }
    else {
        roomIdCode.value = "";
        roomIdCode.placeholder = "room ID is 8 characters of letters and numbers";
    }
});

roomIdCode.addEventListener('keydown', function(e){
    if (e.key === 'Enter'){
        joinbtn.style.backgroundColor = '#171A53';
        setTimeout(function(){
            joinbtn.style.backgroundColor = '#292F95';
        }, 70);

        //roomIdCode must be 8 characters long
        if (roomIdCode.value.length == 8 && onlyLetters(roomIdCode.value)){
            document.location.href = hosturl + '/' + roomIdCode.value;
        }
        else {
            roomIdCode.value = "";
            roomIdCode.placeholder = "room ID is 8 characters of letters and numbers";
        }
    }
});

socket.on('chat', function(data){
    output.innerHTML += '<p><strong>' + data.handle + ': </strong>' + data.message + '</p>'
    feedback.innerHTML = '';
    wind.scrollTop = wind.scrollHeight;

    addnotif();
});

socket.on('typing', function(data){
    feedback.innerHTML = '<p><em>' + data + ' is typing... </em></p>'
    wind.scrollTop = wind.scrollHeight;
});

socket.on('erased', function(){
    feedback.innerHTML = '';
});

window.onfocus = function(){
    document.title = 'ralphcord';
    notifications = 0;
}

function connectToNewUser(userId, stream){
    var call = myPeer.call(userId, stream);
    var video = document.createElement('video');
    var videobox = document.createElement('div');
    var volume = document.createElement('input');
    //videobox.style.border = "thick solid #0000FF";
    videobox.id = ("videobox");
    videobox.append(video);

    volume.type = 'range';
    volume.id = 'volume';
    volume.min = 0;
    volume.max = 100;
    videobox.append(volume);

    volume.addEventListener('input', function(){
        this.previousSibling.volume = this.value / 100;
    })

    call.on('stream', function(userVideoStream){
        addVideoStream(videobox, userVideoStream);
    });
    call.on('close', function(){
        videobox.remove();
    });
    peers[userId] = call;
}

function addVideoStream(videobox, stream) {
    videobox.firstChild.srcObject = stream;
    videobox.firstChild.addEventListener('loadedmetadata', function(){
    videobox.firstChild.play();
    });
    videoGrid.append(videobox);
}

function onlyLetters(code) {
    return code.match("^[A-Za-z0-9]+$");
  }

function addnotif(){
    if (!document.hasFocus()){
        notifications += 1;
        document.title = `(${notifications}) ralphcord`;
    }
}