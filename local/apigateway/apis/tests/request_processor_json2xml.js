var json2xml = require('local:///apis/_common/json-to-xml.js').JsonToXml;
json2xml(
    session.input, /* input context */
    "Request" /* wrapper element */,
    true /* whether to set Content-Type as XML */,
    function (xmlBody) { session.output.write(xmlBody); } /* callback */
);