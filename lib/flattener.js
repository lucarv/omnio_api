var dbg = require('debug')('flattener:flattn');

const flattn = (sid) => {
  var flat = {}

  let dp = sid.datapoints
  for (let i = 0; i < dp.length; i++) {
    let key = dp[i].param
    flat[key] = dp[i].value
  }
  dbg('flattened array: ' + flat)
  return flat
}

module.exports.flattn = flattn;