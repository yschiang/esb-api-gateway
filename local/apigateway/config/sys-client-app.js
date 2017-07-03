module.exports = {

    // In Eun's real world, the organizations and apps are modeled by systems and clients.
    // Specifically, there are many systems (example, PIB, CIB, or FX)
    // Each system can have one to many clients.
    // The IP ACL and API ACL are bound to system.

    // Two tables 
    //
    // <system>
    // A JSON object indexed by "systemId"
    // Properties:
    //   .name - string. The system title.
    //   .description - string. The detailed descriptions of the system.
    //   .acl - optional. An array of CIDR formatted string. When not specified, by default allow all.
    //   .authorizedResources - see following examples.
    //
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
    //
    //
    // <client>
    // A JSON object indexed by "clientId".
    // Properties:
    //   .$system - string. Must reference to one of the system id.


    "system": {
        // indexed by "systemId"
        "sys_001": {
            "name": "super-tester",
            "description": "tester system with all permissions",
            "key": "",
            "authorized_resources": {
                "/tests": "*",
                "/tests/v2": "*",
                "/tests/v3": "*"
            }
        },

        "sys_002": {
            "name": "limited-tester",
            "description": "tester with limited permissions",
            "key": "",
            "authorized_resources": {
                "/tests": {
                    "/authapp/allow-all": "*",
                    "/authapp/allow-get": [
                        "get"
                    ]
                }
            },
        },

        "sys_003": {
            "name": "",
            "description": "testing api with param query",
            "key": "",
            // "ips": [
            //     "172.17.3.1"
            // ],
            "authorized_resources": {
                "/tests": {
                    "/parameterized/{param1}/parts/{param2}": "*"
                }
            }
        }
    },

    "client": {
        // indexed by clientId
        "super-tester-1234567890": {
            // use $ for referencial key
            // actually consider to use $ref: "system#sys_001"
            "$system": "sys_001"
        },
        "limited-tester-1234567890": {
            "$system": "sys_002"
        },
        "param-tester-1234567890": {
            "$system": "sys_003"
        }
    }
};