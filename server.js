'use strict';
require('dotenv').config()
var dbg = require('debug')('server:app');
const timerPrint = (process.env.timer || false);
const filter = require('./lib/filter')
//const encoder = require('./lib/encoder')
/* express SDK and MW*/
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json({
  extended: true,
  limit: '1000Kb'
}));
app.use(bodyParser.urlencoded({
  extended: true,
  limit: '1000Kb'
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
const server = app.listen(port, function () {
  dbg('api listening at: ' + port)
});

app.get('/', function (req, res, next) {
  res.status(200).send('nothing here');
});

app.post('/messages/:id', function (req, res, next) {
  if (timerPrint) {
    console.log('----------------------------------------------------------------------------------------------------------------')
    console.log(`*** ${new Date()}`);
  }
  let {
    id
  } = req.params
  let slaveArray = req.body

  dbg(`*** content-type: ${req.headers["content-type"]}`);
  let filteredArray = filter.filterValues(slaveArray);
  let payload = JSON.stringify(filteredArray);

  var message = new Message(payload);
  dbg(message)
  if (timerPrint)
    console.time('*** sending message took');
  client.sendEvent(message, function (err) {
    if (err) {
      console.error(chalk.red('*** Could not send: ' + err.toString()));
      res.status(500).send(err.toString());
    } else {
      if (timerPrint) {
        console.log('----------------------------------------------------------------------------------------------------------------')
        console.timeEnd('*** sending message took')
      }
      res.status(200).send('POST message: ' + id);
    }
  });
});