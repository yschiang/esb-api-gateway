/**
 * @file 
 * Implementation for gateway state (reqin)
 * 
 * Log request input
 */
var env = require('../settings').ENV,
    serviceVars = require('service-metadata'),
    headers = require('header-metadata').original,
    GatewayState = require('./apigw-util').GatewayState,
    GatewayConsole = require('./apigw-util').GatewayConsole,
    gwUtil = require('local:///gateway/utils/gateway-util.js');

const _console = new GatewayConsole(env['api.log.category']);
const _state = GatewayState.states.REQ_IN;
var gwState = new GatewayState(_state, _console, 'apimgr', 'gatewayState');
var _ctx = gwState.context();

/** on enter */
gwState.onEnter();

let analyticsCtx = session.createContext('request_in_analytics_full');
let analyticsData = {
    "state": "request_in",
    "tid": serviceVars.transactionId,
    "gtid": _ctx.getVar('gtid'),

    "datetime": new Date().toISOString(),
    "latency" : serviceVars.timeElapsed,

    "method": _ctx.getVar('operation'),
    "uri": gwUtil.maskClientId(serviceVars.URI),
    "url": gwUtil.maskClientId(serviceVars.URLIn),
    "path": _ctx.getVar('path'),

    "localAddress" : serviceVars.localServiceAddress,
    "clientIp": _ctx.getVar('clientIp'),

    "message": {
        "headers": headers.get(),
        "size": serviceVars.mpgw.requestSize
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

