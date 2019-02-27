'use strict';

const avro = require('avsc'),
    streams = require('memory-streams');
const type = avro.parse(__dirname + '/schema.avsc')
function buildSchema() {
    /*
    var fieldArray = [];

    for (var i = 0; i < sensorArray.length; i++) {
        fieldArray[i] = {
            'name': sensorArray[i].name,
            'type': sensorArray[i].type
        }
    }

    var type = avro.parse({
        name: 'telemetry',
        type: 'record',
        fields: fieldArray
    });

    return type;
    */
}
var buildAvro = function (callback) {

    var avroEncoder = new avro.streams.BlockEncoder(type, {
        codec: 'deflate'
    }); // Choose 'deflate' or it will default to 'null'
    var writer = new streams.WritableStream();
    avroEncoder.pipe(writer);

    // Generate the faux json
    var power = 20 + (Math.random() * 5); // range: [20, 25]
    var json = {
        power: power
    };


    // Write the json
    if (type.isValid(json)) {
        avroEncoder.write(json);
    }
    // Call end to tell avro we are done writing and to trigger the end event.
    avroEncoder.end();

    // end event was triggered, get the avro data from the piped stream and send to IoT Hub.
    avroEncoder.on('end', function () {
        console.log(writer.toBuffer())
        return callback(writer.toBuffer());
    })
}


module.exports.buildSchema = buildSchema;
module.exports.buildAvro = buildAvro;