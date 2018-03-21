const { BaseCache } = require('./base');
const LRUCache = require('lru-cache');

class MemoryCache extends BaseCache {
    constructor(options) {
        super();

        options = options || {};
        this.lru = LRUCache({
            max: options.max || 64,
            maxAge: options.maxAge || 1000 * 60 * 5
        });
    }

    get(key) {
        return new Promise((resolve) => resolve(this.lru.get(key)));
    }

    set(key, value) {
        return new Promise((resolve) => {
            this.lru.set(key, value);
            resolve();
        });
    }

    del(key) {
        return new Promise((resolve) => {
            this.lru.del(key);
            resolve();
        });
    }
}

exports.MemoryCache = MemoryCache;
