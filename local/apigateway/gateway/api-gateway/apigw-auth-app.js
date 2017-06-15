/**
 * @file 
 * Implementation for gateway state (authapp)
 * 
 * Map input "client_id" in to application.

Sample app

    "super-tester-1234567890": {
        "description": "tester with all permissions",
        "organization": "super-testers",
        "authorizedResources": {
            "/tests": "*",
        },
        "acl": [
            "0.0.0.0/0",
            "172.17.0.0/24"
        ]
    }

*/

var env = require('../settings').ENV,
	GatewyUtils = require('./apigw-util'),
    GatewayState = GatewyUtils.GatewayState,
    GatewayConsole = GatewyUtils.GatewayConsole,
	Session = GatewyUtils.Session,
	util = require('util'),
	netmask = require('local:///lib/netmask').Netmask;


const _console = new GatewayConsole(env['api.log.category']);
const _state = GatewayState.states.APPAUTH;
var gwState = new GatewayState(_state, _console, 'apiSession', 'gatewayState');
var _ctx = gwState.context();
var sessionVars = new Session();
var clientVars = sessionVars.client;

/** on enter */
gwState.onEnter();

// load apps.json where clientId represents an App
var apps = require(env['config.clients.path']);	// local:///config/apps.js

var clientId = sessionVars.client.appId;
var clientIp = sessionVars.client.ip;

var configFault = false; // the orgs-apis.js is not valid, return 500 when this is true
var error;
var decision = false;	// by default deny all

var inApi = sessionVars.api.root;
var inPath = sessionVars.api.path;
var inOperation = sessionVars.request.verb;

var accessApi = false;
var accessPath = false;
var accessOperation = false;
var accessClientIp = false;

var allowedApis;
var allowedPaths;
var allowedOperations;
var allowedIps;

do {
	var app = apps[clientId];
	if (!app) {
		error = "Requested client is not an authorized application and rejected. (client_id='" + clientId + "')";
		break;
	}

	clientVars.orgId = app.organizationId;
	sessionVars.client = clientVars;
	gwState.debug("Organization identified by client app. (client='" + clientId + "', orgnization='"+ clientVars.orgId + "')");


	// ACL check
	allowedIps = app['acl'];
	if (allowedIps) {

		if (!util.isArray(allowedIps)) {
			configFault = true;
			break;
		}

		for (let i = 0; i<allowedIps.length; i++) {
			let white = new netmask(allowedIps[i]);
			if (white.contains(clientIp)) {
				accessClientIp = true;
				break;
			}
		}
	} else {
		// by default allow all
		accessClientIp = true;
	}

	if (!accessClientIp) {
		error = "Application is ACL restricted. (source='" + clientIp + "')";
		break;
	}

	// Authorization
	allowedApis = app['authorizedResources'];
	if (!allowedApis) {
		error = "Application access to the API is not granted. (client_id='" + clientId + "')";
		break;
	}

	// expect allowedApis to be either "*" or an object containing allowed APIs
	// super org allowed for all
	if ("*" === allowedApis) {
		decision = true;
		break;
	}
	if (!util.isObject(allowedApis)) {
		configFault = true;
		break;
	}

	// traverse APIs
	let apiNames = Object.getOwnPropertyNames(allowedApis);
	for (let i = 0; i < apiNames.length; i++) {
		let api = apiNames[i];
		if (api === inApi) {
			accessApi = true;
			allowedPaths = allowedApis[api];
			break;
		}
	}

	if (!accessApi || !allowedPaths) {
		error = "Application access to the API is not granted. (api='" + inApi + "')";
		break;
	}

	// matched API, expect allowedPaths to be either "*" or an object containing allowed paths
	if ("*" === allowedPaths) {
		decision = true;
		break;
	}
	if (!util.isObject(allowedPaths)) {
		configFault = true;
		break;
	}
	let pathNames = Object.getOwnPropertyNames(allowedPaths);
	for (let i = 0; i < pathNames.length; i++) {
		let path = pathNames[i];
		// now traverse paths
		if (path === inPath) {
			accessPath = true;
			allowedOperations = allowedPaths[path];
			break;
		}
	}

	if (!accessPath || !allowedOperations) {
		error = "Application access to the API/path is not granted. (api='" + inApi + "', path='" + inPath + "')";
		break;
	}
	// matched path, expect allowedOperations to be either "*" or an array containing allowed operations
	if ("*" === allowedOperations) {
		decision = true;
		break;
	}
	if (!util.isArray(allowedOperations)) {
		configFault = true;
		break;
	}
	let operationNames = allowedOperations;
	for (let i = 0; i < operationNames.length; i++) {
		let operation = operationNames[i];
		if (operation.toLowerCase() === inOperation.toLowerCase()) {
			accessOperation = true;
			decision = true;
			break;
		}
	}

	if (!accessOperation) {
		error = "Application access to the API/path/operation is not granted. (api='" + inApi + "', path='" + inPath + "', operation='" + inOperation + "')";
		break;
	}

} while (false);

// the orgs-api def file is invalid.
if (configFault) {
	gwState.error("System org-api configuration is invalid; please check the format with following information. (client=" + clientId +")");
	gwState.abort(new Error("System internal error"), 500);
	return;
}

if (!decision) {
	// denied

	// do abort now
	gwState.abort(new Error(error), 401);

	// on exit; keep current error state
	gwState.onExit(false);
	return;
}


// granted, 

// logging for noticing the API access
gwState.info("Access granted. (api='" + inApi + "', path='" + inPath + "', operation='" + inOperation + "')");

/** on exit; move state */
gwState.onExit(true);