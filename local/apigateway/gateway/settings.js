/**
 * @file 
 * 
 * Global system parameters for gateway processing.
 * A set of params (see _usrsParams) can be configured by user in local:///config/preferences.js
 */

var util = require('util'),
    _usrs = require('local:///config/preferences.js');

// User-configurable params with their default value
var _usrsParams = {
    'environment.id': '',
    'system.mgmt.port': 5551,
    'gateway.log.payload': false,
};

// Internal params used by gateway
var _sysParams = {
    'session.context.name': 'apiSession',

    'api.index': 'local:///apis/_apis.index.js', 
    'api.index.bak': 'local:///apis/_apis.index.js.bak',

    'api.dir': 'local:///apis/',
    'api.common.dir': 'local:///apis/_common/',

    'api.metadata': 'api.js',
    'api.defaults.type': '', // no default backend type
    'api.defaults.jsv': 'local:///apis/_common/json-schema.default.jsv',
    'api.default.xsd': 'store:///schemas/xml.xsd',
    'api.defaults.processor': 'local:///apis/_common/processor.default.js',

    'api.log.payload': false,
    'api.log.category': 'apigw',

    'config.clients.path': 'local:///config/sys-client-app.js',
    'config.orgs.path': 'local:///config/orgs.js',

    'app.clientid.header': 'X-APP-CLIENT-ID',

    'log.analytics.endpoint': 'http://127.0.0.1:8020/_log/analytics/full'
};


// prototype
var _process = {
    "ENV": {}
};

// populate each param into _process.ENV; overrides system default by user-defined
for (let param in _sysParams) {
    Object.defineProperty(_process.ENV, param, { get: function () { return _sysParams[param]; } });
}
for (let param in _usrsParams) {
    Object.defineProperty(_process.ENV, param, { get: function () { return !(require('util').isNullOrUndefined(_usrs[param]) || _usrs[param] === '') ? _usrs[param] : _usrsParams[param]; } });
}

exports.ENV = _process.ENV;