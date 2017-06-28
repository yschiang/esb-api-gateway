/**
 * @file 
 * Implementation for gateway state (INIT)
 */
var env = require('../settings').ENV,
    serviceVars = require('service-metadata'),
    headerMetadata = require('header-metadata'),
    url = require('url'),

	GatewyUtils = require('./apigw-util'),
    GatewayState = GatewyUtils.GatewayState,
    GatewayConsole = GatewyUtils.GatewayConsole,
    InternalVars = GatewyUtils.InternalVars;


const _console = new GatewayConsole(env['api.log.category']);
const _state = GatewayState.states.INIT; // 'INIT'
var gwState = new GatewayState(_state, _console, 'apiSession', 'gatewayState');
var _ctx = gwState.context();
var internalVars = new InternalVars();


/** on enter */
gwState.onEnter();

/** on main */

// scan api index to match group
var apis = require(env['api.index']).apis;
var fullPath = url.parse(serviceVars.URLIn).pathname;	// "/fx/rates"
var basePath;

let sessionVars = {
    "gtid": serviceVars.globalTransactionId,
    "system": {
        "gtid": serviceVars.globalTransactionId,
    },

    "api": {
        "name": null,   // to be set on route
        "root": null,   // basepath; to be set inner this file
        "version": null,// to be set on route
        "endpointAddress": serviceVars.localServiceAddress,
        "path": null,   // to be set on route
        "requestPath": null,   // to be set on route
        "operation": serviceVars.protocolMethod.toLowerCase()
    },
    "client": {
        "organizationId": null, // to be set on authapp
        "clientId": null, // to be set inner this file,
        "clientIdNo": null,
        "ip": serviceVars.transactionClient,
        "xff": headerMetadata.original.get('X-Forwarded-For')? headerMetadata.original.get('X-Forwarded-For') : ""
    },
    "request": {
        "url": serviceVars.URLIn,
        "uri": serviceVars.URI,
        "verb": serviceVars.protocolMethod.toLowerCase(),
        "path": null, // to be set inner this file
        "headers": require('header-metadata').original.get(),
        "parameters": null,
        "body": null
    },
    "message": {
        "statusCode": null,
        "statusReason": null,
        "headers": null,
        "body": null
    },
    //"error": null
};

let vars = {
    //"session": sessionVars,
    "api": sessionVars.api,
    "system": sessionVars.system,
    "request": sessionVars.request,
    "client": sessionVars.client,
    "message": sessionVars.message,
    //"error": sessionVars.error
};

gwState.debug ("Looking up API indexing file.");
for (let api in apis) {

    gwState.debug ("Loading API [" + api + "]");

    // do the longest match for API
    // for example, /insurance and /insurance/v1 would result in /insurance/v1    
    if (serviceVars.URI.indexOf(api + '/') === 0) {

        gwState.log ("Matched API [" + api + "]");
        if (!basePath ||                        // not matched yet
            api.length > basePath.length) {     // matched a longer path, use this. 

            basePath = api;
        }
    }
}

if (basePath) {

    sessionVars.api.root = basePath;
    sessionVars.api.requestPath = fullPath.substring(basePath.length);	// "/rates" in URIin
    sessionVars.request.path = fullPath;

    let definitionDir = env['api.dir'] + basePath.substr(1).replace(/\//g, '.') + '/'; // /fx/v1 ==> local:///apis/fx.v1
    internalVars.setVar('definitionDir', definitionDir);
    internalVars.setVar('definitionModule', definitionDir + env['api.metadata']);

}

// get clientId from query param "client_id" or header "X-APP-CLIENT-ID"
let parsedURL = url.parse(serviceVars.URLIn, true);
let clientId = parsedURL.query.client_id;
if (!clientId) {
    clientId = headerMetadata.original.get(env['app.clientid.header']);
}
sessionVars.client.clientId = clientId ? clientId : "";
gwState.debug ("Extracted clientId: " + clientId);

for (let n in vars) {
    _ctx.setVar(n, vars[n]);
}

if (env['gateway.log.payload'] === true) {
    session.output.write('<txVars><log body="enabled" /></txVars>');
} else {
    session.output.write('<txVars></txVars>');
}

/** on exit */
gwState.onExit();