/**
 * @file 
 * Implementation for gateway state (authapp)
 * 
 * Use the mapping table defined in env['config.clients.path'] for authorization.
 * 
 * The current implementation are defined as following:
 * 
 * 
 * client:
 * 		- id
 * 		- systemSequenceNo (system#id)
 * system:
 * 		- id
 * 		- authorizedResources
 * 		- acl
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
var maps = require(env['config.clients.path']);	// local:///config/apps.js

var clientId = sessionVars.client.clientId;

// the APP ACL filters the actual client's IP, preceding the closest-client's ip
var clientIp = sessionVars.client.xff ? sessionVars.client.xff : sessionVars.client.ip;

var configFault = false; // the [config.clients.path].js is not valid, return 500 when this is true
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
	var app = maps.client[clientId];

	if (!app) {
		error = "Requested client is not an authorized application and rejected. (client_id='" + clientId + "')";
		break;
	}

	// fill in systemId
	var systemId =  app['$system'];
	clientVars.systemId = systemId;
	sessionVars.client = clientVars;
	gwState.debug("Identified client: (clientId='" + clientId + "')");


	// ref to system definitions
	var system = maps.system[systemId];
	if (!system) {
		error = "Requested client doesn't belong to an authorized system and rejected. (client_id='" + clientId + "')";
		break;
	}
	gwState.debug("Identified client system: (systemId='" + systemId + "')");

	// ACL check
	allowedIps = system['ip'];
	if (allowedIps) {

		if (!util.isArray(allowedIps)) {
			configFault = true;
			break;
		}

		function ipExactFilter(whiteIp, index, array) {
			return whiteIp === clientIp;
		}
		accessClientIp = allowedIps.some(ipExactFilter);
	} else {
		// by default allow all
		accessClientIp = true;
	}

	if (!accessClientIp) {
		error = "Application is ACL restricted. (source='" + clientIp + "')";
		break;
	}

	// Authorization
	allowedApis = system['authorized_resources'];
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
	gwState.error("System org-api configuration is invalid; please check the format with following information. (clientId=" + clientId +")");
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