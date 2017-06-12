// by default deny all
module.exports = {
    // indexed by "org_name"
    "org1": {
        "/fx": "*" // allow all in group /fx
    },
    "org2": {
        "/fx": {
            "/backend/json": [
                "post"          // allow "POST backend/json"
                // deny GET, and other verbs
            ],
            "/backend/xml": "*"  // allow all verbs for API path /backend/xml
        }
    },
    "org3": "*", // allow all apis,

    // tester with all permissions
    "super-testers": {
        "/tests": "*",
    },

    "limited-testers": {
        "/tests": {
            "/authapp/allow-all": "*",
            "/authapp/allow-get": [
                "get"
            ]
        }
    }
};