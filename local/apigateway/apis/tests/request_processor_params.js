var Session = require('local:///apis/_common/session.js');

var request = new Session();

session.output.write(request.parameters);