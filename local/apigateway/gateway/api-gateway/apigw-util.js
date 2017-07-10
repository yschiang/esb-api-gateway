/**
 * @file 
 * Utilities for gateway state
 * 
 * @version
 * 2017/03/27 Added param for suppressing prependState in gateway console log.
 * 2017/06/15 Added Session and InternalVars classes.
 */

let CTX_NAME = 'apiSession';

var GatewayConsole = function() {

    function GatewayConsole(category) {
        this._category = category || 'apigw';
        this._console = console.options({'category': this._category});
    }

    GatewayConsole.prototype.error = function(msg) {
        this._console.error(msg);
    }

    GatewayConsole.prototype.warn = function(msg) {
        this._console.warn(msg);
    }

    GatewayConsole.prototype.notice = function(msg) {
        this._console.notice(msg);
    }

    GatewayConsole.prototype.info = function(msg) {
        this._console.info(msg);
    }

    GatewayConsole.prototype.debug = function(msg) {
        this._console.debug(msg);
    }

    // alias to info
    GatewayConsole.prototype.log = function(msg) {
        this.info(msg);
    }

    // alias to debug
    GatewayConsole.prototype.trace = function(msg) {
        this.debug(msg);
    }

    return GatewayConsole;
}();

var GatewayState = function() {

    let _STATES = [
        '_UNKNOWN',         //< 0
        'INIT',             //< 1
        'REQ_IN',           //< 2
        'ACL',              //< ...
        'ROUTE',
        'APPAUTH',
        'REQ_SCHEMAVAL',
        'REQ_PROCESSOR',
        'REQ_OUT',
        'BACKEND',
        'RES_IN',
        'RES_SCHEMAVAL',
        'RES_PROCESSOR',
        'RES_OUT',
        'DONE',
        'ERROR',
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
    var GatewayState = function (state, gwConsole, ctx, stateVar) {

        let idx = state;
        if (!idx || !_STATES[idx]) {
            throw new Error ("Unknown gateway state: " + state);
        }

        this._stateVar = stateVar || 'gatewayState';
        this._state = idx; // integer
        this._console = gwConsole || new GatewayConsole();

        if (typeof ctx === "string") {
            this._ctx = session.name(ctx) || session.createContext(ctx);
        } else if (ctx) {
            this._ctx = ctx;
        } else {
            throw new Error("GatewayState constructor error: requires gateway context");
        }

        // on transition to Error state
        if (this._state === _STATES.indexOf('ERROR')) {
            let onErrorStateStr = this._ctx.getVar(this._stateVar);
            let onErrorStateIdx = _STATES.indexOf(onErrorStateStr);
            if (onErrorStateIdx == -1) {
                throw new Error ("Transiting to ERROR state with unknown from gateway state: " + onErrorStateStr);
            }
            this.onError(onErrorStateIdx);
        }

    };

    GatewayState.prototype.next = function() {
        if ((this._state+1) >= _STATES.length) {
            throw new Error ("Next state out of bound. (state=" + this._state + ")");
        }
        ++this._state;
        return _STATES[this._state];
    }

    GatewayState.prototype.error = function (msg, prependState) {
        this._console.error(
            (prependState === false) ? msg : (_STATES[this._state] + ' ' + msg) );
    }

    GatewayState.prototype.warn = function (msg, prependState) {
        this._console.warn(
            (prependState === false) ? msg : (_STATES[this._state] + ' ' + msg) );
    }

    GatewayState.prototype.log = function (msg, prependState) {
        this._console.info(
            (prependState === false) ? msg : (_STATES[this._state] + ' ' + msg) );
    }

    GatewayState.prototype.notice = function (msg, prependState) {
        this._console.notice(
            (prependState === false) ? msg : (_STATES[this._state] + ' ' + msg) );
    }

    GatewayState.prototype.info = function (msg, prependState) {
        this._console.info(
            (prependState === false) ? msg : (_STATES[this._state] + ' ' + msg) );
    }

    GatewayState.prototype.debug = function(msg, prependState) {
        this._console.debug(
            (prependState === false) ? msg : (_STATES[this._state] + ' ' + msg) );
    }

    GatewayState.prototype.onEnter = function() {
        this._ctx.setVar(this._stateVar, _STATES[this._state]);
        this.debug("enter");
    }

    GatewayState.prototype.onError = function(onErrorState) {
        this._onErrorState = onErrorState;// if error, where is the error being thrown
        this._ctx.setVar('onErrorState', _STATES[onErrorState]);
        this.error("error");
    }

    GatewayState.prototype.onExit = function(transit) {
        this.debug("exit");
        let nextState = this.next();
        if (transit) {
            this._ctx.setVar(this._stateVar, nextState);
        }
    }

    GatewayState.prototype.abort = function() {
        abort.call(this, arguments);
    }

    GatewayState.prototype.logAnalytics = function (data) {
        (new GatewayConsole('apigw-analytics')).notice(data);
    }

/*
    GatewayState.prototype.logAnalytics = function(endpoint, log, payloadBuffer, resolveCb) {

        let tid = this._ctx.getVar('session').gtid;

        let options = {
            target: endpoint, //'http://127.0.0.1:8020/_log/analytics/full',
            method: 'POST',
            headers: {
                'X-Global-Transaction-ID' : tid
            },
            contentType: 'application/json',
            timeout: 60
        };

        if (payloadBuffer) {
            options.data = payloadBuffer.toString();
        }
        
        let _this = this;
        require('urlopen').open(options, function(error, response) {
            if (error) {
                // continue even the analytics log isn't complete
                _this.warn("Unable to write analytics log message; transaction continued. (tid=" + tid + ")");
            } else {
                var statusCode = response.statusCode;
                response.disconnect();
                if (statusCode == 200) {
                    // log ok
                    _this.debug("Completed writing analytics log message to " + endpoint + ". (tid=" + tid + ")");
                } else {
                    // continue even the analytics log isn't complete
                    _this.warn("Unable to write analytics log message; transaction continued. (tid=" + tid + ")");
                }
            }
            resolveCb();
        });

    }
    */

    /**
     * Get current state string
     */
    GatewayState.prototype.current = function() {
        return _STATES[this._state];
    }

    GatewayState.prototype.onErrorState = function() {
        return this._onErrorState;
    }

    /**
     * Get the get context; by default 'apigw'
     */
    GatewayState.prototype.context = function() {
        return this._ctx;
    }

    GatewayState.states = _ENUM;

    return GatewayState;
}();


// @description Populate error object 
// @params _this should be a GatewayState instance
//         _arguments should be either an arrays of
//                    (Exception, code, status) or
//                    (message, code, status, info)
// @return Error object
function abort() {
    let _arguments;
    let gwCtx;
    let gwState;

    if (this instanceof GatewayState) {
        _arguments = arguments[0];
        gwState = this;
        gwCtx = gwState.context();
    } else {
        _arguments = arguments;
        gwCtx = session.name('apiSession');
    }

    let apiError = require('local:///gateway/utils/errors').GWError;
    let message;

    if (_arguments[0] instanceof Error) {

        // (Exception, code, status)
        message = _arguments[0].message;
        gwState.error('abort: ' + _arguments[0].stack);

    } else if (typeof _arguments[0] === "string") {

        // (message, code, status, info)
        message = _arguments[0].message;
    }

    let code = _arguments[1] ? _arguments[1] : 500;
    let status = _arguments[2];  //optional
    let info = _arguments[3];    //optional

    let e = new apiError(message, code, status, info);
    e.setServiceErrorContext(gwCtx);
    session.reject(message);

    return e.errorObject();
}

var UserDefinedModule = function() {

    var UserDefinedModule = {

        "load": function(basePath, moduleName) {
            let env = require('../settings').ENV;
            // definitionDir
            // 
            let usrDir = basePath;
            let commonDir = env['api.common.dir'];
            let mod;

            try {
                mod = require(usrDir + moduleName);
            } catch (e) {
                try {
                    mod = require(commonDir + moduleName);     
                } catch (e) {
                    throw e;
                }
            }

            return mod;
        }
    }

    return UserDefinedModule;
}();


var Session = function() {

    function Session() {

        this._ctx = session.name('apiSession');

        this._sessionVars = [
            "api",
            "error",
            "system",
            "request",
            "client",
            "message"
        ];

        for (let i=0; i<this._sessionVars.length; ++i) {
            Object.defineProperty(this, this._sessionVars[i], {
                get: function() {
                    return this._ctx.getVar(this._sessionVars[i]);
                },
                set: function(value) {
                    this._ctx.setVar(this._sessionVars[i], value);
                }
            });
        }

    }

    // static method
    Session.replaceParameters = function (input, params, urlencode) {
        let ret = input;
        for (let param in params) {
            // match $(request.parameters.[param])
            // urlencode to the backend url
            let toMatch = '$(request.parameters.' + param + ')';
            let splits = ret.split(toMatch);
            if (splits.length == 2) {
                let replacement = urlencode ? encodeURI(params[param]) : params[param];
                ret = splits[0] + replacement + splits[1];
            }
        }
        return ret;
    }


    return Session;
}();

var InternalVars = function() {

    function InternalVars() {
        this._ctx = session.name('apiSession');
        this._vars = this._ctx.getVar('_internal');
    }

    /**
     * setVar sets two storage:
     * - var://context/apiSession/_internal	: as a JSON object like { "definitionDir":"local:///apis/tests/", "definitionModule":"local:///apis/tests/api.js" }
     * - 
     */
    InternalVars.prototype.setVar = function(name, value) {

        if (!this._vars) {
            throw new Error("Gateway internal error: Internal vars uninitialized.");
        }
        this._ctx.setVar('_' + name, value);
        this._vars[name] = value;
        this._ctx.setVar('_internal', this._vars);
    }

    InternalVars.prototype.getVar = function(name) {
        if (!this._vars) {
            throw new Error("Gateway internal error: Internal vars uninitialized.");
        }

        return this._vars[name];
    }

    return InternalVars;
}();

exports.GatewayState = GatewayState;
exports.GatewayConsole = GatewayConsole;
exports.abort = abort;
exports.UserDefinedModule = UserDefinedModule;
exports.Session = Session;
exports.InternalVars = InternalVars;