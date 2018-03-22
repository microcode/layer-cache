const { BaseCache } = require('./base');

class OnionCache extends BaseCache {
    constructor(...caches) {
        super();

        this.caches = caches;
    }

    get(key) {
        return this.__get(key, 0);
    }

    __get(key, index) {
        if (index >= this.caches.length) {
            return Promise.resolve();
        }

        const cache = this.caches[index];
        return cache.get(key).then((result) => {
            if (!result) {
                return this.__get(key, index + 1);
            }

            return this.__update(key, result, index - 1).then(() => {
                return result;
            });
        });
    }

    __update(key, value, index) {
        if (index < 0) {
            return Promise.resolve();
        }

        const cache = this.caches[index];
        return cache.set(key, value).then(() => {
            return this.__update(key, value, index - 1);
        })
    }

    set(key, value) {
        return this.__set(key, value, 0);
    }

    __set(key, value, index) {
        if (index >= this.caches.length) {
            return Promise.resolve();
        }

        const cache = this.caches[index];
        return cache.set(key, value).then(() => {
            return this.__set(key, value, index + 1);
        });
    }

    del(key) {
        return this.__del(key, 0);
    }

    __del(key, index) {
        if (index >= this.caches.length) {
            return Promise.resolve();
        }

        const cache = this.caches[index];
        return cache.del(key).then(() => {
            return this.__del(key, index + 1);
        });
    }
}

exports.OnionCache = OnionCache;