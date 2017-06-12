// @description Populate error object 
// @return Error object
function abort(message, code, status, info) {
    let apiError = require('local:///gateway/utils/errors').GWError;
    let c = code ? code : 202; // defaults to 202 Accepted when error
    let e = new apiError(message, c, status, info);
    let mgmtCtx = session.name('mgmtMgr') || session.createContext('mgmtMgr');
    e.setServiceErrorContext(mgmtCtx);
    session.reject(message);
    return e.errorObject();
}

var MgmtAudit = function() {

    let _STATES = [
        '_UNKNOWN',         //< 0
        'INIT',             //< 1
        'DONE',             //< 2
        'ERROR',            //< 3
        '_MAX',
    ];

    let _ENUM = {};
    for (let i=0; i<_STATES.length; i++) {
        _ENUM[_STATES[i]] = i;
    }

    /**
     * Usual ctor of GatewayState
     * 
     * @constructor
     *
     * @param {number} state
     *   DOM object for the table to be made draggable.
     * @param {GatewayConsole} gwConsole
     *   GatewayConsole instance for state console log.
     * @param {session.context | string} ctx
     *   Gateway session context instance or 'string' name of the context variable.
     * @param {string} stateVar
     *   Optional. Gateway context variable name where the context stores all the state information; by default 'gatewayState'
     */
    var MgmtAudit = function (ctx) {
        this._logConsole = console.options({'category': 'apigw-mgmt-audit'});
        
        this._formatLog = "(User=%1$s) from (source=%2$s) called (api=%3$s) on (system=%4$s). Result(status=%5$s)";

        this._username = ctx.getVar('clientCredential');
        this._clientIp = ctx.getVar('clientIp');
        this._result = ctx.getVar('result');
        this._api = ctx.getVar('verb') + ' ' + ctx.getVar('endpoint');
        this._system = ctx.getVar('systemId');
    };

    MgmtAudit.prototype.logStart = function () {
        //"(User=) from (source=127.0.0.1) calls (api=POST /apis/abc) on (system=dp1). Result(status=start)"
        this._logConsole.notice(this._formatLog,
            this._username, this._clientIp, this._api, this._system, 'start');
    }

    MgmtAudit.prototype.logDone = function () {
        //"(User=abc) from (source=127.0.0.1) called (api=POST /apis/abc) on (system=dp1). Result(status=completed)"
        this._logConsole.notice(this._formatLog,
            this._username, this._clientIp, this._api, this._system, 'completed');
    }

    MgmtAudit.prototype.logError = function () {
        //"(user=abc) from (source=127.0.0.1) called (api=POST /apis/abc) on (system=dp1). Result(status=failed)"
        this._logConsole.notice(this._formatLog,
            this._username, this._clientIp, this._api, this._system, 'failed');
    }

    return MgmtAudit;
}();

exports.MgmtAudit = MgmtAudit;
exports.abort = abort;