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
	var state = 'FREE'; // FREE -> EXTRA_SYMPT -> DIAGNOSED = FREE
	var full_symptoms_list = [];
	io.emit('chat_response', "What are your symptoms");
	socket.on('chat_message', function(msg){
		if(state == 'FREE'){
			// get initial symptoms list
			// TODO age, ..
			var symptoms_list = apimedic.parse_symptoms(msg);
			io.emit('chat_response', "Got symptoms " + String(symptoms_list));
			full_symptoms_list = symptoms_list.slice();

			if(full_symptoms_list.length < 5){
				// give user suggestions
				apimedic.get_suggestions(full_symptoms_list, function(data){
					var response = "Do you have these other symptoms: ";
					// console.log(data)
					data.forEach(function(value, index){
						response = response + String(index+1) + ') ' + value.Name + ' ';
					})
					io.emit('chat_response', response)
					state = 'EXTRA_SYMPT';
				})
			} else {
				apimedic.get_diagnosis(full_symptoms_list, function(data){
					io.emit('chat_response', "Your diagnosis is : " + JSON.stringify(data))
					state = 'FREE';
				})

			}
			
		} else if(state == 'EXTRA_SYMPT'){
			if(msg == "no" || full_symptoms_list.length >= 5){
				apimedic.get_diagnosis(full_symptoms_list, function(data){
					io.emit('chat_response', "Your diagnosis is : " + JSON.stringify(data))
					state = 'FREE';
				})
			} else {
				var symptoms_list = apimedic.parse_symptoms(msg);
				symptoms_list.forEach(symptom => full_symptoms_list.push(symptom))
				io.emit('chat_response', "Added symptoms : " + JSON.stringify(symptoms_list))
				apimedic.get_suggestions(full_symptoms_list, function(data){
					io.emit('chat_response', "Do you have these other symptoms: " + JSON.stringify(data))
					state = 'EXTRA_SYMPT';
				})
			}
		}
		
	});
});

//create APIs

http.listen(3000);
console.log("Server listening on port 3000");