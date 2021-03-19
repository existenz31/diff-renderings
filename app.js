"use strict"
var axios = require('axios');
const fs = require('fs');
const fsExtra = require('fs-extra')
require('dotenv').config()

const PROJECT_NAME = process.env.PROJECT_NAME;
const ENV_NAME_FROM = process.env.ENV_NAME_FROM;
const TEAM_NAME_FROM = process.env.TEAM_NAME_FROM;
const ENV_NAME_TO = process.env.ENV_NAME_TO;
const TEAM_NAME_TO = process.env.TEAM_NAME_TO;
const PROJECT_ID = process.env.PROJECT_ID;
const LOGIN_EMAIL = process.env.LOGIN_EMAIL;
const LOGIN_PASSWORD = process.env.LOGIN_PASSWORD;
const TOKEN = process.env.TOKEN;

/* Empty the output directory */
fsExtra.emptyDirSync('output');

var loginFunction = null;
/* Use a Token configuration */
if (TOKEN) {
  loginFunction = new Promise((resolve, reject) => {
    resolve(TOKEN);
  });
}
else {
  /* Generate the Token using USERNAME / PASSWORD mechanism */
  var loginConfig = {
    method: 'post',
    url: 'https://api.forestadmin.com/api/sessions',
    headers: { 
      'Accept': 'application/json', 
      'Content-Type': 'application/json'
    },
    data : JSON.stringify({"email":`${LOGIN_EMAIL}`,"password":`${LOGIN_PASSWORD}`})
    
  };
  
  
  return loginFunction = axios(loginConfig)
  .then(function (loginResponse) {
    console.log(JSON.stringify(loginResponse.data));
    return loginResponse.data.token;
  })
}

loginFunction
.then(async (token) => {
  generateRenderingFiles(token, ENV_NAME_FROM, TEAM_NAME_FROM);
  generateRenderingFiles(token, ENV_NAME_TO, TEAM_NAME_TO);
})
.catch(function (error) {
  console.log(error);
});

function generateRenderingFiles(token, envName, teamName) {
  var configTo = {
    method: 'get',
    url: `https://api.forestadmin.com/api/renderings/${PROJECT_NAME}/${envName}/${teamName}`,
    headers: { 
      'Content-Type': 'application/json', 
      'Authorization': `Bearer ${token}`, 
      'Forest-Project-Id': `${PROJECT_ID}`
    }
  };  
  return axios(configTo)
  .then(function (response) {
    console.log(JSON.stringify(response.data));
    const json = JSON.stringify(response.data, null, 2)
    console.log(json);
    fs.writeFile(`output/${PROJECT_NAME}_${envName}_${teamName}.json`, json, function (err) {
      if (err) return console.log(err);
      console.log('Json > in file');
    });  
    // Make the ids Generic for simpler Diff
    var reponseGenericIds = JSON.parse(JSON.stringify(response.data).replace(/"id":"[0-9a-zA-Z-]{36}"/g,'"id":"11111111-1111-1111-1111-111111111111"'));
    const jsonGenericIds = JSON.stringify(reponseGenericIds, null, 2);
    fs.writeFile(`output/${PROJECT_NAME}_${envName}_${teamName}_generic_ids.json`, jsonGenericIds, function (err) {
      if (err) return console.log(err);
    });  

    return response.data;
  })    
}
