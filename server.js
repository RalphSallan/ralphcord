var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(4000);

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', function(req, res){
    roomId = Math.floor(100000 + Math.random() * 900000);
    res.redirect(`/${roomId}`);
});

app.get('/:room', function(req, res){
    res.render('room', { roomID: req.params.room });
});

io.on('connection', function(socket){
    socket.on('join-room', function(roomId, userId){
        socket.join(roomId);
        socket.broadcast.to(roomId).emit('user-connected', userId);
    
        socket.on('disconnect', function(){
            socket.broadcast.to(roomId).emit('user-disconnected', userId);
        });
    });

    socket.on('chat', function(roomId, data){
        io.to(roomId).emit('chat', data);
    });

    socket.on('typing', function(roomId, data){
        socket.broadcast.to(roomId).emit('typing', data);
    });

    socket.on('erased', function(roomId){
        socket.broadcast.to(roomId).emit('erased');
    })

});