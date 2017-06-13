

// function Session() {
//     let ctx = session.name('apimgr');
//     this._parameters = ctx ? ctx.getVar("parameters") : null;
// }

// Object.defineProperty(Session.prototype, 'parameters', {
//     get: function() {
//         return this._parameters;
//     }
// });

module.exports =  require('local:///gateway/api-gateway/apigw-util.js').Session;