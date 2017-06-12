/**
 * @file 
 * Implementation for gateway state (reqout)
 * 
 * Log request output
 */
var env = require('../settings').ENV,
    serviceVars = require('service-metadata'),
    headers = require('header-metadata').current,
    GatewayState = require('./apigw-util').GatewayState,
    GatewayConsole = require('./apigw-util').GatewayConsole;

const _console = new GatewayConsole(env['api.log.category']);
const _state = GatewayState.states.REQ_OUT;
var gwState = new GatewayState(_state, _console, 'apimgr', 'gatewayState');
var _ctx = gwState.context();

/** on enter */
gwState.onEnter();

let analyticsCtx = session.createContext('request_out_analytics_full');
let analyticsData = {
    "state": "request_out",
    "tid": serviceVars.transactionId,
    "gtid": _ctx.getVar('gtid'),
    "datetime": new Date().toISOString(),
    "latency" : serviceVars.timeElapsed,

    "apiName" : _ctx.getVar('apiName'),
    "basePath": _ctx.getVar('basePath'),
    "resourceName": _ctx.getVar('resourceName'),
    "backend" : serviceVars.routingUrl,

    "message": {
        "headers": headers.get()
        //"size": 
        //"body":
    }
};

if (env['gateway.log.payload'] === true) {

    // log for analytics (to remote Splunk)
    gwState.notice(JSON.stringify(analyticsData), false);

    // log for full analytics
    new Promise(function(resolve, reject) {
        session.input.readAsBuffer(function (error, buffer) {
            
            if (error) {
                reject("Failed to read payload for analytics log.");
            } else {
                resolve(buffer);
            }
            return;
        });
    })
    .then(function(payloadBuffer) {
        analyticsData.message.body = payloadBuffer.toString();
        analyticsData.message.size = payloadBuffer.length;
        analyticsCtx.write(analyticsData);
        gwState.onExit(true);
    })
    .catch(function(errorMessage) {
        gwState.warn(errorMessage);
        gwState.onExit(true);
    });

} else {
    // log for analytics (to remote Splunk)
    gwState.notice(JSON.stringify(analyticsData), false);
    gwState.onExit(true);
}