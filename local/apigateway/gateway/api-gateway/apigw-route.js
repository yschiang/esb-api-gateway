/**
 * @file 
 * Implementation for gateway state (ROUTE)
 * 
 * Route incoming request by matching api.js definition 
 *     api-path-operation
 * 
 * Generate session output to contain an XML def
 * <APISetting>
 *     <RequestSchema>...</>
 *     <RequestProcessor>...</>
 *     <ResponseSchema>...</>
 *     <ResponseProcessor>...</>
 * </APISetting>
 * 
 * Each child element indicates the schema (.jsv/.xsd) or gatewayscript/stylesheet(.js/.xsl) to apply in
 * subsequent Validate and GatewayScript/Transform actions.
 */
var env = require('../settings').ENV,
	serviceVars = require('service-metadata'),
	headerMetadata = require('header-metadata'),
	url = require('url'),
	GatewyUtils = require('./apigw-util'),
    GatewayState = GatewyUtils.GatewayState,
    GatewayConsole = GatewyUtils.GatewayConsole,
	Session = GatewyUtils.Session,
	InternalVars = GatewyUtils.InternalVars;

const _console = new GatewayConsole(env['api.log.category']);
const _state = GatewayState.states.ROUTE;
var gwState = new GatewayState(_state, _console, 'apiSession', 'gatewayState');
var _ctx = gwState.context();

var internalVars = new InternalVars();
var sessionVars = new Session();
var apiVars = sessionVars.api;
var requestVars = sessionVars.request;

/** on enter */
gwState.onEnter();



// TODO : handle last char if '/'


// Helpers used by this GatewayScript

var definitionModule = internalVars.getVar('definitionModule');
var defaults = {
	"type": env["api.defaults.type"],	// "application/json"
	"jsv": env["api.defaults.jsv"],	// "local:///apis/_common/json-schema.default.jsv",
	"xsd": env["api.default.xsd"],	// "store:///schemas/xml.xsd",
	"processor": env["api.defaults.processor"] // "local:///apis/_common/processor.default.js"
};

function getPath(file) {
	return internalVars.getVar('definitionDir') + file;
}

function setVar(name, value) {
	internalVars.setVar(name, value);
}

function getProcessor(v) {
	if (v) {
		// use user-defined
		return getPath(v);
	} else {
		return defaults.processor;
	}
}


function getSchema(v, type) {
	if (v) {
		// use user-defined
		return getPath(v);
	} else {
		// otherwise use default schema
		if (type.indexOf("json") != -1) {
			return defaults.jsv;
		} else if (type.indexOf("xml") != -1) {
			// no default XSD.
			return '';
		}
	}
}

// INPUT
// URIin: "/fx/rates?client_id=123"
var inBasePath = sessionVars.api.root;					// "/fx"
var inPath = sessionVars.api.requestPath;				// "/rates/123" in URIin
var inVerb = sessionVars.request.verb;					// "post" lowercase

// MATCHED
var basePath = sessionVars.api.root;					// "/fx"
var oneApi;												// API definition json object
var oneResource;										// Resource definition json object
var resourceName;     									// "/rates" from Resource definition

if (!basePath) {
	gwState.abort(new Error("API not found for the requested URL"), 404);
	return;
}

try {
	oneApi = require(definitionModule).api;
	apiVars.name = oneApi.info.title;
	apiVars.version = oneApi.info.version;
} catch (e) {
	gwState.abort(new Error("Couldn't locate definition for API [" + basePath + "]"), 500);
	return;
}

// compile the regular expressions to be used for API.Path.Resource searching
var re_1 = /\{([\w.-]+)\}/g;

// start searching for API.Path.Resource definition
for (let path in oneApi.paths) {
	let matched;

	if (path == inPath) {
		matched = true;
	} else {
		// definition: /abc/def/{cust_id}/xyz/{phone-number}
		// matched: [ '{cust_id}', '{phone-number}' ]
		// not matched: null
		let match_1 = path.match(re_1); // ["{cust_id}","{phone-number}"]
		if (match_1) {

			// inPath : /abc/def/1234567_890-11/xyz/kkkkkkkkkk
			// matched: [ '/abc/def/1234567_890-11/xyz/kkkkkkkkkk', '1234567_890-11', 'kkkkkkkkkk' ]
			// not matched: null
			let pathRegexStr = '^' + path.replace(re_1, '([\\w.-]+)') + '$';
			let re_2 = new RegExp(pathRegexStr);
			matched = inPath.match(re_2); // ["/abc/def/1234567_890-11/xyz/kkkkkkkkkk","1234567_890-1","kkkkkkkkkk"]

			// save the params in URI into var://context/apiSession/_params
			if (matched) {
				let params = {};
				for (let i=1; i<matched.length; i++) {
					// match_1[i-1] : {cust_id}
					let paramName = match_1[i-1].substring(1, match_1[i-1].length - 1); // strip heading { and tailing }
					let paramValue = matched[i];
					params[paramName] = paramValue;
				}
				requestVars.parameters = params;
				apiVars.path = path;
			}
		}
    }

	

	if (matched) {
		let resource = oneApi.paths[path]; // the resource object
		resourceName = path;

		if (resource[inVerb]) {
			oneResource = resource[inVerb];
			break;
		}
	}
}

// update session variables
sessionVars.api = apiVars;
sessionVars.request = requestVars;

if (oneResource) {
	// resourceName
	gwState.info("API resource matched. (api='" + apiVars.root + "', resource='" + apiVars.operation.toUpperCase() + ' ' + apiVars.path + "')");

	// backend
	let backend = (oneResource.backend && oneResource.backend.url) ? oneResource.backend : oneApi.defaultBackend;
	let backendUrl = backend.url; // url is a required field for backend object
	let backendType = backend.type ? backend.type : defaults.type;
	// by default proxy the method in client to backend
	let backendMethod = (backend.method ? backend.method : inVerb).toUpperCase();

	let catchBackendError = false;
	let backendErrorProcessor = '';
	// { error: 
	//     override:
	//     processor: 
	// }
	// when, a resource's error declared, by default, it "overrides" with "default" processor
	// a user can set the custom processor in resource or in api
	if (oneResource.backend && oneResource.backend.error && oneResource.backend.error.override !== false) {
		catchBackendError = true;
		backendErrorProcessor = oneResource.backend.error.processor;
	}
	if (oneApi.defaultBackend && oneApi.defaultBackend.error && oneApi.defaultBackend.error.override !== false) {
		catchBackendError = true;
		// use resource's error processor first
		backendErrorProcessor = (!backendErrorProcessor) ? oneApi.defaultBackend.error.processor : '';
	}

	// set backend url and content-type once determined
	let replacementRe = /\$\(request\.parameters\.[a-zA-Z0-9-_]+\)/;
	if (replacementRe.test(backendUrl)) { /* the specified backend url contains replacement params */
		backendUrl = Session.replaceParameters(backendUrl, sessionVars.request.parameters, true /*do urlencode*/);
	}
	setVar('backendUrl', backendUrl);
	serviceVars.setVar('var://service/routing-url', backendUrl);

	setVar('backendMethod', backendMethod);
	serviceVars.protocolMethod = backendMethod;

	setVar('backendType', backendType);
	//if (backendMethod == 'post' || backendMethod == 'put') {
		headerMetadata.current.set('Content-Type', backendType);
	//}

	setVar('backendErrorProcess', catchBackendError); // true | false
	setVar('backendErrorProcessor', backendErrorProcessor ? backendErrorProcessor : '');

	gwState.info("Set backend. (URL='" + backendUrl + "', type='" + backendType + "', method='" + backendMethod +  "')");

	// apiType
	let consumesType = oneResource.request.type ? oneResource.request.type : defaults.type;
	let producesType = oneResource.response.type ? oneResource.response.type : defaults.type;;
	setVar('consumesType', consumesType);
	setVar('producesType', producesType);

	// create XML for conditional action
	let xmlstr = '<APISetting>';

	xmlstr += '<ProtocolMethod>' + inVerb + '</ProtocolMethod>';

	let p; // path
	let v; // value

	// default schema	

	// file: request schema (by default using request consumes type)
	if (inVerb == 'get' || inVerb == 'delete') {
		p = '';
		gwState.info("Request schema skipped for GET/DELETE verb.");
	} else {
		v = oneResource.request.schema;
		p = getSchema(v, consumesType);
		gwState.info("Set schema for request validation. (schema='" + p +"')");
	}
	xmlstr += '<RequestSchema>' + p + '</RequestSchema>';
	setVar('requestSchema', p);

	// file: response schema (by default using backend type)
	v = oneResource.response.schema;
	p = getSchema(v, backendType);
	gwState.info("Set schema for response validation. (schema='" + p + "')");
	xmlstr += '<ResponseSchema>' + p + '</ResponseSchema>';
	setVar('responseSchema', p);

	// file: request processor (by default using request consumes type)
	v = oneResource.request.processor;
	p = getProcessor(v);
	gwState.info("Set processor for request. (processor='" + p + "')");
	xmlstr += '<RequestProcessor>' + p + '</RequestProcessor>';
	setVar('requestProcessor', p);

	// file: response processor (by default using backend type)
	v = oneResource.response.processor;
	p = getProcessor(v);
	gwState.info("Set processor for response. (processor='" + p + "')");
	xmlstr += '<ResponseProcessor>' + p + '</ResponseProcessor>';
	setVar('responseProcessor', p);

	xmlstr += '</APISetting>';
	session.output.write(xmlstr);

} else {

	gwState.abort(new Error("Requested operation not found for API (api='" + basePath + "',  resource='" + inVerb.toUpperCase() + " " + inPath + "')"), 404);
	return;
}


/** on exit */
gwState.onExit();