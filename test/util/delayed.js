const { BaseCache } = require('../../lib/base');

class DelayedCache extends BaseCache {
    constructor(cache, options) {
        super();

        options = options || {};

        this.cache = cache;
        this.options = options;
    }

    get(key) {
        return this.delay(this.options.get || 0).then(() => this.cache.get(key));
    }

    set(key, value) {
        return this.delay(this.options.set || 0).then(() => this.cache.set(key, value));
    }

    del(key) {
        return this.delay(this.options.del).then(() => this.cache.del(key));
    }

    delay(timeout) {
        return new Promise((resolve) => {
            setTimeout(resolve, timeout);
        });
    }
}

exports.DelayedCache = DelayedCache;