var APIError = require('local:///gateway/utils/errors').GWError,
    headerMetadata = require('header-metadata');

module.exports = function (
    sessionContext /* like session.input */,
    apiError /* APIError object */,
    callback /* function(exception, output) */) {

    // adjust the status code
    let originalErrorCode = headerMetadata.original.statusCode;
    let originalReasonPhrase = headerMetadata.original.reasonPhrase;

    apiError.setCode(originalErrorCode);
    apiError.setStatus(originalReasonPhrase);

    sessionContext.readAsJSON( function (parseError, response) {
        if (parseError) {
            callback(parseError, null);
        } else {
            let errorObj = apiError.errorObject();
            errorObj.details = response;
            callback(null, response);
        }
    });
}
