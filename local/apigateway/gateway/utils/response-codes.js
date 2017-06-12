// The API uses the following response status codes, as defined in the RFC 2616 and RFC 6585:
module.exports = {
    202: {
        status: "Accepted",
        description: "The request has been accepted for processing, but the processing has not been completed."
    },
    400: {
        status: "Bad Request",
        description: "The request could not be understood by the server due to malformed syntax. The message body will contain more information"
    },
    401: {
        status: "Unauthorized",
        description: "The request requires user authentication or, if the request included authorization credentials, authorization has been refused for those credentials."
    },
    404: {
        status: "Not Found",
        description: "The requested resource could not be found. This error can be due to a temporary or permanent condition."
    },
    429: {
        status: "Too Many Requests",
        description: "Rate limiting has been applied"
    },
    500: {
        status: "Internal Server Error",
        //description: "You should never receive this error because our clever coders catch them all ... but if you are unlucky enough to get one, please report it to us through a comment at the bottom of this page."
        description: "Something went wrong during request or response processing"
    },
    503: {
        status: "Backend Service Unavailable",
        description: "The server is currently unable to handle the request due to a temporary condition which will be alleviated after some delay. You can choose to resend the request again."
    }
};