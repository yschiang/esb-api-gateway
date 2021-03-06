/**
 * @file 
 * Part of implementation for gateway state (REQ_SCHEMAVAL)
 * 
 * The schemaval consists of: a schema validation action + this file.
 *
 * Move to next state.
 */
var env = require('../settings').ENV,
    GatewayState = require('./apigw-util').GatewayState,
    GatewayConsole = require('./apigw-util').GatewayConsole;

const _console = new GatewayConsole(env['api.log.category']);
const _state = GatewayState.states.REQ_SCHEMAVAL;
var gwState = new GatewayState(_state, _console, 'apiSession', 'gatewayState');

/** on enter */
// gwState.onEnter();

/** on exit */
gwState.onExit(true);
