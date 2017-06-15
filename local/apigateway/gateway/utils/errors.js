/**
 * @file 
 * filestore command utility with ROMA
 * 
 * Example error response:

HTTP/1.1 400 A Bad Request
{
    "error": {
        "code": 400,
        "status": "A Bad Request",
        "message": "invalid id .. blablabla"
    }
}

 * The API client should always expect an "error" property when something goes wrong so the logics
 * can rely on checking the body.error to determine whether it's an error response.

Sample codes:

let E = require('local:///gateway/utils/errors.js').GWError;
let e = new E("invalid id .. blablabla", 400, "A Bad Request");
e.httpError(true);
session.output.write(e.errorObject());

 */
let GWError = (function() {

    let serviceVars = require('service-metadata');
    let gatewayHeaders = require('header-metadata').response;

        function GWError(message, code, status, info) {

            // @param status optional. By default derived from code; pass the arg to override when appropriate.
            //constructor(message, code, status, info) {

            this._code = code;
            this._status = status;
            this._message = message;
            this._responseCodes = require("./response-codes.js");
            this._info = info; 
        };

        GWError.prototype.setMessage =function(s) {
            this._message = s;
        }

        GWError.prototype.setStatus =function(s) {
            this._status = s;
        }

        GWError.prototype.setCode = function (n) {
            this._code = n;
        }

        GWError.prototype.setInfo = function (o) {
            this._info = o;
        }

        GWError.prototype.defaults = function () {
            let defaults = {
                "code": 500,
                "status": "Error",
                "message": "gateway processing error"
            };
            return defaults;
        };

        GWError.prototype.setMgmtServiceErrorContext = function (ctx) {
            let e = this.errorObject().error;
            ctx.setVar('result', 'error');
            ctx.setVar('error-status', e.status);
            ctx.setVar('error-message', e.message);
            ctx.setVar('error-code', e.code);
            if (e.info) {
                ctx.setVar('error-info', e.info);
            }
            return true;
        };

        GWError.prototype.setServiceErrorContext = function (ctx) {

            let e = this.errorObject().error;
            let error = {
                'result': 'error',
                'status': e.status,
                'message': e.message,
                'code': e.code,
                'info': e.info ? e.info : ''
            };

            ctx.setVar('error', error);
            return true;
        };

        GWError.prototype.httpError = function (overrideHttpStatus) {

            let o = this.errorObject();
            let s = (o.error.code + ' ' + o.error.status);
            if (overrideHttpStatus) {
                // serviceVars.errorProtocolResponse = o.error.code.toString();
                // serviceVars.errorProtocolReasonPhrase = o.error.status;
                // gatewayHeaders.set('x-dp-response-code', s);
                gatewayHeaders.statusCode = s;
            }
            return s;
        }

        GWError.prototype.errorObject = function () {
            let status;
            let code;
            let message;

            // status
            if (this._status) {
                status = this._status;
            } else {
                if (this._code) {
                    status = this._responseCodes[this._code].status;
                }
                status = status ? status : this.defaults().status;
            }

            // code
            code = this._code ? this._code : this.defaults().code;

            // message
            message = this._message ? this._message : this.defaults().message;

            let out = {
                "error": {
                    "code": code,
                    "status": status,
                    "message": message
                }
            };

            // info
            if (this._info) {
                out.error.info = this._info;
            }

            return out;
        }
//    }

    return GWError;
}());

exports.GWError = GWError;