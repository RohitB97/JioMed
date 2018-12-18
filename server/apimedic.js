var request = require('request');
var fs = require('fs');
var Fuse = require('fuse.js');
var path = require('path');

var SERVER_ROOT = path.join(__dirname, "..");

var API_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6InZpZ25lc2htNjI1QGdtYWlsLmNvbSIsInJvbGUiOiJVc2VyIiwiaHR0cDovL3NjaGVtYXMueG1sc29hcC5vcmcvd3MvMjAwNS8wNS9pZGVudGl0eS9jbGFpbXMvc2lkIjoiMTY4NiIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvdmVyc2lvbiI6IjEwOCIsImh0dHA6Ly9leGFtcGxlLm9yZy9jbGFpbXMvbGltaXQiOiIxMDAiLCJodHRwOi8vZXhhbXBsZS5vcmcvY2xhaW1zL21lbWJlcnNoaXAiOiJCYXNpYyIsImh0dHA6Ly9leGFtcGxlLm9yZy9jbGFpbXMvbGFuZ3VhZ2UiOiJlbi1nYiIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvZXhwaXJhdGlvbiI6IjIwOTktMTItMzEiLCJodHRwOi8vZXhhbXBsZS5vcmcvY2xhaW1zL21lbWJlcnNoaXBzdGFydCI6IjIwMTgtMTItMTgiLCJpc3MiOiJodHRwczovL2F1dGhzZXJ2aWNlLnByaWFpZC5jaCIsImF1ZCI6Imh0dHBzOi8vaGVhbHRoc2VydmljZS5wcmlhaWQuY2giLCJleHAiOjE1NDUxNjkxNDMsIm5iZiI6MTU0NTE2MTk0M30.FlRLhB5DyJXdnyPdwxDmbzCpD1L_NTc5PJj2pZIlpTk'
// sandbox
var API_KEY_sand = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6InZpZ25lc2htNjI1QGdtYWlsLmNvbSIsInJvbGUiOiJVc2VyIiwiaHR0cDovL3NjaGVtYXMueG1sc29hcC5vcmcvd3MvMjAwNS8wNS9pZGVudGl0eS9jbGFpbXMvc2lkIjoiNDM4MiIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvdmVyc2lvbiI6IjIwMCIsImh0dHA6Ly9leGFtcGxlLm9yZy9jbGFpbXMvbGltaXQiOiI5OTk5OTk5OTkiLCJodHRwOi8vZXhhbXBsZS5vcmcvY2xhaW1zL21lbWJlcnNoaXAiOiJQcmVtaXVtIiwiaHR0cDovL2V4YW1wbGUub3JnL2NsYWltcy9sYW5ndWFnZSI6ImVuLWdiIiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9leHBpcmF0aW9uIjoiMjA5OS0xMi0zMSIsImh0dHA6Ly9leGFtcGxlLm9yZy9jbGFpbXMvbWVtYmVyc2hpcHN0YXJ0IjoiMjAxOC0xMi0xOCIsImlzcyI6Imh0dHBzOi8vc2FuZGJveC1hdXRoc2VydmljZS5wcmlhaWQuY2giLCJhdWQiOiJodHRwczovL2hlYWx0aHNlcnZpY2UucHJpYWlkLmNoIiwiZXhwIjoxNTQ1MTc0NTg3LCJuYmYiOjE1NDUxNjczODd9.nTZQMGA5bNL5m-7bvh1PR94MWJqS1c1M-mt-JENQdkw'

function get_symptom_list(){
    request.get({
        url: 'https://healthservice.priaid.ch/symptoms',
        qs: {
            token: API_KEY,
            format: 'json',
            language: 'en-gb'
        }
    }, function (error, response, body) {
        fs.writeFile(SERVER_ROOT+'/server/symptoms.json', body, function(err){
            if(err) console.log(err);
        })
    });
}

var symptoms = JSON.parse(fs.readFileSync(SERVER_ROOT+'/server/symptoms.json'));
var fuse_options = {
    shouldSort: true,
    includeScore: true,
    threshold: 0.3,
    keys: ['Name']
}
var fuse_options_weak = {
    shouldSort: true,
    includeScore: true,
    tokenize: true,
    keys: ['Name']
}
var fuse = new Fuse(symptoms, fuse_options);
var fuse_weak = new Fuse(symptoms, fuse_options_weak);

function get_symptom_id(symptom_name){
    var search_res = fuse.search(symptom_name);
    console.log(search_res)
    if(search_res.length > 0)
        return search_res[0].item.ID;
    else{
        weak_search = fuse_weak.search(symptom_name).slice(0,10);
        
        console.log(weak_search)
        if(weak_search.length > 0)
            return weak_search[0].item.ID;
        else
            return -1;
    } 
        
}

function get_diagnosis(symptom_names, cb){
    symptom_ids = symptom_names.map(get_symptom_id)
    request.get({
        url: 'https://sandbox-healthservice.priaid.ch/diagnosis',
        qs: {
            symptoms: JSON.stringify(symptom_ids),
            gender: 'male',
            year_of_birth: 1996,
            token: API_KEY_sand,
            format: 'json',
            language: 'en-gb'
        }
    }, function (error, response, body) {
        cb(JSON.parse(body));
    });
}

function get_suggestions(symptom_names, cb){
    symptom_ids = symptom_names.map(get_symptom_id)
    console.log(symptom_ids)
    request.get({
        url: 'https://sandbox-healthservice.priaid.ch/symptoms/proposed',
        qs: {
            symptoms: JSON.stringify(symptom_ids),
            gender: 'male',
            year_of_birth: 1996,
            token: API_KEY_sand,
            format: 'json',
            language: 'en-gb'
        }
    }, function (error, response, body) {
        cb(JSON.parse(body));
    });
}

function parse_symptoms(query){
    // split ',' 'and'
    return query.split(/,and|\sand|,/i)
}

// get_symptom_list();
// console.log(get_symptom_id('headache'))
// // console.log(get_diagnosis(['abdominal pain', 'vomiting'], data => {console.log(data);}))
// get_suggestions(['vomit', 'fever', 'cough', 'sore throat'], data => {console.log('suggestions: ', data);})
// get_diagnosis(['cough', 'fever', 'runny nose'], data => {console.log(data);})
// console.log(parse_symptoms('cough,hand ,and fever'))
// console.log(parse_symptoms('I have headache and fever').map(get_symptom_id))
// get_diagnosis(parse_symptoms('cough, headache and fever'), data => {console.log(data);})

module.exports = {
    get_diagnosis: get_diagnosis, 
    parse_symptoms: parse_symptoms,
    get_suggestions: get_suggestions
}
