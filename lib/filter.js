require('dotenv').config();
var dbg = require('debug')('filter:filterValues');
const flattener = require('./flattener')
const timerPrint = process.env.timer || false;
const devices = require('./device_metadata.json');
const gwType = process.env.driveType
dbg('drive type will come in param: ' + gwType)
var flat;
var bufferedValues = [];

const filterValues = (slaveArray) => {
    if (timerPrint) {
        console.log(
            '----------------------------------------------------------------------------------------------------------------'
        );
        console.time('*** filtering of message took');
    }

    for (let i = 0; i < slaveArray.length; i++) {
        let sid = slaveArray[i].slaveid;
        dbg('gateway: ' + slaveArray[i].gatewayid)
        dbg('slaveID: ' + sid)
        let typeIdx = slaveArray[i].datapoints.findIndex(p => p.param === parseInt(gwType))
        let driveType = slaveArray[i].datapoints[typeIdx].value;
        dbg('drive type: ' + driveType)
        let defaults = devices[driveType]
        let sidIndex = bufferedValues.findIndex(p => p.slaveid === sid);
        if (sidIndex == -1) {
            //dbg('new slaveID, buffer')
            flat = flattener.flattn(slaveArray[i])
            slaveArray[i].datapoints = flat
            bufferedValues.push(slaveArray[i])
            flat = defaults // clear object
        }
        else {
            // get a list of datapoinst already buffered
            let dps = bufferedValues[sidIndex].datapoints
            var keys = [];
                for(var k in dps) { 
                    keys.push(parseInt(k));
                }
            let plistLength = slaveArray[i].datapoints.length

            // check if any key in the current slaveid is buffered
            for (let j = 0; j < plistLength; j++) {
                let key = slaveArray[i].datapoints[j].param
                let stored = bufferedValues[sidIndex].datapoints[key]
                if(keys.includes(key)) { 
                    let pIndex = slaveArray[i].datapoints.findIndex(p => p.param === key)
                    let received = slaveArray[i].datapoints[pIndex].value
                    if ( received == stored ) { // if buffered && equal to buffered value, remove
                            slaveArray[i].datapoints.splice(pIndex,1);
                            plistLength--;
                            j--;
                        } else { // if value has changed, keep it
                            bufferedValues[sidIndex].datapoints[key] = received
                        }
                } else {
                    //dbg('new parameter in plist: ' + key + ' with value: ' + slaveArray[i].datapoints[j].value)
                    dps[key] = slaveArray[i].datapoints[j].value
                }
            }
            flat = flattener.flattn(slaveArray[i])
            slaveArray[i].datapoints = flat
            flat = defaults // clear object
        }
    }
    
    if (timerPrint) {
        console.timeEnd('*** filtering of message took');
    }
    return slaveArray;
}

module.exports.filterValues = filterValues;
