/**
 * @file 
 * Populate JSON object in error rule.
 */
var serviceVars = require('service-metadata'),
    urlparts = require('url').parse(serviceVars.URLIn, true),
    APIError = require('local:///gateway/utils/errors').GWError,
    mgmtCtx = session.name('mgmtMgr') || session.createContext('mgmtMgr'),
    MgmtAudit = require('./mgmt-util.js').MgmtAudit;

let error = mgmtCtx.getVar('result') == 'error';
let apiError;

if (error) {
    let status = mgmtCtx.getVar('error-status');
    let message = mgmtCtx.getVar('error-message');
    let code = mgmtCtx.getVar('error-code');
    let info = mgmtCtx.getVar('error-info');

    apiError = new APIError(message, code, status, info);
} else {
    if (serviceVars.errorMessage.indexOf('[JSV') != -1) {
        // input schema validation error
        apiError = new APIError("Input data is not valid against JSON schema for the mgmt API.", 400, "Bad Request");
    } else if (serviceVars.errorCode == '0x0213000e' || serviceVars.errorCode == '0x0213000f') {
        // other data error
        apiError = new APIError("Input data is not a valid JSON document.", 400, "Bad Request");
    } else {
        // runtime unexpected error
        apiError = new APIError();
    }
}

var audit = new MgmtAudit(mgmtCtx);
audit.logError();

apiError.httpError(true);
session.output.write(apiError.errorObject());