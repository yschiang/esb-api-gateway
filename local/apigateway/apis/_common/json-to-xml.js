var util = require('util'),
    hm = require('header-metadata');

exports.JsonToXml = function (
  sessionInput,
  xmlRootElementName,
  setXmlCt /** whether to set content type as xml */,
  callbackFunc) {

  sessionInput.readAsJSON(function(error, json) {
    if (error) {
      throw error;
    } else {
      // the default XML root element name
      var xmlChildrenElements = json;

      var keys = Object.keys(json);
      if (keys.length == 1) {
          if (util.isObject(json[keys[0]])) {
              // if the JSON object has one single property and its value is an object,
              // then the property name will be the XML top element name and
              // the property value will be the children XML elements
              xmlRootElementName = keys[0];
              xmlChildrenElements = json[keys[0]];
          }
      }

      var js2xmlparser = require("local:///lib/js2xmlparser.js");
      var xml = js2xmlparser(xmlRootElementName, xmlChildrenElements);

      // post-check: parse to validate the XML
      XML.parse(xml);

      // write the xml string instead of XML object to avoid output escaping issue
      callbackFunc(xml);
      //session.output.write(xml);

      // set content-type as 'xml' to backend
      if (setXmlCt !== false) {
        hm.current.set('Content-Type', 'application/xml');
      }
    }
  });
};
