var ContentType = {
    isXML: function (ct) {
        return ct && ct.indexOf('xml') != -1;
    },
    isJSON: function (ct) {
        return ct && ct.indexOf('json') != -1;
    }
};

var SensitiveDataMask = {
    maskClientId: function (str) {
        var re = /([\?&])client_id=(.+)/i;
        return str.replace(re, '$1client_id=#######');
    }
}

exports.maskClientId = SensitiveDataMask.maskClientId;
exports.isXML = ContentType.isXML;
exports.isJSON = ContentType.isJSON;