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
    gwUtil = require('local:///gateway/utils/gateway-util.js'),
    GatewyUtils = require('./apigw-util'),
    UserDefinedModule = GatewyUtils.UserDefinedModule,
    GatewayState = GatewyUtils.GatewayState,
    GatewayConsole = GatewyUtils.GatewayConsole,
    Session = GatewyUtils.Session,
    InternalVars = GatewyUtils.InternalVars;

const _console = new GatewayConsole(env['api.log.category']);
const _state = GatewayState.states.ERROR;
var gwState = new GatewayState(_state, _console, 'apiSession', 'gatewayState');
var _ctx = gwState.context();
var sessionVars = new Session();
var internalVars = new InternalVars();

const OUTPUT_TYPE = {
    'XML': 0,
    'JSON': 1
};

/** on enter */
gwState.onEnter();

let errorSet = sessionVars.error; // where the error is triggered by explicit gwState.abort()
let apiError;

if (errorSet) {
    let error = sessionVars.error;
    let status = error.status;
    let message = error.message;
    let code = error.code;
    let info = error.info;

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

// determine error ourput content-type
let outputType;
if (internalVars.getVar('producesType')) {
    // product error response based on user-set produces type
    outputType = gwUtil.isXML(internalVars.getVar('producesType')) ? OUTPUT_TYPE.XML : OUTPUT_TYPE.JSON;
} else {
    // otherwise based on request content-type
    outputType = gwUtil.isXML(hm.original.get('Content-Type')) ? OUTPUT_TYPE.XML : OUTPUT_TYPE.JSON;
}


// session error output
if (gwState.onErrorState() == GatewayState.states.BACKEND &&
    internalVars.getVar('backendErrorProcess')) {

    let handlerFn;
    let errorOutput;

    // allow user-custom backend error
    try {
        let handlerFn = UserDefinedModule.load(
                internalVars.getVar('definitionDir'), 
                internalVars.getVar('backendErrorProcessor'));

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
} else {
    let errorOutput = produceErrorOutput(apiError);  // string or json object to output as error response
    onExit(apiError, errorOutput);
}


// Util Functions definitions
function onExit(apiError, output) {
    setResponseContentType();
    apiError.httpError(true);
    logAnalytics();
    //console.error (JSON.stringify(output));
    session.output.write(output);

    gwState.onExit();
}

function produceErrorOutput(apiError) {

    let errorObject = apiError.errorObject();
    if (outputType == OUTPUT_TYPE.XML) {
        return (
            "<error>\n" + 
            "  <httpCode>" + errorObject.error.code + "</httpCode>\n" +
            "  <httpMessage>" + errorObject.error.status + "</httpMessage>\n" +
            "  <moreInformation>" + errorObject.error.message + "</moreInformation>\n" +
            "</error>");
    } else {
        return (
            {
                "httpCode": errorObject.error.code,
                "httpMessage": errorObject.error.status,
                "moreInformation": errorObject.error.message
            }
        );
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
function logAnalytics() {
        // log

    var analyticsData = {
        "state": "error",
        "tid": serviceVars.transactionId,
        "gtid": sessionVars.gtid,
        "datetime": new Date().toISOString(),
        "latency": serviceVars.timeElapsed,

        "api": {
            "name": sessionVars.api.name,
            "version": sessionVars.api.version,
            "root": sessionVars.api.root,
            "env": sessionVars.api.env,
            "operationPath": sessionVars.api.operationPath,
            "operationMethod": sessionVars.api.operationMethod
        },

        "client": {
            "ip": sessionVars.client.ip,
            "xff": sessionVars.client.xff,
            "systemId": sessionVars.client.systemId,
            "clientId": sessionVars.client.clientId
        },

        "message": {
            "headers": hm.current.get(),
            "status": hm.current.statusCode,
            "reason": hm.current.reasonPhrase,
            "size": serviceVars.mpgw.responseSize
        },
        "error": apiError.errorObject().error
    };
    gwState.notice(JSON.stringify(analyticsData), false);
}
