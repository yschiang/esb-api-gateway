/**
 * @file 
 * Implementation for gateway state (reqout)
 * 
 * Log request output
 */
var env = require('../settings').ENV,
    serviceVars = require('service-metadata'),
    headers = require('header-metadata').current,
    GatewyUtils = require('./apigw-util'),
    GatewayState = GatewyUtils.GatewayState,
    GatewayConsole = GatewyUtils.GatewayConsole,
    Session = GatewyUtils.Session,
    InternalVars = GatewyUtils.InternalVars;

const _console = new GatewayConsole(env['api.log.category']);
const _state = GatewayState.states.REQ_OUT;
var gwState = new GatewayState(_state, _console, 'apiSession', 'gatewayState');
var _ctx = gwState.context();
var sessionVars = new Session();
var internalVars = new InternalVars();


/** on enter */
gwState.onEnter();

let analyticsCtx = session.createContext('request_out_analytics_full');
let analyticsData = {
    "state": "request_out",
    "tid": serviceVars.transactionId,
    "gtid": sessionVars.system.gtid,
    "datetime": new Date().toISOString(),
    "latency" : serviceVars.timeElapsed,

    "api": {
        "name": sessionVars.api.name,
        "version": sessionVars.api.version,
        "root": sessionVars.api.root,
        "env": sessionVars.api.env,
        "operation": {
            "path": sessionVars.api.operation.path,
            "method": sessionVars.api.operation.method
        }
    },

    "client": {
        "system": sessionVars.client.system,
        "id": sessionVars.client.id
    },

    "message": {
        "url": serviceVars.routingUrl,
        "headers": headers.get(),
        "method": internalVars.getVar('backendMethod')
        //"size": "",
        //"body": ""
    }
};

if (env['gateway.log.payload'] === true) {

    // log for full analytics
    new Promise(function(resolve, reject) {
        session.input.readAsBuffer(function (error, buffer) {
            
            if (error) {
                reject("Failed to read payload for analytics log.");
            } else {

                // log for analytics (to remote Splunk)
                gwState.logAnalytics(JSON.stringify(analyticsData));

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
    gwState.logAnalytics(JSON.stringify(analyticsData));
    gwState.onExit(true);
}