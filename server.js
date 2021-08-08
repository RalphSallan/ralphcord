var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(process.env.PORT || 4000);

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', function(req, res){
    //make random id of length 8
    const idlength = 8;
    var roomId = makeid(idlength);
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

    socket.on('pressed-join', function(){
        //check to see if the room exists.
        //if it exists, then allow the front end to connect
    })
});

function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}