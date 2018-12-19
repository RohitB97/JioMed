# JioMed+ (Inter IIT Coding Hackathon - IIT M)

## Interactive Medical Assistance bot designed for Reliance Jio feature phones

The vision of JioMed+ is to provide remote medical assistance to the 400 million feature phones users across the country and assist them with detailed medical information through instant messaging. This is especially relevant to rural citizens where access to healthcare can be sparse. JioMed+ enables such non tech-savvy users to make more informed healthcare decisions.

JioMed+ is capable of providing diagnosis for general ailments based on symptoms reported by the user. It also provides intelligent suggestions for other symptoms they may be experiencing. Upon diagnosis, the bot provides additional information regarding nearby medical facilities which can be approached for further treatment. It also facilitates in-app consultation with live medical professionals through instant messaging and video calling. The bot also provides information about common diseases and preliminary treatment.

JioMed+ is built on top of a NodeJS engine using knowledge APIs for the interactive assistance. It uses some rudimentary Natural Language Processing features to recognize human conversation. Angular, Bootstrap and HTML5 form the frontend framework of the bot.

## JioMed+ requires :-
* ApiMedic engine
* Google Places API

Dependencies :-
* express.js
* fuse.js
* socket.io
* request-promises

## Build procedure :-
* `npm install`
* `node server/index.js` (sets up the server on port 3000)
* (Open another shell)
* `node docapp/server/index.js` (sets up additional server on 4000)