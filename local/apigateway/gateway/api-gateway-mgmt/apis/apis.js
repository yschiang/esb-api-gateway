/**
 * Supported REST API endpoints:
 * 
 * /mgmt/apis/{apiname}
 *      POST   create API directory (local:///apis/apiname), update API index file to add an API entry, and upload API definition file (api.js)
 *      PUT    update API definition file (api.js)
 *      DELETE delete API directory and update API index file to remove the API entry
 * 
 * /mgmt/apis/{apiname}/docs/{docname}
 *      POST   create (or update if existed) specified doc
 *      PUT    same as POST
 *      DELETE delete specified doc
 */
var serviceVars = require('service-metadata'),
    url = require('url'),
    util = require('util'),
    urlopen = require('urlopen'),
    romaFS = require('local:///gateway/utils/roma-filestore'),
    fs = require('fs'),
    mgmtUtil = require('../mgmt-util.js')
    ;

var domain = serviceVars.getVar('var://service/domain-name');

function status(step, passed) {
    return step + ": " + (passed ? "passed" : "failed");
}

function fileExists(loc) {
    var promise = new Promise(function(resolve, reject) {
        try {
            fs.exists(loc, function(exists) {
                resolve(exists);
            });
        } catch (e) {
            reject(e);
        }
	});
	return promise;
}

let REST_ENUM = {
    UNKNOWN: 0,
    API: 1,
    DOC: 2
};

let verb = serviceVars.protocolMethod;
let syntax = "/mgmt/apis/{api_name}";
let inUrl = serviceVars.getVar('var://service/URL-in');
let parsedUrl = url.parse(inUrl, true);
let found;
let restType = REST_ENUM.UNKNOWN;
let apiRe = /\/mgmt\/apis\/(([.a-zA-Z0-9_-]+)(\/[.a-zA-Z0-9_-]+)*)/;
let docRe = /\/mgmt\/apis\/(([.a-zA-Z0-9_-]+)(\/[.a-zA-Z0-9_-]+)*)\/docs\/([.a-zA-Z0-9_-]+)/;

if (found = parsedUrl.pathname.match(docRe)) {

    // must go docs match first (narrower condition)
    restType = REST_ENUM.DOC;

} else if (found = parsedUrl.pathname.match(apiRe)) {

    // then go api match
    restType = REST_ENUM.API;
}

if (restType == REST_ENUM.UNKNOWN) {
    // no API found
    mgmtUtil.abort("Unsupported mgmt REST API: " + parsedUrl.pathname);
    return;
}

// APIs index (local:///apis/_apis.index.js)
var apiIndexFilename   = '_apis.index.js';
var apiIndexBackupName = '_apis.index.js.bak';
var apiIndexPath       = 'local:///apis/' + apiIndexFilename;
var apiIndexBackupPath = 'local:///apis/' + apiIndexBackupName;
var apiIndexRomaDir    = domain + '/local/apis';
var apiIndexes         = require(apiIndexPath).apis;

// API definition (local:///apis/{apiname}/api.js)
var apiName                = '/' + found[1];
var apiDirName             = found[1].replace(/\//g, '.');
var apiRomaDir             = domain + '/local/apis/' + apiDirName;
var apiDefinitionFilename  = 'api.js';
let apiLocalDir            = 'local:///apis/' + apiDirName;
var apiDefinitionLocalPath = apiLocalDir + '/' + apiDefinitionFilename;


// Pre-conditions
var indexed = !util.isNullOrUndefined(apiIndexes[apiName]);
var p1 = fileExists(apiLocalDir);
var p2 = fileExists(apiDefinitionLocalPath);


if (restType == REST_ENUM.API) {

    let response = {
        "result": "",                   // ok | error
        "status": "",                   // when result ok: updated | created | deleted; when error, the error descriptions
        "apiName": apiName,             // "/fx/v1"
        "details": {
            "package": {
                "name": apiDirName,  // "fx.v1"
                "localPath": apiLocalDir,
                "precondition": "",
                "status": ""            // existed | not existed
            },
            "definition": {
                "name": "api.js",
                "localPath": apiDefinitionLocalPath,
                "precondition": "",
                "status": ""            // existed | not existed
            },
            "index": {
                "precondition": "",
                "status": ""            // existed | not existed
            }
        }
    };

    try { // big try for REST_ENUM.API

        // POST   - create dir and api definition file
        // PUT    - update api definition file
        // DELETE - unlink all files and directory; error when not existed 

        response.status = [];

        if (verb == 'POST') {


            Promise.all([p1, p2])
            .then(function(values) {
                let dirExisted = values[0];
                let definitionExisted = values[1];

                response.details.package.status          = dirExisted ? "existed" : "not existed";
                response.details.package.precondition    = dirExisted ? "failed" : "passed";
                response.details.definition.status       = definitionExisted ? "existed" : "not existed";
                response.details.definition.precondition = definitionExisted ? "failed" : "passed";
                response.details.index.status            = indexed ? "existed" : "not existed";
                response.details.index.precondition      = indexed ? "failed" : "passed";

                // the precondition to create a new API is all artifacts are empty
                

                let step = "Check preconditions for API 'creation'";
                if (indexed || dirExisted || definitionExisted) {
                    // sync codes here; just return an onresolve
                    response.result = "error";
                    response.status.push(status(step, false));
                    return response; // failed; but don't reject, just return response and goto next then to create response
                }

                response.status.push(status(step, true));

                // update index file but keep a backup; so do copy to a backup and then upload new
                return new Promise(function(resolve, reject) {

                    let step = "Back up API index [" + apiIndexFilename + "] to [" + apiIndexBackupName + "]";
                    // copy from _apis.index.js to _apis.index.js.bak
                    romaFS.copy(apiIndexPath, apiIndexRomaDir, apiIndexBackupName, function(error, romaResponse) {

                        if (error || romaResponse.error) {
                            response.result = "error";
                            response.status.push(status(step, false));
                            resolve(response);
                            return;
                        }

                        response.status.push(status(step, true));
                        // copy to .bak success
                        // prepare the new contents and overwrite _apis.index.js  
                        if (romaResponse.result.indexOf('created') != -1 || romaResponse.result.indexOf('updated') != -1) { 

                            // push new entry to the API index
                            apiIndexes[apiName] = "";

                            // prepend "exports.apis =" to the stringified json
                            let jsonBuf = new Buffer(JSON.stringify(apiIndexes));
                            let prepend = new Buffer('//@updatetime ' + (new Date()).toISOString() + '\nexports.apis =\n');
                            let bufToWrite = Buffer.concat([prepend, jsonBuf]);

                            romaFS.upload(apiIndexRomaDir, apiIndexFilename, bufToWrite, function(error, romaResponse) {

                                let step = "Upload new API index [" + apiIndexFilename + "]";
                                if (error || romaResponse.error) {
                                    response.result = "error";
                                    response.status.push(status(step, false));
                                    resolve(response);
                                    return;
                                }

                                if (romaResponse.result.indexOf('created') != -1 || romaResponse.result.indexOf('updated') != -1) {
                                    // update _apis.index.js success
                                    response.status.push(status(step, true));
                                    response.details.index.status = "updated";
                                    resolve(response); // good; goto next then
                                    return;
                                }
                            });
                        } else {
                            reject("Don't know why. Just go");
                        }

                    });
                });
            })
            .then (function(response) {
                if (response.result == "error") {
                    return response; // just goto next then
                } else {
                    // procedures not complete yet; go on processing

                    // Create package directory
                    return new Promise(function(resolve, reject) {

                        let step =  "Create API directory [" + apiDirName + "]";

                        romaFS.mkdir(apiIndexRomaDir, apiDirName, function (error, romaResponse) {
                            if (error || romaResponse.error || romaResponse.result.indexOf ("created") == -1) {
                                response.result = "error";
                                response.status.push(status(step, false));
                                response.details.package.status = "failed";
                                resolve(response);
                                return;
                            }

                            // Created directory ok
                            response.details.package.status = "created";
                            response.status.push(status(step, true));

                            step =  "Create API definition [" + apiDefinitionFilename + "]: ";

                            // Upload definition file "api.js"
                            session.input.readAsBuffer(function(error, inputBuf) {
                                if (error) {
                                    response.result = "error";
                                    response.status.push(status(step, false));
                                    response.details.definition.status = "failed";
                                    resolve(response);
                                    return;
                                }
                                let prepend = new Buffer('//@updatetime ' + (new Date()).toISOString() + '\nexports.api =\n');
                                let bufToWrite = Buffer.concat([prepend, inputBuf]);
                                romaFS.upload(apiRomaDir, apiDefinitionFilename, bufToWrite, function(error, romaResponse) {
                                    if (error) {
                                        response.result = "error";
                                        response.status.push(status(step, false));
                                        response.details.definition.status = "failed";
                                        resolve(response);
                                        return;
                                    }
                                    if (romaResponse.result.indexOf('created') != -1) {
                                        // update _apis.index.js success
                                        response.status.push(status(step, true));
                                        response.details.definition.status = "created";
                                        resolve(response); // good; goto next then
                                        return;
                                    } else {
                                        response.result = "error";
                                        response.status.push(status(step, false));
                                        response.details.definition.status = "failed";
                                        resolve(response);
                                        return;   
                                    }
                                });
                            });
                        });
                    });

                }
            })
            .then (function (response) {
                if (response.result != "error") {
                    response.result = "ok";
                    response.status.push("Completed");
                }
                session.output.write(response);
            })
            .catch(function(e) {
                console.error(e.stack);
                mgmtUtil.abort(e, null, null, response)
                //throw e; // "Uh-oh!"
            });
            

            // endof POST

        } else if (verb == 'PUT') {
            Promise.all([p1, p2])
            .then(function(values) {
                let dirExisted = values[0];
                let definitionExisted = values[1];

                response.details.package.status          = dirExisted ? "existed" : "not existed";
                response.details.package.precondition    = dirExisted ? "passed" : "failed";
                response.details.definition.status       = definitionExisted ? "existed" : "not existed";
                response.details.definition.precondition = definitionExisted ? "passed" : "failed";
                response.details.index.status            = indexed ? "existed" : "not existed";
                response.details.index.precondition      = indexed ? "passed" : "failed";

                let step = "Check preconditions for API 'update'";

                if (!indexed || !dirExisted || !definitionExisted) {
                    // dir and definition should have exist
                    response.result = "error";
                    response.status.push(status(step, false));
                    return response; // failed; but don't reject, just return response and goto next then
                } 
                // API existed, let's update definition file
                // Upload definition file "api.js"
                response.status.push(status(step, true));
                return new Promise(function(resolve, reject) {

                    let step = "Update API definition [" + apiDefinitionFilename + "]";
                    session.input.readAsBuffer(function(error, inputBuf) {
                        if (error) {
                            response.result = "error";
                            response.status.push(status(step, false));
                            response.details.definition.status = "failed";
                            resolve(response);
                            return;
                        }
                        let prepend = new Buffer('//@updatetime ' + (new Date()).toISOString() + '\nexports.api =\n');
                        let bufToWrite = Buffer.concat([prepend, inputBuf]);
                        romaFS.upload(apiRomaDir, apiDefinitionFilename, bufToWrite, function(error, romaResponse) {
                            if (error || romaResponse.error || romaResponse.result.indexOf('updated') == -1) {
                                response.result = "error";
                                response.status.push(status(step, false));
                                response.details.definition.status = "failed";
                                resolve(response);
                                return;
                            }
                            // update _apis.index.js success
                            response.status.push(status(step, true));
                            response.details.definition.status = "updated";
                            resolve(response); // good; goto next then
                            return;
                        });
                    });
                });
            })
            .then(function(response) {
                if (response.result != "error") {
                    response.result = "ok";
                    response.status.push("Completed");
                }
                session.output.write(response);
            })
            .catch(function(e) {
                console.error(e.stack);
                mgmtUtil.abort(e, null, null, response);
                //throw e; // "Uh-oh!"
            });


            // endof PUT

        } else if (verb == 'DELETE') {

            // delete the entire package directory
            // and update the api index
            new Promise(function(resolve, reject) {
                let step = "Delete API directory [" + apiDirName + "] and documents";

                romaFS.delete(apiRomaDir, '', function(error, romaResponse) {
                    if (error || romaResponse.error || romaResponse.result.indexOf('deleted') == -1) {
                        response.result = "error";
                        response.details.package.status = "failed";
                        response.status.push(status(step, false));
                    } else {
                        // delete _apis.index.js success
                        response.details.package.status = "deleted";
                        response.status.push(status(step, true));
                    }
                    resolve(response);
                    return;
                });
            })
            .then(function(response) {

                if (response.result == "error") {
                    return response; // just goto next then
                } else {

                    // update index file but keep a backup; so do copy to a backup and then upload new
                    return new Promise(function(resolve, reject) {

                        let step = "Back up API index [" + apiIndexFilename + "] to [" + apiIndexBackupName + "]";
                        // copy from _apis.index.js to _apis.index.js.bak
                        romaFS.copy(apiIndexPath, apiIndexRomaDir, apiIndexBackupName, function(error, romaResponse) {

                            if (error || romaResponse.error) {
                                response.result = "error";
                                response.status.push(status(step, false));
                                resolve(response);
                                return;
                            }

                            response.status.push(status(step, true));
                            // copy to .bak success
                            // prepare the new contents and overwrite _apis.index.js  
                            if (romaResponse.result.indexOf('created') != -1 || romaResponse.result.indexOf('updated') != -1) { 

                                if (util.isNullOrUndefined(apiIndexes[apiName])) {
                                    // not existent in the index file
                                    let step = "Remove old entry from API index [" + apiIndexFilename + "]";
                                    response.status.push(status(step, false));
                                    response.details.index.status = "not existed";
                                    resolve(response); //  goto next then
                                    return;

                                } else {
                                    // remove new entry from the API index
                                    delete apiIndexes[apiName];

                                    // prepend "exports.apis =" to the stringified json
                                    let jsonBuf = new Buffer(JSON.stringify(apiIndexes));
                                    let prepend = new Buffer('//@updatetime ' + (new Date()).toISOString() + '\nexports.apis =\n');
                                    let bufToWrite = Buffer.concat([prepend, jsonBuf]);

                                    romaFS.upload(apiIndexRomaDir, apiIndexFilename, bufToWrite, function(error, romaResponse) {

                                        let step = "Upload new API index [" + apiIndexFilename + "]";
                                        if (error || romaResponse.error) {
                                            response.result = "error";
                                            response.status.push(status(step, false));
                                            resolve(response);
                                            return;
                                        }

                                        if (romaResponse.result.indexOf('created') != -1 || romaResponse.result.indexOf('updated') != -1) {
                                            // update _apis.index.js success
                                            response.status.push(status(step, true));
                                            response.details.index.status = "updated";
                                            resolve(response); // good; goto next then
                                            return;
                                        }
                                    });
                                }
                            }
                        });
                    });
                }

            })
            .then(function (response) {
                if (response.result != "error") {
                    response.result = "ok";
                    response.status.push("Deleted");
                }
                session.output.write(response);
            })
            .catch(function(e) {
                console.error(e.stack);
                mgmtUtil.abort(e, null, null, response);
            });

        } else {
            throw new Error ("Unsupported API mgmt verb: " + verb);
        }


    }  catch (e) { // big catch for API rest
        console.error(e.stack);
        mgmtUtil.abort(e.message, null, null, response);
    } finally {
        return;
    }
} else if (restType === REST_ENUM.DOC) {

    // POST   - create dir and api definition file
    // PUT    - update api definition file
    // DELETE - unlink all files and directory; error when not existed 

    var docName = found[4];             // target file to update
    var docLocalPath = apiLocalDir + '/' + docName;

    let response = {
        "result": "",                   // ok | error
        "status": "",                   // when result ok: File updated | created | deleted; when error, the error descriptions
        "apiName": apiName,             // "/fx/v1"
        "details": {
            "package": {
                "name": apiDirName,     // "fx.v1"
                "localPath": apiLocalDir,
                "status": ""            // existed | not existed
            },
            "definition": {
                "name": "api.js",
                "localPath": apiDefinitionLocalPath,
                "status": ""            // existed | not existed
            },
            "index": {
                "status": ""            // existed | not existed
            },
            "document": {
                "name": docName,
                "localPath": docLocalPath,
                "status": ""            // created | updated | deleted
            }
        }
    };

    try { //big try
        // precondition check
        Promise.all([p1, p2])
        .then(function(values) {
            let dirExisted = values[0];
            let definitionExisted = values[1];

            if (!indexed || !dirExisted || !definitionExisted) {
                // dir and definition should have existed
                response.result = "error";
                response.status = "Incomplete API in system and pre-condition for updating document was not met; check details.";
                response.details.package.status = dirExisted ? "existed" : "not existed";
                response.details.definition.status = definitionExisted ? "existed" : "not existed";
                response.details.index.status = indexed ? "existed" : "not existed";

                return response; // failed; but don't reject, just return response and goto next then
            } else {
                response.details.package.status = "existed";
                response.details.definition.status = "existed";
                response.details.index.status = "existed";

                return response;
            }
        }).then(function(response) {

            if (response.result === "error") {
                return response;
            }
            
            if (verb == 'PUT' || verb == 'POST') {
                // API existed, let's create or update current file
                return new Promise(function(resolve, reject) {
                    session.input.readAsBuffer(function(error, inputBuf) {
                        if (error) {
                            response.result = "error";
                            response.details.document.status = "failed";
                            resolve(response);
                            return;
                        }
                        romaFS.upload(apiRomaDir, docName, inputBuf, function(error, romaResponse) {
                            if (error) {
                                response.result = "error";
                                response.details.document.status = "failed";
                                resolve(response);
                                return;
                            }
                            console.error (JSON.stringify(romaResponse));
                            if (romaResponse.result.indexOf('updated') != -1 || romaResponse.result.indexOf('created') != -1) {
                                // update _apis.index.js success
                                response.details.document.status = romaResponse.result.indexOf('updated') != -1 ? "updated" : "created";
                                resolve(response); // good; goto next then
                                return;
                            } else {
                                response.result = "error";
                                response.details.document.status = "failed";
                                resolve(response);
                                return;   
                            }
                        });
                    });
                });
            } else if (verb == "DELETE") {
                // DELETE https://dphost.com:5554/mgmt/filestore/default/local/test_dir/test_file.txt
                return new Promise(function(resolve, reject) {
                    romaFS.delete(apiRomaDir, docName, function(error, romaResponse) {
                        if (error) {
                            response.result = "error";
                            response.details.document.status = "failed";
                            resolve(response);
                            return;
                        }
                        if (romaResponse.result.indexOf('deleted') != -1) {
                            // update _apis.index.js success
                            response.details.document.status = "deleted";
                            resolve(response); // good; goto next then
                            return;
                        } else {
                            response.result = "error";
                            response.details.document.status = "failed";
                            resolve(response);
                            return;   
                        }
                    });
                });
            } else {
                throw new Error ("Unsupported API mgmt verb: " + verb);
            }
        })
        .then(function(response) {
            if (response.result != "error") {
                response.result = "ok";
                if (verb == 'PUT' || verb == 'POST') {
                    response.status = "File updated."
                } else if (verb == "DELETE") {
                    response.status = "File deleted."
                }
            }
            session.output.write(response);
        })
        .catch(function(e) {
            console.error(e.stack);
            mgmtUtil.abort(e, null, null, response);
            //throw e; // "Uh-oh!"
        });
 
    }  catch (e) { // big catch for API rest
        console.error(e.stack);
        mgmtUtil.abort(e.message, null, null, response);
    } finally {
        return;
    }
}