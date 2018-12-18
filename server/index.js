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

io.on('connection', function(socket){
	console.log(apimedic)
	socket.on('chat_message', function(msg){
		symptoms_list = apimedic.parse_symptoms(msg);
		console.log(apimedic.get_diagnosis(symptoms_list));
		io.emit('chat_response', msg + "x");
	});
});

//create APIs

http.listen(3000);
console.log("Server listening on port 3000");