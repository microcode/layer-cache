const { BaseCache } = require('./lib/base');
const { SerializingCache } = require('./lib/serializing');
const { MemoryCache } = require('./lib/memory');
const { OnionCache } = require('./lib/onion');

exports.BaseCache = BaseCache;
exports.SerializingCache = SerializingCache;
exports.MemoryCache = MemoryCache;
exports.OnionCache = OnionCache;
