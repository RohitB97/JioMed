var express = require("express");
var app = express();
app.use(express.static(__dirname));

app.get('/*',function(req,res){
	res.sendFile(__dirname + "/client/index.html");
});

//create APIs

app.listen(3000);
console.log("Server listening on port 3000");