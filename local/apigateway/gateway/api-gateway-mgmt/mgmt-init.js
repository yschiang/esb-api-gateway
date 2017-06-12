/**
 * @file 
 * Initialize mgmt gateway variables with context 'mgmtMgr'
 * All the mgmt gateway should stick to use this context.
 */
var mgmtCtx = session.name('mgmtMgr') || session.createContext('mgmtMgr');
var serviceVars = require('service-metadata'),
    url = require('url'),
    util = require('util'),
    MgmtAudit = require('./mgmt-util.js').MgmtAudit
    ;

var systemIdent = serviceVars.getVar('var://service/system/ident');
var deviceName = systemIdent.substring(systemIdent.indexOf("<device-name>") + 13, systemIdent.indexOf("</device-name>"));

mgmtCtx.setVar('result', '');
mgmtCtx.setVar('error-status', '');
mgmtCtx.setVar('error-message', '');
mgmtCtx.setVar('error-code', '');
mgmtCtx.setVar('error-info', '');
mgmtCtx.setVar('aaa', '');
mgmtCtx.setVar('module', '');
mgmtCtx.setVar('schema', '');
mgmtCtx.setVar('verb', serviceVars.protocolMethod);
mgmtCtx.setVar('endpoint', serviceVars.URI);
mgmtCtx.setVar('clientIp', serviceVars.transactionClient);
mgmtCtx.setVar('clientCredential', '');
mgmtCtx.setVar('gtid', serviceVars.globalTransactionId);
mgmtCtx.setVar('systemId', deviceName);

var audit = new MgmtAudit(mgmtCtx);
audit.logStart();