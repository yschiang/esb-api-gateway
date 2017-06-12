var serviceVars = require('service-metadata');
var hm = require('header-metadata');
var gwUtil = require('local:///gateway/utils/gateway-util.js');

var ctx = session.name('apimgr');

var direction = serviceVars.transactionRuleType;

var type;

if (direction == 'request') {
    type = ctx.getVar('backendType') ? ctx.getVar('backendType') : ctx.getVar('consumesType');
} else if (direction == 'response') {
    type = ctx.getVar('producesType');
}

if (gwUtil.isXML(type)) {
    hm.current.set('Content-Type', 'application/xml');
} else if (gwUtil.isJSON(type)) {
    hm.current.set('Content-Type', 'application/json');
}

