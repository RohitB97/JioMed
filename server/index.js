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

function distance(lat1, lon1, lat2, lon2, unit) {
	if ((lat1 == lat2) && (lon1 == lon2)) {
		return 0;
	}
	else {
		var radlat1 = Math.PI * lat1/180;
		var radlat2 = Math.PI * lat2/180;
		var theta = lon1-lon2;
		var radtheta = Math.PI * theta/180;
		var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
		if (dist > 1) {
			dist = 1;
		}
		dist = Math.acos(dist);
		dist = dist * 180/Math.PI;
		dist = dist * 60 * 1.1515;
		if (unit=="K") { dist = dist * 1.609344 }
		if (unit=="N") { dist = dist * 0.8684 }
		return dist;
	}
}
function round2(x){
	return Math.round(x * 100) / 100
}
function dist2(location){
	var lat = location.lat
	var lon = location.lng
	var dist = distance(lat, lon, 19.130784,72.916469, 'K');
	return round2(dist)
}

io.on('connection', function(socket){
	var state = 'FREE'; // FREE -> AGE -> GENDER -> SYMPT -> EXTRA_SYMPT -> DIAGNOSED = FREE or FREE -> INFO -> FREE
	var full_symptoms_list = [];
	var suggestions_list = [];
	var gender = undefined;
	var age = undefined;
	var response;

	io.emit('chat_response', "Would you like to </br>1) Diagnose your Symptoms</br>2) Check Disease Information");
	socket.on('chat_message', function(msg){
		if(state == 'FREE'){
			if(parseInt(msg) == 2){
				io.emit('chat_response', 'What disease would you like information about?')
				state = 'INFO'
			} else {
				if(gender === undefined || age === undefined){
					io.emit('chat_response', 'Enter age for diagnosis')
					state = 'AGE'
				} else {
					io.emit('chat_response', 'What are your symptoms?')
					state = 'SYMPT'
				}
			}
		} else if(state == 'AGE'){
			age = parseInt(msg);
			console.log(age);
			io.emit('chat_response', 'Enter gender for diagnosis</br>1) Male</br>2) Female</br>3) Other')
			state = 'GENDER'
		} else if(state == 'GENDER'){
			gender = parseInt(msg);
			if(gender==3) 
				gender = 'Other'
			else if(gender==2)
				gender = 'Female'
			else
				gender = 'Male'
			console.log(age, gender);
			io.emit('chat_response', 'What are your symptoms?')
			state = 'SYMPT'
		}else if(state == 'INFO'){
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
			apimedic.get_suggestions(full_symptoms_list, age, gender, function(data){
				
				console.log(full_symptoms_list, data)
				if(data.length == 0){
					apimedic.get_diagnosis(full_symptoms_list, age, gender, function(data){
						if(data.length == 0){
							io.emit('chat_response', 'No diagnosis available.')
							state = 'FREE';
							io.emit('chat_response', "Would you like to </br>1) Diagnose your Symptoms</br>2) Check Disease Information");
							full_symptoms_list = [];
							suggestions_list = [];
						} else {
							apimedic.get_disease_info(data[0].Issue.ID, function(disease_info){
								// var response = "Age: " + age + " Gender: " + gender + "</br>Symptoms: " + String(full_symptoms_list)
								// io.emit('chat_response', response)
								response = "Your diagnosis is:</br>";
								console.log(data)
								data.forEach(function(value, index){
									response = response + String(index+1) + ') <b>' + value.Issue.Name + '</b> ('+ 
										String(round2(value.Issue.Accuracy)) + '%) - ';
									response = response + 'See a ' + value.Specialisation[0].Name + ' specialist</br>';
									if(index == 0) response = response + disease_info.DescriptionShort + '</br>';
								})
								io.emit('chat_response', response)
								apimedic.get_clinics('19.130784,72.916469', function(clinic_data){
									response = 'Specialist Clinics near you:</br>';
									clinic_data.forEach(function(value, index){
										response = response +'</br>' + String(index+1) + ') <b>' + value.name + '</b> (Distance: ' + dist2(value.geometry.location) +
											' km)</br>' + (value.formatted_address||"Unknown") + '</br>Phone:' + (value.formatted_phone_number||"Unknown")+'</br>';
									});
									io.emit('chat_response', response)
									response = "<div><p> Consult a Doctor!</p></div>"
									response = response + '<div><a target="_blank" class="btn btn-primary" href="http://localhost:4000"> Message </a>&nbsp&nbsp&nbsp<a target="_blank" class="btn btn-primary" href="http://localhost:4000/videoChat"> Video Call </a></div>';
									io.emit('chat_response',response);
									state = 'FREE';
									io.emit('chat_response', "Would you like to </br>1) Diagnose your Symptoms</br>2) Check Disease Information");
									full_symptoms_list = [];
									suggestions_list = [];
								});
							})
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
				apimedic.get_diagnosis(full_symptoms_list, age, gender, function(data){
					console.log(full_symptoms_list, data)
					if(data.length == 0){
						io.emit('chat_response', 'No diagnosis available.')
						state = 'FREE';
						io.emit('chat_response', "Would you like to </br>1) Diagnose your Symptoms</br>2) Check Disease Information");
						full_symptoms_list = [];
						suggestions_list = [];
					} else {
						apimedic.get_disease_info(data[0].Issue.ID, function(disease_info){
							// var response = "Age: " + age + " Gender: " + gender + "</br>Symptoms: " + String(full_symptoms_list)
							// io.emit('chat_response', response)
							response = "Your diagnosis is:</br>";
							console.log(data)
							data.forEach(function(value, index){
								response = response + String(index+1) + ') <b>' + value.Issue.Name + '</b> ('+ 
									String(round2(value.Issue.Accuracy)) + '%) - ';
								response = response + 'See a ' + value.Specialisation[0].Name + ' specialist</br>';
								if(index == 0) response = response + disease_info.DescriptionShort + '</br>';
							})
							
							io.emit('chat_response', response)
							apimedic.get_clinics('19.130784,72.916469', function(clinic_data){
								response = 'Specialist Clinics near you:</br>';
								clinic_data.forEach(function(value, index){
									response = response +'</br>' + String(index+1) + ') <b>' + value.name + '</b> (Distance: ' + dist2(value.geometry.location) +
										' km)</br>' + (value.formatted_address||"Unknown") + '</br>Phone:' + (value.formatted_phone_number||"Unknown")+'</br>';
								});
								io.emit('chat_response', response)
								response = "<div><p> Consult a Doctor!</p></div>"
								response = response + '<div><a target="_blank" class="btn btn-primary" href="http://localhost:4000"> Message </a>&nbsp&nbsp&nbsp<a target="_blank" class="btn btn-primary" href="http://localhost:4000/videoChat"> Video Call </a></div>';
								io.emit('chat_response',response);
								state = 'FREE';
								io.emit('chat_response', "Would you like to </br>1) Diagnose your Symptoms</br>2) Check Disease Information");
								full_symptoms_list = [];
								suggestions_list = [];
							});
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
				apimedic.get_suggestions(full_symptoms_list, age, gender, function(data){
					console.log(data);
					if(data.length == 0){
						apimedic.get_diagnosis(full_symptoms_list, age, gender, function(data){
							if(data.length == 0){
								io.emit('chat_response', 'No diagnosis available.')
								state = 'FREE';
								io.emit('chat_response', "Would you like to </br>1) Diagnose your Symptoms</br>2) Check Disease Information");
							full_symptoms_list = [];
								suggestions_list = [];
							} else {
								apimedic.get_disease_info(data[0].Issue.ID, function(disease_info){
									// var response = "Age: " + age + " Gender: " + gender + "</br>Symptoms: " + String(full_symptoms_list)
									// io.emit('chat_response', response)
									response = "Your diagnosis is:</br>";
									console.log(data)
									data.forEach(function(value, index){
										response = response + String(index+1) + ') <b>' + value.Issue.Name + '</b> ('+ 
											String(round2(value.Issue.Accuracy)) + '%) - ';
										response = response + 'See a ' + value.Specialisation[0].Name + ' specialist</br>';
										if(index == 0) response = response + disease_info.DescriptionShort + '</br>';
									})
									io.emit('chat_response', response)
									apimedic.get_clinics('19.130784,72.916469', function(clinic_data){
										response = 'Specialist Clinics near you:</br>';
										clinic_data.forEach(function(value, index){
											response = response +'</br>' + String(index+1) + ') <b>' + value.name + '</b> (Distance: ' + dist2(value.geometry.location) +
												' km)</br>' + (value.formatted_address||"Unknown") + '</br>Phone:' + (value.formatted_phone_number||"Unknown")+'</br>';
										});
										io.emit('chat_response', response)
										response = "<div><p> Consult a Doctor!</p></div>"
										response = response + '<div><a target="_blank" class="btn btn-primary" href="http://localhost:4000"> Message </a>&nbsp&nbsp&nbsp<a target="_blank" class="btn btn-primary" href="http://localhost:4000/videoChat"> Video Call </a></div>';
										io.emit('chat_response',response);
										state = 'FREE';
										io.emit('chat_response', "Would you like to </br>1) Diagnose your Symptoms</br>2) Check Disease Information");
										full_symptoms_list = [];
										suggestions_list = [];
									});
								})
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