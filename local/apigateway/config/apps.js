module.exports = {
    // Indexed by "client_id"

    // Properties:
    //   .description - string.
    //   .acl - optional. An array of CIDR formatted string. When not specified, by default allow all.
    //   .organization - string. Org's seq No.
    //   .authorizedResources - see following examples.

    // Examples for authorizedResources:
    //
    // "authorizedResources" : {
    //     "/fx": "*" // allow all in group /fx
    // }
    //
    // "authorizedResources" : {
    //     "/fx": {
    //         "/backend/json": [
    //             "post"          // allow "POST backend/json", deny GET, and other verbs             
    //         ],
    //         "/backend/xml": "*"  // allow all verbs for API path /backend/xml
    //     }
    // },
    //
    // "authorizedResources": "*", // allow all apis,

    "super-tester-1234567890": {
        "description": "tester with all permissions",
        "authorizedResources": {
            "/tests": "*",
            "/tests/v2": "*",
            "/tests/v3": "*"
        },
        "acl": [
            "0.0.0.0/0",
            "172.17.0.0/24"
        ],
        "organizationId": "org_seq_no2",
        "clientIdNo": "client_001"
    },

    "limited-tester-1234567890": {
        "description": "tester with limited permissions",
        "authorizedResources": {
            "/tests": {
                "/authapp/allow-all": "*",
                "/authapp/allow-get": [
                    "get"
                ]
            }
        },
        "acl": [
            "0.0.0.0/0",
            "172.17.0.0/24"
        ],
        "organizationId": "org_seq_no2",
        "clientIdNo": "client_002"
    }
};