var sess = require('local:///apis/_common/session.js');

session.output.write(sess.request.parameters);