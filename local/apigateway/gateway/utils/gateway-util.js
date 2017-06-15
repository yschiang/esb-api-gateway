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

        function replacer(match, p1, p2, offset, string) {
            let toMask = p2.substring(4);
            let stars = '';
            for (let i=0; i<toMask.length; ++i) {
                stars += '*';
            }

            let maskedClient = 'client_id=' + p2.substring(0, 4) + stars;
            return p1 + maskedClient;
        }
        var re = /([\?&])client_id=([^#&\?]+)/;
        return str.replace(re, replacer);
    }
}

exports.maskClientId = SensitiveDataMask.maskClientId;
exports.isXML = ContentType.isXML;
exports.isJSON = ContentType.isJSON;