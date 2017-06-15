//@updatetime 2017-03-24T10:36:29.929Z
exports.api =
{
  "info":{
    "title": "sample",
    "description": "Sample APIs",
    "version": "1"
  },
  "basePath": "/tests",
  "defaultBackend": {
    "url": "http://127.0.0.1:8198/defaultBackend",
    "type": "application/json",
    "error": {
      "processor": "default_backend_error.js"
    }
  },
  "paths": {
    // default values
    // by default, the backend uses defaultBackend when resource backend is not defined
    // by default, the backend verb uses the client verb
    "/defaults": {
      "post": {
        "request": {},
        "response": {},
        "backend": {}
      },
      "get": {
        "request": {},
        "response": {},
        "backend": {}
      },
      "put": {
        "request": {},
        "response": {},
        "backend": {}
      }
    },

    // support verbs
    "/verbs": {
      "post": {
        "request": {},
        "response": {},
        "backend": {}
      },
      "get": {
        "request": {},
        "response": {},
        "backend": {}
      },
      "put": {
        "request": {},
        "response": {},
        "backend": {}
      }
    },

    // error handler
    "/error/backend/custom": {
      "post": {
        "request": {
          "type": "application/json"
        },
        "response": {
          "type": "application/json"
        },
        "backend": {
          "url": "http://127.0.0.1:8198/backend/status/500",
          "type": "application/json"
        }
      }
    },

    "/error/type/xml": {
      "post": {
        "request": {
          "type": "application/xml",
          "processor":"_not_exist_.js"  // use invalid processor to generate an error
        },
        "response": {
          "type": "application/xml"
        },
        "backend": {
          "url": "http://127.0.0.1:8198/",
          "type": "application/json"
        }
      }
    },

    "/error/type/json": {
      "post": {
        "request": {
          "type": "application/json",
          "processor":"_not_exist_.js"  // use invalid processor to generate an error
        },
        "response": {
          "type": "application/json"
        },
        "backend": {
          "url": "http://127.0.0.1:8198/",
          "type": "application/json"
        }
      }
    },

    "/error/processor/request": {
      "post": {
        "request": {
          "type": "application/json",
          "processor":"reject.js"
        },
        "response": {
          "type": "application/json"
        },
        "backend": {
          "url": "http://127.0.0.1:8198/",
          "type": "application/json"
        }
      }
    },

    "/error/processor/response": {
      "post": {
        "request": {
          "type": "application/json"
        },
        "response": {
          "type": "application/json",
          "processor":"reject.js"
        },
        "backend": {
          "url": "http://127.0.0.1:8198/",
          "type": "application/json"
        }
      }
    },

    "/error/routes/verb-not-found": {
      "post": {
        "request": {
          "type": "application/json"
        },
        "response": {
          "type": "application/json"
        },
        "backend": {
          "url": "http://127.0.0.1:8198/",
          "type": "application/json"
        }
      }
    },


    "/error/schema-validation/json": {
      "post": {
        "request": {
          "type": "application/json",
          "schema": "request_schema.jsv",
        },
        "response":{
          "type": "application/json",
          "schema": "response_schema.jsv",
        },
        "backend": {
          "url": "http://127.0.0.1:8198/json",
          "type": "application/json"
        }
      }
    },

    "/error/schema-validation/xml": {
      "post": {
        "request": {
          "type": "application/xml",
          "schema": "request_schema.xsd",
        },
        "response": {
          "type": "application/xml",
          "schema": "response_schema_2.xsd",
        },
        "backend": {
          "url": "http://127.0.0.1:8198/xml",
          "type": "application/xml"
        }
      }
    },

    "/error/unauthorized-app": {
      "post": {
        "request": {
          "type": "application/json"
        },
        "response": {
          "type": "application/json"
        },
        "backend": {
          "url": "http://127.0.0.1:8198/backend/authapp/allow-get",
          "type": "application/json"
        }
      }
    },
    // authapp
    "/authapp/allow-all": {
      "post": {
        "request": {
          "type": "application/json"
        },
        "response": {
          "type": "application/json"
        },
        "backend": {
          "url": "http://127.0.0.1:8198/backend/authapp/allow-all",
          "type": "application/json"
        }
      }
    },

    "/authapp/allow-get": {
      "post": {
        "request": {
          "type": "application/json"
        },
        "response": {
          "type": "application/json"
        },
        "backend": {
          "url": "http://127.0.0.1:8198/backend/authapp/allow-get",
          "type": "application/json"
        }
      },
      "get": {
        "request": {
          "type": "application/json"
        },
        "response": {
          "type": "application/json"
        },
        "backend": {
          "url": "http://127.0.0.1:8198/backend/authapp/allow-get",
          "type": "application/json"
        }
      }
    },


    // schema validation
    "/schema-validation/json": {
      "post": {
        "request": {
          "type": "application/json",
          "schema": "request_schema.jsv",
        },
        "response": {
          "type": "application/json",
          "schema": "response_schema.jsv",
        },
        "backend": {
          "url": "http://127.0.0.1:8198/json",
          "type": "application/json"
        }
      }
    },

    "/schema-validation/json/invalid-request": {
      "post": {
        "request": {
          "type": "application/json",
          "schema": "request_schema.jsv",
        },
        "response":{
          "type": "application/json",
          "schema": "response_schema.jsv",
        },
        "backend": {
          "url": "http://127.0.0.1:8198/json",
          "type": "application/json"
        }
      }
    },

    "/schema-validation/json/invalid-response": {
      "post": {
        "request": {
          "type": "application/json",
          "schema": "request_schema.jsv",
        },
        "response":{
          "type": "application/json",
          "schema": "response_schema.jsv",
        },
        "backend": {
          "url": "http://127.0.0.1:8198/xml",
          "type": "application/xml"
        }
      }
    },    

    "/schema-validation/xml": {
      "post": {
        "request": {
          "type": "application/xml",
          "schema": "request_schema.xsd",
        },
        "response": {
          "type": "application/xml",
          "schema": "response_schema.xsd",
        },
        "backend": {
          "url": "http://127.0.0.1:8198/xml",
          "type": "application/xml"
        }
      }
    },

    "/schema-validation/xml/invalid-request": {
      "post": {
        "request": {
          "type": "application/xml",
          "schema": "request_schema.xsd",
        },
        "response": {
          "type": "application/xml",
          "schema": "response_schema.xsd",
        },
        "backend": {
          "url": "http://127.0.0.1:8198/xml",
          "type": "application/xml"
        }
      }
    },

    "/schema-validation/xml/invalid-response": {
      "post": {
        "request": {
          "type": "application/xml",
          "schema": "request_schema.xsd",
        },
        "response": {
          "type": "application/xml",
          "schema": "response_schema_2.xsd",
        },
        "backend": {
          "url": "http://127.0.0.1:8198/xml",
          "type": "application/xml"
        }
      }
    },

    // processors
    "/processors/usr/gatewayscript": {
      "post": {
        "request": {
          "type": "application/json",
          "processor":"request_processor.js"
        },
        "response": {
          "type": "application/json",
          "processor":"response_processor.js"
        },
        "backend": {
          "url": "http://127.0.0.1:8198/json",
          "type": "application/json"
        }
      }
    },

    "/processors/usr/stylesheet": {
      "post": {
        "request": {
          "type": "application/xml",
          "processor":"request_processor.xsl"
        },
        "response": {
          "type": "application/xml",
          "processor":"response_processor.xsl"
        },
        "backend": {
          "url": "http://127.0.0.1:8198/xml",
          "type": "application/xml"
        }
      }
    },


    // assembly
    "/assembly/get2post": {
      "get": {
        "request": {
          "processor":"request_processor_dummybody.js"
        },
        "response": {
          "type": "application/json"
        },
        "backend": {
          "url": "http://127.0.0.1:8198/backend/assembly/get2post",
          "type": "application/json",
          "method": "post"
        }
      }
    },

    "/assembly/json-xml-bridge": {
      "post":{
        "request":{
          "type":"application/json",
          "processor":"request_processor_json2xml.js"
        },
        "response":{
          "type":"application/json",
          "processor":"response_processor_xml2json.xsl"
        },
        "backend": {
          "url":"http://127.0.0.1:8198/backend/webservice",
          "type":"application/xml"
        }
      }
    },

    // parameterized query
    "/parameterized/{param1}/parts/{param2}": {
      "post":{
        "request":{
          "type":"application/json",
          "processor":"request_processor_params.js"
        },
        "response":{
          "type":"application/json"
        },
        "backend": {
          "url":"http://127.0.0.1:8198/backend/?foo=$(request.parameters.param1)&bar=$(request.parameters.param2)"
        }
      }
    }
  }
}