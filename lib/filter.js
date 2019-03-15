require('dotenv').config();
var dbg = require('debug')('filter:filterValues');
const flattener = require('./flattener')
const timerPrint = process.env.timer || false;
const devices = require('./device_template.json');
const filters = require('./device_metadata.json');
const gwType = parseInt(process.env.driveType)
dbg('drive type will come in param: ' + gwType)
var flat;
var bufferedValues = [];
setInterval(function(){ bufferedValues = []; dbg('buffer emptied')}, 86400000); // reset buffer every day

const filterValues = (slaveArray) => {
    if (timerPrint) {
        dbg(
            '----------------------------------------------------------------------------------------------------------------'
        );
        console.time('*** filtering of message took');
    }

    for (let i = 0; i < slaveArray.length; i++) {
        let sid = slaveArray[i].slaveId;
        let driveType = null;
        dbg('gateway: ' + slaveArray[i].gatewayid)
        dbg('slaveId: ' + sid)
        for (let ix = 0; ix < slaveArray[i].datapoints.length; ix++) {
            if (slaveArray[i].datapoints[ix].param == gwType)
                driveType = slaveArray[i].datapoints[ix].value;
        }
        //let typeIdx = slaveArray[i].datapoints.findIndex(p => p.param === gwType)
        //driveType = slaveArray[i].datapoints[typeIdx].value;
        if (driveType.substring(0, 5) == "FCM 3")
            driveType = "FMC 3"
        else if (driveType.substring(0, 5) == "FCD 3")
            driveType = "FCD 3"

        dbg('drive type: ' + driveType)

        let defaults = devices[driveType]
        let filter = filters[driveType]
        let sidIndex = bufferedValues.findIndex(p => p.slaveId === sid);
        if (sidIndex == -1) {
            dbg('new slaveId, buffer')
            flat = flattener.flattn(slaveArray[i])
            slaveArray[i].datapoints = flat
            bufferedValues.push(slaveArray[i])
            flat = defaults // clear object
        } else {
            // get a list of datapoinst already buffered
            dbg('slaveId is Buffered: ' + sid)
            let dps = bufferedValues[sidIndex].datapoints

            var keys = [];
            for (var k in dps) {
                keys.push(parseInt(k));
            }
            let plistLength = slaveArray[i].datapoints.length

            // check if any key in the current slaveId is buffered
            for (let j = 0; j < plistLength; j++) {
                let key = slaveArray[i].datapoints[j].param
                if (filter[key] == "c") {
                    dbg('checking if a cos parameter has changed: ' + key)
                    let stored = bufferedValues[sidIndex].datapoints[key]
                    if (keys.includes(key)) {
                        let pIndex = slaveArray[i].datapoints.findIndex(p => p.param === key)
                        let received = slaveArray[i].datapoints[pIndex].value
                        if (received == stored) { // if buffered && equal to buffered value, remove
                            dbg(key + ' unchanged, removing')
                            slaveArray[i].datapoints.splice(pIndex, 1);
                            plistLength--;
                            j--;
                        } else { // if value has changed, keep it
                            dbg(key + ' has changed, send to cloud')
                            bufferedValues[sidIndex].datapoints[key] = received
                        }
                    } else {
                        dbg('new parameter in plist: ' + key + ' with value: ' + slaveArray[i].datapoints[j].value)
                        dps[key] = slaveArray[i].datapoints[j].value
                    }
                }
            }
            flat = flattener.flattn(slaveArray[i])
            slaveArray[i].datapoints = flat
            flat = defaults; // clear object
        }
    }

    if (timerPrint) {
        console.timeEnd('*** filtering of message took');
    }
    return slaveArray;
}

module.exports.filterValues = filterValues;