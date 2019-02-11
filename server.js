/* express sdk and MW*/
const express = require('express');
var bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
/* azure sdk */
const iothub = require('azure-iothub');
const Gateway = require('azure-iot-multiplexing-gateway').Gateway;
const gateway = new Gateway();
var Message = require('azure-iot-common').Message;

var addDevicePromises = [];
const connectionString = require('./data/cs.json').cs;
const registry = iothub.Registry.fromConnectionString(connectionString);
var devices = [];
const chalk = require('chalk');

const port = 9999;


// Start server and listen on http://localhost:8081/
var server = app.listen(port, function () {
  console.log("app listening at http://%s:%s", server.address().address, server.address().port)
});

const main = () => {
  registry.list(function (err, devicesList) {
    if (err)
      return err;
    else {
      devicesList.forEach((device) => {
        devices.push(device.deviceId)
      });
      startgw();
    }
  });

}
const startgw = async function () {
  let name = 'startgw';
  var hubname = connectionString.substring(connectionString.indexOf("=") + 1, connectionString.indexOf(";"));

  console.time('Open tunnel took');
  try {
    await gateway.open(connectionString);
    console.timeEnd('Open tunnel took');
    console.log('----------------------------------------------------------------------------------------------------------------')

    console.log(chalk.green(`${devices.length} devices provisioned`))
    if (devices.length > 0) {
      devices.forEach((deviceId) => {
        addDevicePromises.push(gateway.addDevice(deviceId));
      });
      console.time('Add devices took');
      await Promise.all(addDevicePromises);
      console.timeEnd('Add devices took');
      console.log('----------------------------------------------------------------------------------------------------------------')

      console.log(chalk.green(`cloud gateway started towards ${hubname}`))
      console.log('----------------------------------------------------------------------------------------------------------------')
    }
  } catch (error) {
    console.log(`${name}: ${error}`);
  }
};

/*
const addDevice = async function (id) {
  let name = 'addDevice';
  try {
    addDevicePromises.push(gateway.addDevice(id));
    console.time('Add new device took');
    await Promise.all(addDevicePromises);
    console.timeEnd('Add new device took');
    console.log('----------------------------------------------------------------------------------------------------------------')
  } catch (error) {
    console.log(`${name}: ${error}`);
  }
};

const delDevice = async function (id) {
  console.time('Delete device took')
  let name = 'delDevice';
  try {
    let detached = gateway.removeDevice(id);
    let index = addDevicePromises.indexOf(detached);
    if (index > -1) {
      addDevicePromises.splice(index, 1);
    }
    await Promise.all(addDevicePromises);
    console.timeEnd('Delete device took');
    console.log('----------------------------------------------------------------------------------------------------------------')
  } catch (error) {
    console.log(`${name}: ${error}`);
  }
};
*/
const sender = async function (device, message) {
  console.time('Send message took');
  let name = 'sender';
  try {
    await gateway.sendMessage(device, message);
    console.log(chalk.green(`** message sent from ${device}`))
    console.log(chalk.green(`** timestamp: ${new Date()}`))

    console.timeEnd('Send message took');
    console.log('----------------------------------------------------------------------------------------------------------------')
  } catch (error) {
    console.log(chalk.red(`** ${name}: ${error}`));
  }
}

app.get('/', function (req, res, next) {
  res.status(200).send('nothing here');
});

app.post('/messages/:id', function (req, res, next) {
  console.log(chalk.green(`${new Date()}: message received`))

  let id = req.params.id;
  const index = devices.findIndex(deviceId => deviceId === id);
  if (index == -1)
    res.status(500).send(id + ' not provisioned');
  else {
      var message = new Message(JSON.stringify(req.body));
      sender(id, message)
      res.status(200).send('POST message: ' + req.params.id);
    } 
})

main();