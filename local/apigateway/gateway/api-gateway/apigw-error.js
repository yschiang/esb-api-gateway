/**
 * @file 
 * Implementation for gateway state (error)
 * 
 * Log error and produce error response.
 * 
 * Error response generation is based on following rule:
 * - JSON response by default
 * - XML response when producesType defined by api.js or request Content-Type is xml. 
 */
var env = require('../settings').ENV,
    serviceVars = require('service-metadata'),
    hm = require('header-metadata'),
    urlparts = require('url').parse(serviceVars.URLIn, true),
    APIError = require('local:///gateway/utils/errors').GWError,
    GatewayState = require('./apigw-util').GatewayState,
    GatewayConsole = require('./apigw-util').GatewayConsole,
    UserDefinedModule = require('./apigw-util').UserDefinedModule,
    gwUtil = require('local:///gateway/utils/gateway-util.js');


const _console = new GatewayConsole(env['api.log.category']);
const _state = GatewayState.states.ERROR;
var gwState = new GatewayState(_state, _console, 'apimgr', 'gatewayState');
var _ctx = gwState.context();

const OUTPUT_TYPE = {
    'XML': 0,
    'JSON': 1
};

/** on enter */
gwState.onEnter();

let errorSet = _ctx.getVar('result') == 'error'; // where the error is triggered by explicit gwState.abort()
let apiError;

if (errorSet) {
    let status = _ctx.getVar('error-status');
    let message = _ctx.getVar('error-message');
    let code = _ctx.getVar('error-code');
    let info = _ctx.getVar('error-info');

    apiError = new APIError(message, code, status, info);
} else {

    // let's check from which gateway state is the error thrown
    // capture errors for some exact states we are calling multistep action not the gws action
    switch (gwState.onErrorState()) {
        case GatewayState.states.REQ_SCHEMAVAL: {
            let message = "Request schema validation failed.";
            apiError = new APIError(message, 400);
            break;
        }
        case GatewayState.states.RES_SCHEMAVAL: {
            let message = "Response schema validation failed.";
            apiError = new APIError(message, 500);
            break;
        }
        case GatewayState.states.REQ_PROCESSOR: {
            let message = "Request processor execution error.";
            apiError = new APIError(message, 500);
            break;
        }
        case GatewayState.states.RES_PROCESSOR: {
            let message = "Response processor execution error.";
            apiError = new APIError(message, 500);
            break;
        }
        case GatewayState.states.BACKEND: {
            let message = "Backend service failure.";
            apiError = new APIError(message, 503);
            break;
        }
        default:
            // runtime unexpected error
            apiError = new APIError();
    }
}

// log
var logMsg = {
    "state": "error",
    "globalTransactionId": serviceVars.globalTransactionId,
    "time": new Date().getTime(),
    "latency": serviceVars.timeElapsed,

    "clientIp" : _ctx.getVar('clientIp'),
    "clientId":  _ctx.getVar('clientId'),

    "headers":  hm.current.headers,
    "size": serviceVars.mpgw.responseSize ,
    "error": apiError.errorObject()
};
gwState.notice(JSON.stringify(logMsg), false);



// determine error ourput content-type
let outputType;
if (_ctx.getVar('producesType')) {
    // product error response based on user-set produces type
    outputType = gwUtil.isXML(_ctx.getVar('producesType')) ? OUTPUT_TYPE.XML : OUTPUT_TYPE.JSON;
} else {
    // otherwise based on request content-type
    outputType = gwUtil.isXML(hm.original.get('Content-Type')) ? OUTPUT_TYPE.XML : OUTPUT_TYPE.JSON;
}


// session error output
if (gwState.onErrorState() == GatewayState.states.BACKEND &&
    _ctx.getVar('backendErrorProcess')) {

    let handlerFn;
    let errorOutput;

    if (_ctx.getVar('backendErrorProcessor')) {
        // allow user-custom backend error
        try {
            let handlerFn = UserDefinedModule.load(_ctx.getVar('definitionDir'), _ctx.getVar('backendErrorProcessor'));
            if (typeof handlerFn == 'function') {
                handlerFn(session.input, apiError, function (error, output) {

                    if (error) {

                        // fall back to unknown error
                        apiError = new APIError();
                        errorOutput = produceErrorOutput(apiError);
                    } else {

                        // user-defined error function completes. output should already be generated within that routine
                        errorOutput = output;
                    }
                    onExit(apiError, errorOutput);
                });
            } else {
                errorOutput = produceErrorOutput(apiError);;
                onExit(apiError, errorOutput);
            }

        } catch (e) {
            gwState.error(e.stack);
            // fall back to default handler
            errorOutput = produceErrorOutput(apiError);
            onExit(apiError, errorOutput);
        }
    }

} else {
    let errorOutput = produceErrorOutput(apiError);  // string or json object to output as error response
    onExit(apiError, errorOutput);
}


// Util Functions definitions
function onExit(apiError, output) {
    setResponseContentType();
    apiError.httpError(true);
    console.error (JSON.stringify(output));
    session.output.write(output);

    gwState.onExit();
}

function produceErrorOutput(apiError) {

    let errorObject = apiError.errorObject();
    if (outputType == OUTPUT_TYPE.XML) {
        return (
        "<error>\n" + 
        "  <code>" + errorObject.error.code + "</code>\n" +
        "  <status>" + errorObject.error.status + "</status>\n" +
        "  <message>" + errorObject.error.message + "</message>\n" +
        "</error>");
    } else {
        return errorObject;
    }
}

function setResponseContentType() {
    let produceContentType = function () {
        return outputType == OUTPUT_TYPE.XML ? "application/xml" : "application/json"
    };
    let ct = produceContentType();
    gwState.debug('Set response Content-Type: ' + ct)
    hm.current.set('Content-Type', ct);
}