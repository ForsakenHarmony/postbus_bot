const debug    = require('debug')('modules:logger');
const humanize = require('humanize-number');

module.exports = dev;

/**
 * Show the response time in a human readable format.
 * In milliseconds if less than 10 seconds,
 * in seconds otherwise.
 */
function dev() {
  return async function logger(ctx, next) {
    const start = new Date;
    await next();
    debug('%s - %s', ctx.updateType, time(start))
  }
}

function time(start) {
  const delta = new Date - start;
  return humanize(delta < 10000
    ? delta + 'ms'
    : Math.round(delta / 1000) + 's');
}