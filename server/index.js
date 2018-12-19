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
	var state = 'FREE'; // FREE -> SYMPT -> EXTRA_SYMPT -> DIAGNOSED = FREE or FREE -> INFO -> FREE
	var full_symptoms_list = [];
	var suggestions_list = [];

	io.emit('chat_response', "Would you like to </br>1) Diagnose your Symptoms</br>2) Check Disease Information");
	socket.on('chat_message', function(msg){
		if(state == 'FREE'){
			if(parseInt(msg) == 2){
				io.emit('chat_response', 'What disease would you like information about?')
				state = 'INFO'
			} else {
				io.emit('chat_response', 'What are your symptoms?')
				state = 'SYMPT'
			}
		} else if(state == 'INFO'){
			var disease = apimedic.get_disease(msg);
			if(!disease){
				io.emit('chat_response', 'Sorry, no such disease found')
				state = 'FREE'
				io.emit('chat_response', "Would you like to </br>1) Diagnose your Symptoms</br>2) Check Disease Information");
			} else {
				apimedic.get_disease_info(disease.ID, function(data){
					console.log(disease, data)
					var response = '<b>' + disease.Name + '</b>: ' + (data.DescriptionShort || "No Info Found") + 
						'</br><b>Possible Symptoms</b>: ' + (data.PossibleSymptoms || "No Info Found") +
						'</br><b>Treatment</b>: ' + (data.TreatmentDescription || "No Info Found") + '</br>'
					io.emit('chat_response', response)
					state = 'FREE'
					io.emit('chat_response', "Would you like to </br>1) Diagnose your Symptoms</br>2) Check Disease Information");
				})
			}
		} else if(state == 'SYMPT'){
			// get initial symptoms list
			// TODO age, ..
			var symptoms_list = apimedic.parse_symptoms(msg);
			// io.emit('chat_response', "Got symptoms " + String(symptoms_list));
			full_symptoms_list = symptoms_list.slice();

			// give user suggestions
			apimedic.get_suggestions(full_symptoms_list, function(data){
				
				console.log(full_symptoms_list, data)
				if(data.length == 0){
					apimedic.get_diagnosis(full_symptoms_list, function(data){
						if(data.length == 0){
							io.emit('chat_response', 'No diagnosis available.')
							state = 'FREE';
							io.emit('chat_response', "Would you like to </br>1) Diagnose your Symptoms</br>2) Check Disease Information");
							full_symptoms_list = [];
							suggestions_list = [];
						} else {
							var response = "Your diagnosis is:</br>";
							console.log(data)
							data.forEach(function(value, index){
								response = response + String(index+1) + ') ' + value.Issue.Name + '</br>' 
								response = response + 'See a ' + value.Specialisation[0].Name + ' specialist</br>';
							})
							io.emit('chat_response', response)
							state = 'FREE';
							io.emit('chat_response', "Would you like to </br>1) Diagnose your Symptoms</br>2) Check Disease Information");
							full_symptoms_list = [];
							suggestions_list = [];
						}
					})
				} else {
					suggestions_list = data.map(value => value.Name);
					var response = "Do you have these other symptoms:</br>";
					data.forEach(function(value, index){
						response = response + String(index+1) + ') ' + value.Name + '</br>';
					})
					response = response + String(data.length+1) + ') None ';
					io.emit('chat_response', response)
					state = 'EXTRA_SYMPT';
				}
			})
		} else if(state == 'EXTRA_SYMPT'){
			var symptoms_list = apimedic.parse_list(msg);
			console.log(full_symptoms_list, symptoms_list)
			if(full_symptoms_list.length > 5 || (symptoms_list.length == 1 && parseInt(symptoms_list[0]) == (suggestions_list.length + 1))){
				// None
				apimedic.get_diagnosis(full_symptoms_list, function(data){
					console.log(full_symptoms_list, data)
					if(data.length == 0){
						io.emit('chat_response', 'No diagnosis available.')
						state = 'FREE';
						io.emit('chat_response', "Would you like to </br>1) Diagnose your Symptoms</br>2) Check Disease Information");
						full_symptoms_list = [];
						suggestions_list = [];
					} else {
						apimedic.get_disease_info(data[0].Issue.ID, function(disease_info){
							var response = "Your diagnosis is:</br>";
							console.log(data)
							data.forEach(function(value, index){
								response = response + String(index+1) + ') <b>' + value.Issue.Name + '</b> - ';
								response = response + 'See a ' + value.Specialisation[0].Name + ' specialist</br>';
								if(index == 0) response = response + disease_info.DescriptionShort + '</br>';
							})
							response = response + '<a href="#"> Chat with a doctor </a>';
							io.emit('chat_response', response)
							state = 'FREE';
							io.emit('chat_response', "Would you like to </br>1) Diagnose your Symptoms</br>2) Check Disease Information");
							full_symptoms_list = [];
							suggestions_list = [];
						})
						
					}
				})
			} else {
				var symptoms_name_list = []
				symptoms_list.forEach(idx => {
					idx = parseInt(idx) - 1;
					if(idx < suggestions_list.length)
						symptoms_name_list.push(suggestions_list[idx])
				})
				console.log(symptoms_name_list)
				symptoms_name_list.forEach(value => full_symptoms_list.push(value))
				// io.emit('chat_response', "Added symptoms : " + JSON.stringify(symptoms_name_list))
				apimedic.get_suggestions(full_symptoms_list, function(data){
					console.log(data);
					if(data.length == 0){
						apimedic.get_diagnosis(full_symptoms_list, function(data){
							if(data.length == 0){
								io.emit('chat_response', 'No diagnosis available.')
								state = 'FREE';
								io.emit('chat_response', "Would you like to </br>1) Diagnose your Symptoms</br>2) Check Disease Information");
							full_symptoms_list = [];
								suggestions_list = [];
							} else {
								var response = "Your diagnosis is:</br>";
								console.log(data)
								data.forEach(function(value, index){
									response = response + String(index+1) + ') ' + value.Issue.Name + '</br>' 
									response = response + 'See a ' + value.Specialisation[0].Name + ' specialist</br>';
								})
								io.emit('chat_response', response)
								state = 'FREE';
								io.emit('chat_response', "Would you like to </br>1) Diagnose your Symptoms</br>2) Check Disease Information");
							full_symptoms_list = [];
								suggestions_list = [];
							}
						})
					} else {
						suggestions_list = data.map(value => value.Name);
						var response = "Do you have these other symptoms:</br>";
						data.forEach(function(value, index){
							response = response + String(index+1) + ') ' + value.Name + '</br>';
						})
						response = response + String(data.length+1) + ') None ';
						io.emit('chat_response', response)
						state = 'EXTRA_SYMPT';
					}
				})
			}
		}
		
	});
});

//create APIs

http.listen(3000);
console.log("Server listening on port 3000");