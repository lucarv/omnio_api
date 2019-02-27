const debug = require('debug')('filter ')

const params = [534, 538, 539, 540, 541, 600, 601, 602, 603, 604, 605, 624]
var bufferedParams = [];

// ----------------------------------------------
// Store last known values of optional parameters
// ----------------------------------------------
const bufferValues = (slaveArray) => {
    debug(`*** received ${slaveArray.length} new slave readings`)
    for (let i = 0; i < slaveArray.length; i++) {
        let sid = slaveArray[i].slaveId;
        // find if slave already buffered
        let sidIndex = bufferedParams.findIndex(p => p.slaveId === sid);
        if (sidIndex == -1) { // first appearance of this sid 
            // save last known value of relevant params
            let temp = {
                "slaveId": sid,
                "values": []
            }
            for (let j = 0; j < params.length; j++) {
                let paramIndex = slaveArray[i].datapoints.findIndex(p => p.param === params[j])
                if (paramIndex > -1) {
                    let received = slaveArray[i].datapoints[paramIndex]['value'];
                    temp.values.push({
                        "param": params[j],
                        "value": received,
                        "changed": true
                    })
                }
            }
            bufferedParams.push(temp)
        } else { // sid already known
            for (let j = 0; j < params.length; j++) {
                let paramIndex = slaveArray[i].datapoints.findIndex(p => p.param === params[j])
                if (paramIndex > -1) {
                    let stored = bufferedParams[sidIndex].values[j].value;
                    let received = slaveArray[i].datapoints[paramIndex]['value']
                    //debug(`stored: ${stored} - received: ${received}`)
                    if (stored !== received) {
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
        let bufferIndex = bufferedParams.findIndex(p => p.slaveId === sid)
        let bufferSid = bufferedParams[bufferIndex];
        for (let j = 0; j < params.length; j++) {
            let paramIndex = slaveArray[i].datapoints.findIndex(p => p.param === params[j])
            if (paramIndex > -1) {
                if (!bufferSid.values[j].changed) {
                    debug(bufferSid.values[j])
                    slaveArray[i].datapoints.splice(paramIndex, 1)
                }
            }
        }
    }
    return slaveArray;
};

// --------------------------------------------
// Remove parameter names and on-changed values
// --------------------------------------------

const encodePayload = (slaveArray) => {
    console.log(' **** start encoding: ')
    let encodedArray = [];
    for (var i = 0; i < slaveArray.length; i++) {
        let encodedDP = [];
        let pLength = slaveArray[i].datapoints.length;
        for (var k = 0; k < pLength; k++) {
            let key = slaveArray[i].datapoints[k].param
            let val = slaveArray[i].datapoints[k].value
            let j = {};
            j[key] = val
            encodedDP.push(j);
        }
        let slaveJ = {};
        slaveJ['slaveId'] = slaveArray[i].slaveId;
        slaveJ['timestamp'] = slaveArray[i].timestamp;
        slaveJ['datapoints'] = encodedDP;
        encodedArray.push(slaveJ)
    }
    return encodedArray;
};


module.exports.bufferValues = bufferValues;
module.exports.filterValues = filterValues;
module.exports.encodePayload = encodePayload;