'use strict';
require('dotenv').config()

/* express sdk and MW*/
const express = require('express');
var bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json({
  extended: true,
  limit: '256Kb'
}));
app.use(bodyParser.urlencoded({
  extended: true,
  limit: '250Kb'
}));
/* azure sdk */
var Protocol = require('azure-iot-device-mqtt').Mqtt;
var Client = require('azure-iot-device').Client;
var Message = require('azure-iot-device').Message;

//var addDevicePromises = [];
var connectionString = process.env.CS;
var client = Client.fromConnectionString(connectionString, Protocol);

//const registry = iothub.Registry.fromConnectionString(connectionString);
const chalk = require('chalk');
const port = 9999;


// Start server and listen on http://localhost:8081/
var server = app.listen(port, function () {
  console.log(chalk.green('api listening at http://%s:%s', server.address().address, server.address().port))
});

app.get('/', function (req, res, next) {
  res.status(200).send('nothing here');
});

app.post('/messages/:id', function (req, res, next) {
  console.log('----------------------------------------------------------------------------------------------------------------')
  console.log(`*** ${new Date()}`);
  let { id } = req.params
  console.log(`*** content-type: ${req.headers["content-type"]}`);

  let payload = JSON.stringify(req.body);
  console.log(`*** size of received payload: ${payload.length}`)
  var message = new Message(payload);

  console.time(chalk.yellow('*** sending message took'))
  client.sendEvent(message, function (err) {
    if (err) {
      console.error(chalk.red('*** Could not send: ' + err.toString()));
      res.status(500).send(err.toString());
    } else {
      console.timeEnd(chalk.yellow('*** sending message took'))
      console.log('----------------------------------------------------------------------------------------------------------------')

      res.status(200).send('POST message: ' + id);
    }
  });

});