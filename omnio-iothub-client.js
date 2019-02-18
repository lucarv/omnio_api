'use strict';
require('dotenv').config()
const debug = require('debug')('omnio-iothub-client')
const timerPrint = process.env.timer;

/* express SDK and MW*/
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json({
  extended: true,
  limit: '256Kb'
}));
app.use(bodyParser.urlencoded({
  extended: true,
  limit: '250Kb'
}));
/* azure SDK */
const Protocol = require('azure-iot-device-mqtt').Mqtt;
const Client = require('azure-iot-device').Client;
const Message = require('azure-iot-device').Message;
const connectionString = process.env.CS;
var client = Client.fromConnectionString(connectionString, Protocol);

/* Filter Constants */
const port = 9999;
const params = [ 534, 538, 539, 540, 541, 600, 601, 602, 603, 604, 605, 624 ]
var bufferedParams = [];

// ----------------
// Start API server 
// ----------------
var server = app.listen(port, function () {
  debug('api listening at: ' + port)
});

// ----------------------------------------------
// Store last known values of optional parameters
// ----------------------------------------------
const bufferValues = (slaveArray) => {
  debug(`*** received ${slaveArray.length} new slave readings`)
  for (let i = 0; i < slaveArray.length; i++) {
    let sid = slaveArray[i].slaveId;
    // find if slave already buffered
    let sidIndex = bufferedParams.findIndex( p => p.slaveId === sid);
    if (sidIndex == -1)  { // first appearance of this sid 
      // save last known value of relevant params
      let temp = {
        "slaveId": sid,
        "values": []
      }
      for (let j = 0; j < params.length; j++) {
        let paramIndex = slaveArray[i].datapoints.findIndex( p => p.param === params[j])
        if ( paramIndex > -1) {
          let received = slaveArray[i].datapoints[paramIndex]['value'];
          temp.values.push({ "param": params[j], "value": received, "changed": true })
        }
      }
      bufferedParams.push(temp)
    } else { // sid already known
      for (let j = 0; j < params.length; j++) {
        let paramIndex = slaveArray[i].datapoints.findIndex( p => p.param === params[j])
        if ( paramIndex > -1) {
          let stored = bufferedParams[sidIndex].values[j].value;
          let received = slaveArray[i].datapoints[paramIndex]['value']
          //debug(`stored: ${stored} - received: ${received}`)
          if ( stored !== received ) {
            bufferedParams[sidIndex].values[j].value = received;
            bufferedParams[sidIndex].values[j].changed = true;
          } else
            bufferedParams[sidIndex].values[j].changed = false;
        }
      }
    }
  }
};

// --------------------------------------------
// Remove parameter names and on-changed values
// --------------------------------------------
const filterValues = (slaveArray) => {
  for (let i = 0; i < slaveArray.length; i++) {
    let sid = slaveArray[i].slaveId;
    let temp = [];
    let dpTemp = slaveArray[i].datapoints;
    for (let j = 0; j < dpTemp.length; j++) {
      delete dpTemp[j]['name']  
      temp.push(dpTemp[j])
    }
    slaveArray[i].datapoints = temp
    let bufferIndex = bufferedParams.findIndex( p => p.slaveId === sid)
    let bufferSid = bufferedParams[bufferIndex];
    for (let j = 0; j < params.length; j++) {
      let paramIndex = slaveArray[i].datapoints.findIndex( p => p.param === params[j])
      if ( paramIndex > -1) {
        if (!bufferSid.values[j].changed) {
          debug(bufferSid.values[j])
          slaveArray[i].datapoints.splice(paramIndex, 1)
        } 
      }
    }
  }
  return slaveArray;
};

app.get('/', function (req, res, next) {
  res.status(200).send('nothing here');
});

app.post('/messages/:id', function (req, res, next) {
  if (!timerPrint) {
    console.log('----------------------------------------------------------------------------------------------------------------')
    console.log(`*** ${new Date()}`);
  }
  let { id } = req.params
  let slaveArray = req.body

  debug(`*** content-type: ${req.headers["content-type"]}`);
  if (!timerPrint) 
    console.time('*** prepare message took')
  bufferValues(slaveArray);
  let filteredArray = filterValues(slaveArray)
  let payload = JSON.stringify(filteredArray);
  if (!timerPrint) 
    console.timeEnd('*** prepare message took')
  var message = new Message(payload);
  if (!timerPrint) 
    console.time('*** sending message took')
  client.sendEvent(message, function (err) {
    if (err) {
      console.error(chalk.red('*** Could not send: ' + err.toString()));
      res.status(500).send(err.toString());
    } else {
      if (!timerPrint) {
        console.timeEnd('*** sending message took')
        console.log('----------------------------------------------------------------------------------------------------------------')
      }
      res.status(200).send('POST message: ' + id);
    }
  });
});
