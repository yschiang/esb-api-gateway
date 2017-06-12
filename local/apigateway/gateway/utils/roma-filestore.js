/**
 * @file 
 * filestore command utility with ROMA
 */
var sm = require('service-metadata'),
    env = require('../settings').ENV,
    url = require('url'),
    urlopen = require('urlopen'),
    fs = require('fs');

var romaPort = env['system.mgmt.port'];
var romaUrlPart = 'https://127.0.0.1:' + romaPort + '/mgmt/filestore/';
var sslProfile = 'roma-ssl-profile';

/**
 * mkdir
 * 
 * @param {string} romaDirPath
 *   Example: "domain/local/parent_dir"
 * @param {string} dirName
 *   The name of directory to create under parent_dir.
 * @param {function} callback
 *   ERROR-FIRST callback (error, standard ROMA result)
 */
function createDir(romaDirPath, dirName, callback) {
    let romaUrl = romaUrlPart + romaDirPath; // local/apis/apiname

    let req = {
        "directory": {
            "name": dirName
        }
    };

    let options = {
        target: romaUrl,
        method: 'POST',
        contentType: 'application/json',
        timeout: 60,
        sslClientProfile: sslProfile, // check this must exist in domain config 
        data: JSON.stringify(req)
    };
    urlopen.open(options, function(error, response) {
        if (error) {
            callback (new Error("urlopen error: " + JSON.stringify(error)), null);
            return;
        } 
        // get the response status code
        var responseStatusCode = response.statusCode;
        var responseReasonPhrase = response.reasonPhrase;
        // reading response data
        response.readAsJSON(function(error, json){
            if (error) {
                callback(error, null) ;
                return;
            }
            callback(null, json);
            return;
        });
    });
}

/**
 * copy file
 * 
 * Following example does copy from "local:///from_dir/from_file.js" to "local:///to_dir/some_file.js"
 * 
 * @param {string} localFromPath
 *   Example: "local:///from_dir/from_file.js"
 * @param {string} romaToDir
 *   Example: "domain/local/to_dir"
 * @param {string} toFilename
 *   Example: "some_file.js"
 * @param {function} callback
 *   ERROR-FIRST callback (error, standard ROMA result)
 */
function copyFile(localFromPath, romaToDir, toFilename, callback) {
    console.debug ("FS copy from %s to %s", localFromPath, romaToDir + '/' + toFilename);

    fs.readFile(localFromPath, function(error, buf) {
        if (error) {
            // Handle error.
            callback(error, null);
            return;
        } else {
            uploadFile(romaToDir, toFilename, buf, callback);    
        }
    });
}

/**
 * upload a file
 * 
 * Following example uploads the input buffer data to "local:///domain/local/dir/sample.js"
 * 
 * @param {string} romaDirPath
 *   Example: "domain/local/dir"
 * @param {string} filename
 *   Example: "sample.js"
 * @param {Buffer} buf
 *   Buffer object of input data.
 * @param {function} callback
 *   ERROR-FIRST callback (error, standard ROMA result)
 */
function uploadFile(romaDirPath, filename, buf, callback) {
    let base64 = buf.toString('base64');
    let romaUrl = romaUrlPart + romaDirPath + '/' + filename;

    let req = {
        file: {
            name: filename,
            content: base64
        }
    };
    let options = {
        target: romaUrl,
        method: 'PUT',
        contentType: 'application/json',
        timeout: 60,
        sslClientProfile: sslProfile, // check this must exist in domain config 
        data: JSON.stringify(req)
    };

    console.error ("/" + options.data + "/");
    
    urlopen.open(options, function(error, response) {
        if (error) {
            callback(new Error("urlopen error: "+ JSON.stringify(error)), null);
            return;
        }

        // get the response status code
        var responseStatusCode = response.statusCode;
        var responseReasonPhrase = response.reasonPhrase;

                console.error ("URL =  " + romaUrl + " >>> " + JSON.stringify(response));
        // reading response data
        response.readAsJSON(function(error, json){
            if (error){
                callback(error, null) ;
                return;
            } 
            callback(null, json);
            return;
        });
    });
}

/**
 * delete a file
 * 
 * Following example deletes "local:///domain/local/dir/sample.js"
 * 
 * @param {string} romaDirPath
 *   Example: "domain/local/dir"
 * @param {string} filename
 *   Example: "sample.js"
 * @param {function} callback
 *   ERROR-FIRST callback (error, standard ROMA result)
 */
function deleteFile(romaDirPath, filename, callback) {
    let romaUrl = romaUrlPart + romaDirPath + (filename ? '/' + filename : '');

    let options = {
        target: romaUrl,
        method: 'DELETE',
        timeout: 60,
        sslClientProfile: sslProfile // check this must exist in domain config 
    };
    urlopen.open(options, function(error, response) {
        if (error) {
            callback(new Error("urlopen error: "+ JSON.stringify(error)), null);
            return;
        } 
        // get the response status code
        var responseStatusCode = response.statusCode;
        var responseReasonPhrase = response.reasonPhrase;
        // reading response data
        response.readAsJSON(function(error, json){
            if (error){
                callback(error, null) ;
                return;
            } 
            callback(null, json);
            return;
        });
    });
}


exports.mkdir = createDir;
exports.upload = uploadFile;
exports.copy = copyFile;
exports.delete = deleteFile;