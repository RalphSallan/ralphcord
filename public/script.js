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

navigator.mediaDevices.getUserMedia({
    video:true,
    audio: true
}).then(function(stream) {
    addVideoStream(myVideo, stream);

    myPeer.on('call', function(call) {
        call.answer(stream);
        
        peers[call.peer] = call;

        var video = document.createElement('video');
        call.on('stream', function(userVideoStream) {
            addVideoStream(video, userVideoStream);
        });

        call.on('close', function() {
            video.remove();
        })

        

    });

    socket.on('user-connected', function(userId){
        joinsfx.play();
        setTimeout(connectToNewUser, 300, userId, stream)
    });

    

});

socket.on('user-disconnected', function(userId){
    leavesfx.play();
    if (peers[userId]) {
        peers[userId].close();
        delete peers.userId;
    }
});

myPeer.on('open', function(id){
    socket.emit('join-room', ROOM_ID, id);
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
    sendmessage.style.backgroundColor = '#171A53';
    setTimeout(function(){
        sendmessage.style.backgroundColor = '#292F95';
   }, 70);

    socket.emit('chat', ROOM_ID, {
        message: message.value,
        handle: handle.value
    });

    message.value = '';
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

        //socket.emit('pressed-join', roomIdCode.value);

        //roomIdCode must be 8 characters long
        if (roomIdCode.value.length == 8 && onlyLetters(roomIdCode.value)){
            document.location.href = 'http://localhost:4000/' + roomIdCode.value;
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
});

socket.on('typing', function(data){
    feedback.innerHTML = '<p><em>' + data + ' is typing... </em></p>'
    wind.scrollTop = wind.scrollHeight;
});

socket.on('erased', function(){
    feedback.innerHTML = '';
});

function connectToNewUser(userId, stream){
    var call = myPeer.call(userId, stream);
    var video = document.createElement('video');

    call.on('stream', function(userVideoStream){
        addVideoStream(video, userVideoStream);
    });
    call.on('close', function(){
        video.remove();
    });

    peers[userId] = call;
}

function addVideoStream(video, stream) {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', function(){
        video.play();
    })
    videoGrid.append(video);
}

function onlyLetters(code) {
    return code.match("^[A-Za-z0-9]+$");
  }