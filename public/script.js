var socket = io('/')
var myPeer = new Peer(undefined, {
    host: '/',
    port: '4001'
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

var peers = {};

navigator.mediaDevices.getUserMedia({
    video:true,
    audio: true
}).then(function(stream) {
    addVideoStream(myVideo, stream);

    myPeer.on('call', function(call) {
        call.answer(stream);
        var video = document.createElement('video');
        call.on('stream', function(userVideoStream) {
            addVideoStream(video, userVideoStream);
        });
    });

    socket.on('user-connected', function(userId){
        setTimeout(connectToNewUser, 1000, userId, stream)
    });
});

socket.on('user-disconnected', function(userId){
    if (peers[userId]) {
        peers[userId].close();
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
})
sendmessage.addEventListener('click', function(){
    sendmessage.style.backgroundColor = '#575999';
    setTimeout(function(){
        sendmessage.style.backgroundColor = '#575ed8';
   }, 70);

    socket.emit('chat', ROOM_ID, {
        message: message.value,
        handle: handle.value
    });

    message.value = '';

});

socket.on('chat', function(data){
    output.innerHTML += '<p><strong>' + data.handle + ': </strong>' + data.message + '</p>'
    wind.scrollTop = wind.scrollHeight;
    feedback.innerHTML = '';
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