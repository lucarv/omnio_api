'use strict';
require('dotenv').config()
const debug = require('debug')('omnio-iothub-client')
const timerPrint = (process.env.timer || false);
const filter = require('./lib/filter')
//const encoder = require('./lib/encoder')
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

// ----------------
// Start API server 
// ----------------
var server = app.listen(port, function () {
  console.log('api listening at: ' + port)
});

app.get('/', function (req, res, next) {
  res.status(200).send('nothing here');
});

app.post('/messages/:id', function (req, res, next) {
  if (!timerPrint) {
    console.log('----------------------------------------------------------------------------------------------------------------')
    console.log(`*** ${new Date()}`);
  }
  let {
    id
  } = req.params
  let slaveArray = req.body

  debug(`*** content-type: ${req.headers["content-type"]}`);
  if (!timerPrint)
    console.time('*** prepare message took')
  debug(slaveArray[0]);
  let buffered = filter.bufferValues(slaveArray);
  let filteredArray = filter.filterValues(slaveArray);
  let encodedArray = filter.encodePayload(filteredArray);
  let payload = JSON.stringify(encodedArray);
  if (!timerPrint)
    console.timeEnd('*** prepare message took');
  var message = new Message(payload);
  if (!timerPrint)
    console.time('*** sending message took');
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