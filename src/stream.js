'use strict';

/**
 * Module dependencies.
 */
const { Writable } = require('stream');

/**
 * Expose parser.
 */
module.exports = class Parser extends Writable {
  constructor(options) {
    super(options);
    this.state = 'message';
    this._lenbuf = Buffer.alloc(4);
  }

  _write(chunk, encoding, callback) {
    var i;
    var meta;
    var rem;
    var pos;
    var part;
    var done;

    for (i = 0; i < chunk.length; i += 1) {
      // eslint-disable-next-line default-case
      switch (this.state) {
        case 'message':
          meta = chunk[i];
          this.version = meta >> 4;
          this.argv = meta & 0xf;
          this.state = 'arglen';
          this._bufs = [Buffer.from([meta])];
          this._nargs = 0;
          this._leni = 0;
          break;

        case 'arglen':
          this._lenbuf[(this._leni += 1)] = chunk[i];

          // done
          if (this._leni === 4) {
            this._arglen = this._lenbuf.readUInt32BE(0);
            const buf = Buffer.alloc(4);
            buf[0] = this._lenbuf[0];
            buf[1] = this._lenbuf[1];
            buf[2] = this._lenbuf[2];
            buf[3] = this._lenbuf[3];
            this._bufs.push(buf);
            this._argcur = 0;
            this.state = 'arg';
          }
          break;

        case 'arg':
          // bytes remaining in the argument
          rem = this._arglen - this._argcur;

          // consume the chunk we need to complete
          // the argument, or the remainder of the
          // chunk if it's not mixed-boundary
          pos = Math.min(rem + i, chunk.length);

          // slice arg chunk
          part = chunk.slice(i, pos);
          this._bufs.push(part);

          // check if we have the complete arg
          this._argcur += pos - i;
          done = this._argcur === this._arglen;
          i = pos - 1;

          if (done) this._nargs += 1;

          // no more args
          if (this._nargs === this.argv) {
            this.state = 'message';
            this.emit('data', Buffer.concat(this._bufs));
            break;
          }

          if (done) {
            this.state = 'arglen';
            this._leni = 0;
          }
          break;
      }
    }

    callback();
  }
};
