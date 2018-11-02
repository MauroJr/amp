'use strict';

module.exports = decode;

/**
 * Decode the given `buf`.
 *
 * @param {Buffer} buf
 * @return {Object}
 * @api public
 */
function decode(buf) {
  let off = 0;
  var i;

  // unpack meta
  const meta = buf[(off += 1)];
  // const VERSION = meta >> 4;
  const argv = meta & 0xf;
  const args = new Array(argv);

  // unpack args
  for (i = 0; i < argv; i += 1) {
    const len = buf.readUInt32BE(off);
    off += 4;

    args[i] = buf.slice(off, (off += len));
  }

  return args;
}
