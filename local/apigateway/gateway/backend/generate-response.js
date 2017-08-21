var hm = require('header-metadata');
var sm = require('service-metadata');
var url = require('url');

var inHeaders = hm.original;
var parsedURL = url.parse(sm.URLIn, true);
var statusCode = 200;
var response;

// /status/{code} Returns given HTTP Status code.
// /post
// /get


let a = /\/status\/(\d+)/.exec(parsedURL.pathname);
if (a) {
    statusCode = parseInt(a[1]);
}
hm.response.statusCode = statusCode;

if (inHeaders.get('X-Empty')) {
    hm.response.statusCode = '204 No Content';
    hm.response.remove('Content-Type');
    session.output.write("");
} else if (inHeaders.get('Content-Type').indexOf('xml') != -1) {
    session.input.readAsBuffer(function(error, buff) {
        response  = "<response>";
        response += "<headers>";
        for (let header in inHeaders.get()) {
            response += "<" + header + ">" + inHeaders.get(header) + "</" + header + ">";
        }
        response += "</headers>";
        response += "<http-method>" + sm.protocolMethod + "</http-method>";
        response += "<url>" + sm.URLIn + "</url>";

        let body = buff.toString();
        // strip <? ... ?>
        body = body.substring(body.lastIndexOf('?>') + 2);
        response += "<body>" + body + "</body>";
        response += "</response>";
        session.output.write(response);
    });

} else {
    session.input.readAsBuffer(function(error, buff) {
        response = {};
        response.headers = {};
        for (let header in inHeaders.get()) {
            response.headers[header] = inHeaders.get(header);
        }
        response.httpMethod = sm.protocolMethod;
        if (sm.protocolMethod == 'PUT' || sm.protocolMethod == 'POST') {
            if (inHeaders.get('Content-Type').indexOf('json') != -1) {
                response.body = JSON.parse(buff.toString());
            } else {
                response.body = buff.toString();
            }
        } else {
            response.body = '';
        }
        response.url = sm.URLIn;
        session.output.write(response);
    });
}

