const { BaseCache } = require('./base');
const LRUCache = require('lru-cache');
const log = require('@microcode/debug-ng')('layer-cache:memory');

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
        log.trace('get %s', key);
        return new Promise(resolve => resolve(this.lru.get(key)));
    }

    set(key, value) {
        log.trace('set %s', key);
        return new Promise(resolve => {
            this.lru.set(key, value);
            resolve();
        });
    }

    del(key) {
        log.trace('del %s', key);
        return new Promise(resolve => {
            this.lru.del(key);
            resolve();
        });
    }
}

exports.MemoryCache = MemoryCache;
