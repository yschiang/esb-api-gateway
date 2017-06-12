var APIError = require('local:///gateway/utils/errors').GWError,
    headerMetadata = require('header-metadata');

module.exports = function (
    sessionContext /* like session.input */,
    apiError /* APIError object */,
    callback /* function(exception, output) */) {

    // adjust the status code
    let originalErrorCode = headerMetadata.response.statusCode;
    apiError.setCode(originalErrorCode);

    sessionContext.readAsJSON( function (parseError, response) {
        if (parseError) {
            callback(parseError, null);
        } else {
            let errorObj = apiError.errorObject();
            errorObj.details = response;
            callback(null, errorObj );
        }
    });
}
