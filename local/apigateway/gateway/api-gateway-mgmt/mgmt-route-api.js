/**
 * @file 
 * Main route to output the file names (mod, schema) for subsequent GatewayScript and Validate Actions to invoke.
 */
var serviceVars = require('service-metadata');
var urlparts = require('url').parse(serviceVars.URLIn, true);
var APIError = require('local:///gateway/utils/errors').GWError;
var mgmtCtx = session.name('mgmtMgr');

serviceVars.mpgw.skipBackside = true;
let apiError;

// AAA check result
let authorized = mgmtCtx.getVar('aaa') == 'approved';
if (!authorized) {
    let message = "User is not permitted to access the specified mgmt APIs";
    apiError = new APIError(message, 401);
    apiError.setMgmtServiceErrorContext(mgmtCtx);
    apiError.httpError(true);
    session.reject(message);
    return;
}

let mod = '';
let schema = '';
// Main router
if (urlparts.pathname.indexOf('/mgmt/clients') != -1 ||
    urlparts.pathname.indexOf('/mgmt/systems') != -1) {

    mod = 'local:///gateway/api-gateway-mgmt/clients/clients.js';

} else if (urlparts.pathname.indexOf('/mgmt/apis') != -1) {

    mod = 'local:///gateway/api-gateway-mgmt/apis/apis.js';

    // module API, not Docs
    if (urlparts.pathname.indexOf('/docs/') == -1) {
        // update or create API def
        if (mgmtCtx.getVar('verb') == 'POST' || mgmtCtx.getVar('verb') == 'PUT') {
            // schema validation required only when creating or updating API definition file. I.e.: /mgmt/apis/<api_name>/api.js 
            schema = 'local:///gateway/api-gateway-mgmt/apis/api.jsv';
        }
    }
}

if (!mod) {
    // not found
    let message = "API endpoint " + urlparts.path + " not found";
    apiError = new APIError(message, 404);
    apiError.setMgmtServiceErrorContext(mgmtCtx);
    apiError.httpError(true);
    session.reject(message);
    return;
}

mgmtCtx.setVar('module', mod);
mgmtCtx.setVar('schema', schema);

let route = 
    '<mgmt>' + 
    '  <module>' + mod + '</module>' +
    '  <validate>' + schema + '</validate>' +
    '</mgmt>';

session.output.write(route);