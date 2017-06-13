
function Parameters () {
    this._this = require('local:///gateway/api-gateway/apigw-util.js').Parameters;
}

Parameters.prototype.get = function () {

    let usage = "get() | get('paramName')";

    if (arguments.length == 0) {  ///< get()

        return this._this.parameters;
    } else if (arguments.length == 1) { ///< get('paramName')

        let obj = this._this.parameters;
        let prop = arguments[0];
        return obj[prop];
    } else {

        throw new SyntaxError(usage);
    }

}

module.exports = new Parameters();