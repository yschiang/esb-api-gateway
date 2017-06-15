/**
 * @file 
 * Implementation for gateway state (RES_IN)
 * 
 * Log response output
 */
var env = require('../settings').ENV,
    serviceVars = require('service-metadata'),
    headers = require('header-metadata').current,
    GatewyUtils = require('./apigw-util'),
    GatewayState = GatewyUtils.GatewayState,
    GatewayConsole = GatewyUtils.GatewayConsole,
    Session = GatewyUtils.Session;


const _console = new GatewayConsole(env['api.log.category']);
const _state = GatewayState.states.RES_IN;
var gwState = new GatewayState(_state, _console, 'apiSession', 'gatewayState');
var _ctx = gwState.context();
var sessionVars = new Session();

// 2xx indicates success
if (headers.statusCode.toString()[0] != '2') {

    // special design per e.sun bank's backend logic which returns 500
    // with a JSON document describing status, message, and other info.
    session.reject("Backend failure");
    return;

} else {

    /** on enter */
    gwState.onEnter();

    let analyticsCtx = session.createContext('response_in_analytics_full');
    let analyticsData = {
        "state": "response_in",
        "tid": serviceVars.transactionId,
        "gtid": sessionVars.gtid,
        "datetime": new Date().toISOString(),
        "latency" : serviceVars.timeElapsed,

        "message": {
            "headers": headers.get(),
            "size": serviceVars.mpgw.responseSize
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
}





