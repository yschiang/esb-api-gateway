/**
 * @file 
 * Implementation for gateway state (acl)
 *
 * IP-based ACL: The default rule is deny-none and allow-all.
 * Whitelist and blacklist defined by file local:///config/acl.js
 * The default rule is deny-none and allow-all if no black/white list is defined.
 * If any whitelist is defined then the incoming client must be in the whitelist to be permitted.
 * If any blacklist is defined then the incoming client must not be in the blacklist to be permitted.
 * The deny overrides the allow.
 */
var env = require('../settings').ENV,
	serviceVars = require('service-metadata'),
    headerMetadata = require('header-metadata'),
	netmask = require('local:///lib/netmask').Netmask,	
	GatewyUtils = require('./apigw-util'),
    GatewayState = GatewyUtils.GatewayState,
    GatewayConsole = GatewyUtils.GatewayConsole,
	Session = GatewyUtils.Session;

const _console = new GatewayConsole(env['api.log.category']);
const _state = GatewayState.states.ACL;
var gwState = new GatewayState(_state, _console, 'apiSession', 'gatewayState');
var _ctx = gwState.context();
var sessionVars = new Session();

/** on enter */
gwState.onEnter();


/** on main */
var rules = require('local:///config/acl.js').acl;

var whiteMask = rules.allowed;
var blackMask = rules.denied;

// use the immediate client - i.e., load balancer's ip addr for device ACL
var clientip = sessionVars.client.ip;

var denied = false; // default deny  none
var allowed = true;	// default allow all


// Black list
for (let i=0; i<rules.denied.length; i++) {
	let black = new netmask(rules.denied[i]);
	if (black.contains(clientip)) {
		denied = true;
		break;
	}
}

// White list
if (!denied) {
	if (rules.allowed) {
		allowed = false;
		for (let i = 0; i<rules.allowed.length; i++) {
			let white = new netmask(rules.allowed[i]);
			if (white.contains(clientip)) {
				allowed = true;
				break;
			}
		}
	}
}

if (denied || !allowed) {
	let errorMessage = "Access denied by ACL. (client='" + clientip + "')";
	gwState.abort(new Error(errorMessage), 401);
	return;
}

gwState.debug("Access permitted for client from " + clientip);

/** on exit */
gwState.onExit();
