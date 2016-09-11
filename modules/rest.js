const rest = exports.rest = require('rest');
const mime = exports.mime = require('rest/interceptor/mime');

const client = exports.client = rest.wrap(mime);