/**
 * @file 
 * Implementation for gateway state (reqin)
 * 
 * Log request input
 */
var env = require('../settings').ENV,
    serviceVars = require('service-metadata'),
    utils = require('local:///gateway/utils/gateway-util.js'),
	GatewyUtils = require('./apigw-util'),
    GatewayState = GatewyUtils.GatewayState,
    GatewayConsole = GatewyUtils.GatewayConsole,
    Session = GatewyUtils.Session;


const _console = new GatewayConsole(env['api.log.category']);
const _state = GatewayState.states.REQ_IN;
var gwState = new GatewayState(_state, _console, 'apiSession', 'gatewayState');
var _ctx = gwState.context();
var sessionVars = new Session();

/** on enter */
gwState.onEnter();

let analyticsCtx = session.createContext('request_in_analytics_full');
let analyticsData = {
    "state": "request_in",
    "tid": serviceVars.transactionId,
    "gtid": sessionVars.system.gtid,

    "datetime": new Date().toISOString(),
    "latency" : serviceVars.timeElapsed,

    "client": {
        "ip": sessionVars.client.ip,
        "xff": sessionVars.client.xff
    },

    "request": {
        "method": sessionVars.request.verb,
        "path": sessionVars.request.path,
        "endpoint" : sessionVars.request.endpointAddress,

        "uri": utils.maskClientId(sessionVars.request.uri),
        "url": utils.maskClientId(sessionVars.request.url)
    },
    "message": {
        "headers": sessionVars.request.headers,
        "size": serviceVars.mpgw.requestSize
    }
};

if (env['gateway.log.payload'] === true) {

    // log for analytics (to remote Splunk)
    gwState.logAnalytics(JSON.stringify(analyticsData));

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
        analyticsCtx.write(analyticsData);
        gwState.onExit(true);
    })
    .catch(function(errorMessage) {
        gwState.warn(errorMessage);
        gwState.onExit(true);
    });

} else {
    // log for analytics (to remote Splunk)
    gwState.logAnalytics(JSON.stringify(analyticsData));
    gwState.onExit(true);
}

