const Peer = require('./Peer');
const WebSocketTransport = require('./transports/WebSocketTransport');

/**
 * Expose mediasoup-client version.
 *
 * @type {String}
 */
exports.version = "1.0.1";

/**
 * Expose Peer class.
 *
 * @type {Class}
 */
exports.Peer = Peer;

/**
 * Expose WebSocketTransport class.
 *
 * @type {Class}
 */
exports.WebSocketTransport = WebSocketTransport;
