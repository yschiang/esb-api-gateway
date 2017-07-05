/**
 * REST API base path: /mgmt/clients
 * 
 * Supported operations:
 * 
 * POST /mgmt/clients?mode=create
 * GET  /mgmt/clients
 * GET  /mgmt/clients/{client_id}
 * 
 * See main function for usage example.
 */
var serviceVars = require('service-metadata');
var urlparts = require('url').parse(serviceVars.URLIn, true);
var apiError = require('local:///gateway/utils/errors').GWError;
var utils = require('util');

let Clients = (function() {

    function Clients() {
        this._func = null;
        this._url = urlparts;
        this._allClients = null;
        this._allSystems = null;
    }

    Clients.prototype.init = function (cfg) {
        try {
            let allData = require(cfg);
            this._allSystems = allData.system;
            this._allClients = allData.client;

            if (!this._allSystems || !this._allClients) {
                throw "Unable to load system configs.";
            }
        } catch (e) {
            console.error ("Unable to load required data from " + clientsCfg);
            throw new Error("Unable to load system configs.");
        }
        return true;
    }

    // @description Populate error object 
    // @return Error object
    Clients.prototype.error = function (message, code, status) {
        let c = code ? code : 202; // defaults to 202 Accepted when error
        let e = new apiError(message, c, status);
        let mgmtCtx = session.name('mgmtMgr') || session.createContext('mgmtMgr');
        e.setMgmtServiceErrorContext(mgmtCtx);
        session.reject(message);
        return e.errorObject();
    }

    Clients.prototype.get = function () {
        console.error ("AAA " + this._url.pathname);
        if (this._url.pathname == "/mgmt/clients") {
            // get all
            session.output.write(this._allClients);
        } else if (/^\/mgmt\/clients\/[\w -_]+$/.test(this._url.pathname)) {
            // get one client
            
            let o = {};
            let clientid = this._url.pathname.substr("/mgmt/clients/".length);
            if (clientid) {
                o = this._allClients[clientid];
            }
            session.output.write(o ? o : {});
        } else if (this._url.pathname == "/mgmt/systems") {

            session.output.write(this._allSystems);
        } else if (/^\/mgmt\/systems\/[\w -_]+$/.test(this._url.pathname)) {

            let o = {};
            let systemName = this._url.pathname.substr("/mgmt/systems/".length);
            if (systemName) {
                let systemIds = Object.keys(this._allSystems);
                for (let i=0; i<systemIds.length; i++) {
                    let systemId = systemIds[i];
                    let systemObject = this._allSystems[systemId];
                    if (systemObject.name === systemName) {
                        o = systemObject;
                        o.id = systemId;
                    }
                }
            }
            session.output.write(o ? o : {});

        } else {
            let errorMessage = "Unsupported GET invokation for mgmt API endpoint [" + this._url.path + ']';
            this.error(errorMessage);
            return;
        }
    }

    Clients.prototype.post = function() {
        // generate "/mgmt/clients?mode=create"
        if (this._url.query && this._url.query.mode == "create") {
            try {
                this.create(function(output) {
                    session.output.write(output);
                });
            } catch (error) {
                let errorMessage = "Failed to generate new client_id";
                this.error(errorMessage);
                return;                
            }
        } else {
            let errorMessage = "Unsupported POST invokation for mgmt API endpoint [" + this._url.path + ']';
            this.error(errorMessage);
        }
    };

    Clients.prototype.execute = function() {
        if (this._func) {
            return this._func();
        } else {
            return null;
        }
    }
    // @description Match input endpoint to the defined endpoints/operations
    // @return true on routed; false on nothing matched 
    Clients.prototype.route = function() {
        var endpoints = {

            "/mgmt/clients": {
                "GET": this.get,
                "POST": this.post
            },
            "/mgmt/systems": {
                "GET": this.get
            }
        };

        let path = this._url.pathname;
        let verb = serviceVars.protocolMethod;
        for (let endpoint in endpoints) {
            if (path.indexOf(endpoint) == 0) {
                let ops = endpoints[endpoint];
                for (let op in ops) {
                    if (verb == op) {
                        this._func = ops[op];
                        return true;
                    }
                }
            }
        }
        return false;
    };

    // @description Generate client_id by rand UUID
    // @return n/a 
    Clients.prototype.create = function(callback) {
        let options = {
            "location": "local:///gateway/api-gateway-mgmt/clients/generate-uuid.xsl"
        };
        require('transform').xslt(options, function(error, nodelist, abortinfo) {
            if (error || abortinfo) {
                throw new Error("An error was returned when executing '" + options.location + "'");
            } else {               
                //write out the transformed result
                let output = {
                    "client_id": nodelist.item(0).textContent
                }
                callback(output);
            }
        });
    }

    return Clients;
}());


// main
var c = new Clients();
try {
    c.init("local:///config/sys-client-app.js");
    if (c.route()) {
        c.execute();
    } else {
        let errorMessage = "Unsupported invokation for mgmt API endpoint [" + serviceVars.protocolMethod + " " + urlparts.path + "]" ;
        throw new Error(errorMessage);
    }
} catch (e) {
    session.output.write(c.error(e.message));
}
