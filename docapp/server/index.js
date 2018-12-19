var express = require("express");
var app = express();
var path = require("path");
var apimedic = require('./apimedic');
app.use(express.static(path.resolve(__dirname,"../client")));

var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/',function(req,res){
	res.sendFile(path.resolve(__dirname,"../client/index.html"));
});

//create APIs

io.on('connection', function(socket){
	socket.on('chat_message', function(msg){
		socket.broadcast.emit('chat_message', msg)
	})
})

http.listen(4000);
console.log("Server listening on port 4000");