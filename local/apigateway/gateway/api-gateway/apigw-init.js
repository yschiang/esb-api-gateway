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
var tanentEnvId = env['environment.id'];

/** on enter */
gwState.onEnter();

/** on main */

// scan api index to match group
var apis = require(env['api.index']).apis;


// requested path
var reqFullPath = url.parse(serviceVars.URLIn).pathname; // /env/api/operation
// paths including env
let envBasePath = ''; // /env
let envFullPath = ''; // /env/api/operation
// paths excluding env
var basePath = '';   // "/api"
var fullPath = '';	// "/api/operation"
var operationPath = ''; // "/operation"


let sessionVars = {
    "gtid": serviceVars.globalTransactionId,
    "system": {
        "gtid": serviceVars.globalTransactionId,
        "envId": tanentEnvId
    },
    "api": {
        "name": null,   // to be set on route
        "root": null,   // basepath; to be set inner this file
        "env": null,    // to be set inner this file
        "version": null,// to be set on route
        "endpointAddress": serviceVars.localServiceAddress,
        //"path": null,   // to be set on route
        "operationMethod": null,
        "operationPath": null
    },
    "client": {
        "systemId": null, // to be set on authapp
        "clientId": null, // to be set inner this file,
        "ip": serviceVars.transactionClient,
        "xff": headerMetadata.original.get('X-Forwarded-For')? headerMetadata.original.get('X-Forwarded-For') : ""
    },
    "request": {
        "url": serviceVars.URLIn,
        "uri": serviceVars.URI,
        "verb": serviceVars.protocolMethod.toLowerCase(),
        "path": null, // /<env>/<root>/<operation>
        "envPath": null,    // /<env>
        "basePath": null, // /<root>
        "operationPath": null, // /<operation>
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
    "internal": {
        "definitionDir": null,
        "definitionModule": null
    }
    //"error": null
};

let vars = {
    //"session": sessionVars,
    "api": sessionVars.api,
    "system": sessionVars.system,
    "request": sessionVars.request,
    "client": sessionVars.client,
    "message": sessionVars.message,
    "_internal": sessionVars.internal
    //"error": sessionVars.error
};

gwState.debug ("Looking up API indexing file.");



// tanentEnvId is from 'environment.id' defined in preferences
// for example, environment.id as "sandbox" and matched api as "/test_api"
// then envPrefix will be "/sandbox"
// then envFullPath will be "/sandbox/test_api"

// Match env
if (serviceVars.URI.indexOf((tanentEnvId ? ('/' + tanentEnvId + '/') : '')) === 0) {
    // matched env path
    envBasePath = '/' + tanentEnvId;
    envFullPath = reqFullPath;
    sessionVars.request.envPath = envBasePath;

    for (let api in apis) {

        // do the longest match for API
        // for example, /insurance and /insurance/v1 would result in /insurance/v1 
        
        if (serviceVars.URI.indexOf(envBasePath + api + '/') === 0) {

            gwState.log ("Matched API: " + api);
            if (!basePath ||                        // not matched yet
                api.length > basePath.length) {     // matched a longer path, use this. 

                basePath = api;
                sessionVars.request.basePath = basePath;

                fullPath = reqFullPath.substring(envBasePath.length);
                operationPath = fullPath.substring(basePath.length);
            }
        }
    }

} else {
    // error
}


sessionVars.request.path = reqFullPath;
sessionVars.request.basePath = basePath;
sessionVars.request.operationPath = operationPath;

// fill in var paths
let definitionDir;

if (basePath) {
    sessionVars.api.env = tanentEnvId;
    sessionVars.api.root = basePath;

    definitionDir = env['api.dir'] + basePath.substr(1).replace(/\//g, '.') + '/'; // /fx/v1 ==> local:///apis/fx.v1    
}

// get clientId from query param "client_id" or header "X-APP-CLIENT-ID"
let parsedURL = url.parse(serviceVars.URLIn, true);
let clientId = parsedURL.query.client_id;
if (!clientId) {
    clientId = headerMetadata.original.get(env['app.clientid.header']);
}
sessionVars.client.clientId = clientId ? clientId : "";
gwState.debug ("Extracted clientId: " + clientId);

// initialize vars
for (let n in vars) {
    _ctx.setVar(n, vars[n]);
}

// initialize internal vars
var internalVars = new InternalVars();
if (definitionDir) {
    internalVars.setVar('definitionDir', definitionDir);
    internalVars.setVar('definitionModule', definitionDir + env['api.metadata']);
}

if (env['gateway.log.payload'] === true) {
    session.output.write('<txVars><log body="enabled" /></txVars>');
} else {
    session.output.write('<txVars></txVars>');
}

/** on exit */
gwState.onExit();