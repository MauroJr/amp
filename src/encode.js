'use strict';

/**
 * Protocol version.
 * @type {number}
 */
const VERSION = 1;

module.exports = encode;

/**
 * Encode `msg` and `args`.
 *
 * @param {Array} args
 * @return {Buffer}
 * @api public
 */
function encode(args) {
  const argc = args.length;
  let len = 1;
  let off = 0;
  var i;

  // data length
  for (i = 0; i < argc; i += 1) {
    len += 4 + args[i].length;
  }

  // buffer
  const buf = Buffer.alloc(len);

  // pack meta
  buf[off += 1] = (VERSION << 4) | argc;

  // pack args
  for (i = 0; i < argc; i += 1) {
    const arg = args[i];

    buf.writeUInt32BE(arg.length, off);
    off += 4;

    arg.copy(buf, off);
    off += arg.length;
  }

  return buf;
}
