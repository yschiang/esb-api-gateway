/**
 * @file 
 * Mgmt API done.
 * 
 * Do audit log for the activity.
 */
var mgmtCtx = session.name('mgmtMgr');
var MgmtAudit = require('./mgmt-util.js').MgmtAudit
    ;

var audit = new MgmtAudit(mgmtCtx);
audit.logDone();