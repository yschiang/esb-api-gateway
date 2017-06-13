/**
 * @file 
 * Implementation for gateway state (INIT)
 */
var env = require('../settings').ENV,
    serviceVars = require('service-metadata'),
    headerMetadata = require('header-metadata'),
    url = require('url'),
    GatewayState = require('./apigw-util').GatewayState,
    GatewayConsole = require('./apigw-util').GatewayConsole;


const _console = new GatewayConsole(env['api.log.category']);
const _state = GatewayState.states.INIT; // 'INIT'
var gwState = new GatewayState(_state, _console, 'apimgr', 'gatewayState');
var _ctx = gwState.context();



/** on enter */
gwState.onEnter();

/** on main */

// scan api index to match group
var apis = require(env['api.index']).apis;
var fullPath = url.parse(serviceVars.URLIn).pathname;	// "/fx/rates"
var basePath;

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

let vars = {
    "basePath": "",
    "path": "",
    "operation": serviceVars.protocolMethod.toLowerCase(),
    "definitionDir": "",
    "definitionModule": "",
    "parameters": "",
    "clientIp": "",
    "clientId": "",
    "clientForwardedBy": "",
    "gtid": serviceVars.globalTransactionId
};


if (basePath) {
    vars.basePath = basePath;
    vars.path = fullPath.substring(basePath.length);	// "/rates" in URIin
    vars.definitionDir = env['api.dir'] + basePath.substr(1).replace(/\//g, '.') + '/'; // /fx/v1 ==> local:///apis/fx.v1
    vars.definitionModule = vars.definitionDir + env['api.metadata'];
}

// get originated clientIp
var xForwardedFor = headerMetadata.original.get('X-Forwarded-For');
vars.clientIp = xForwardedFor ? xForwardedFor : serviceVars.transactionClient;

// get the requested intermidiary node
vars.clientForwardedBy = serviceVars.transactionClient;

// get clientId from query param "client_id" or header "X-APP-CLIENT-ID"
var parsedURL = url.parse(serviceVars.URLIn, true);
var clientId = parsedURL.query.client_id;
if (!clientId) {
    clientId = headerMetadata.original.get(env['app.clientid.header']);
}
vars.clientId = clientId ? clientId : "";

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