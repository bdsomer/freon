module.exports = class extends require('stream').Writable {
	_write(chunk, encoding, cb) {
		const chunkBuffer = Buffer.from(chunk, encoding);
		if (!this.body) {
			this.body = chunkBuffer;
		} else {
			this.body = Buffer.concat([this.body, chunkBuffer]);
		}
		cb();
	}
}