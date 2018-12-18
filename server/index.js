var express = require("express");
var app = express();
var path = require("path");
app.use(express.static(path.resolve(__dirname,"../client")));

var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/',function(req,res){
	res.sendFile(path.resolve(__dirname,"../client/index.html"));
});

io.on('connection', function(socket){
	console.log('connection established')
  socket.on('chat_message', function(msg){
  	//msg is the input received from the user
  	//Process it and extract key words before performing request to apiMedic
  });
});

//create APIs

http.listen(3000);
console.log("Server listening on port 3000");