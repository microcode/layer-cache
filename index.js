const { BaseCache } = require('./lib/base');
const { SerializingCache, NonSerializingCache } = require('./lib/serializing');
const { MemoryCache } = require('./lib/memory');
const { OnionCache } = require('./lib/onion');

exports.BaseCache = BaseCache;
exports.SerializingCache = SerializingCache;
exports.NonSerializingCache = NonSerializingCache;
exports.MemoryCache = MemoryCache;
exports.OnionCache = OnionCache;
