README

Gateway instances
========================
1  MPGW "api-gateway"

2  MPGW "api-gateway-mgmt"
    Providing rest mgmt apis.
    Currently supporting  
    * /mgmt/apis/{apiname}
    *      POST   create API directory (local:///apis/apiname), update API index file to add an API entry, and upload API definition file (api.js)
    *      PUT    update API definition file (api.js)
    *      DELETE delete API directory and update API index file to remove the API entry
    * 
    * /mgmt/apis/{apiname}/docs/{docname}
    *      POST   create (or update if existed) specified doc
    *      PUT    same as POST
    *      DELETE delete specified doc

3  MPGW "backend"

    for testing purpose



File structures
========================

local/
│
├── config/
│   ├── apps-orgs.js
│   └── orgs-apis.js
│
├── apis/
│   ├── _apis.index.js      (generated; file containing a JSON document listing ALL created APIs)
│   ├── {api_name}/         (generated; created when calling "PUT /mgmt/api/{api_name}") 
│   │   ├── api.json        (required, generated; api def file uploaded by mgmt api "PUT /mgmt/api/{api_name}")
│   │   ├── api.js          (required, generated; api require file generated when calling "PUT /mgmt/api/{api_name}")
│   │   ├── {schema.jsv}    (optional, generated; ... file uploaded by mgmt api "PUT /mgmt/api/{api_name}/docs/schema.jsv")
│   │   ├── {mapping.js}    (optional, generated; ... file uploaded by mgmt api "PUT /mgmt/api/{api_name}/docs/mapping.js")
│   │   └── ...             (optional, generated; ... file uploaded by mgmt api "PUT /mgmt/api/{api_name}/docs/{filename.subname}")
│   │
│   ├── fx/v1/              (an examplified api directory created by /mgmt/api/fx/v1 )
│   │   └── ...
│   │
│   └── ...
│
├── lib/                    (pre-defined; all 3rd party libs) 
│   └── 
│
└── gateway/                (pre-defined, immutable; gateway flow implementations)
    ├── settings.js         (pre-defined, immutable; storing global variables)
    ├── api.js              (pre-defined, immutable; methods for accessing and parsing config/*.js)
    ├── mgmt/               (files for "api-gateway-mgmt")
    │   └── ...
    │
    └── api/                (files for "api-gateway")
        └── ...

File naming conventions
========================
Use "dash" style, all lower-case.
    some-json.json
    some-xml.xml
    some-gatewayscript.js
    some-stylesheet.xsl
    some-schema.jsv
    some-schema.xsd


Client-Org-Api structure
========================
See /config/apps-orgs.js and /config/orgs-apis.js

Tasks
========================

1. PoC 功能調整

[完成] 1.1 重新設計及調整API定義格式，建立範例檔

    (Efforts: 2 H)

[完成] 1.2 重新建立 api-gateway 檔案結構、重新實作 api-gateway 所有程式碼、以及 bug fixing

    (Efforts: 1 PD) 

[完成] 1.3 支援 Backend GET
    (1H)


1.4 支援 Payload 日誌機制

    (Sizing:

2. 新增功能

[進行中] 2.1 建立 mgmt REST API，包含以下功能：
    + /mgmt/api/{api_name}              新增、修改、刪除 API package
    + /mgmt/api/{api_name}/docs/{file}  新增、修改、刪除 API documentation


    (Efforts: 1.5 PD)

2.2 錯誤處理

    (Sizing: 0.5 PD)

2.3 API 定義驗證模組

    (Sizing: 0.5 PD)


3. 自動化UT開發 / Version Control

3.1 UT

    (Sizing: 1 PD)

3.2 應用GitHub進行Version Control

    https://github.ibm.com/chiangys/esb-api-gaeway
    (Sizing: 2 H)



7. Client ID generator and get

3.

DONE


TODO
========================
1. 多個 processor
2. COMMON module
    util to get path
3. /rates/{currency}
    新增 context var var://context/parameters/currency
4. Should have default processor ?
   To set content-type