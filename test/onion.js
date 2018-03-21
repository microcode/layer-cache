const { OnionCache } = require('..');
const { MemoryCache } = require('..');

const assert = require('assert');

describe('OnionCache', function () {
    describe('get', function () {
        it('should fetch from first cache', function () {
            const fastCache = new MemoryCache();
            const slowCache = new MemoryCache();
            const cache = new OnionCache(fastCache, slowCache);
            const testKey = 'key';
            const testValue = 'value';

            return fastCache.set(testKey, testValue).then(function () {
                cache.get(testKey).then((result) => {
                    assert(result === testValue);
                })
            });
        });

        it('should fetch from second cache if not in first cache', function () {
            const fastCache = new MemoryCache();
            const slowCache = new MemoryCache();
            const cache = new OnionCache(fastCache, slowCache);
            const testKey = 'key';
            const testValue = 'value';

            return slowCache.set(testKey, testValue).then(function () {
                cache.get(testKey).then((result) => {
                    assert(result === testValue);
                })
            });
        });
    });

    describe('set', function () {
        it('should set to all caches', function () {
            const fastCache = new MemoryCache();
            const slowCache = new MemoryCache();
            const cache = new OnionCache(fastCache, slowCache);
            const testKey = 'key';
            const testValue = 'value';

            return cache.set(testKey, testValue).then(() => {
                return fastCache.get(testKey).then((result) => {
                    assert(result === testValue);
                });
            }).then(() => {
                return slowCache.get(testKey).then((result) => {
                    assert(result === testValue);
                });
            });
        });
    });

    describe('del', function () {
        it('should delete from all caches', function () {
            const fastCache = new MemoryCache();
            const slowCache = new MemoryCache();
            const cache = new OnionCache(fastCache, slowCache);
            const testKey = 'key';
            const testValue = 'value';

            return cache.set(testKey, testValue).then(() => {
                return fastCache.get(testKey).then((result) => {
                    assert(result === testValue);
                });
            }).then(() => {
                return slowCache.get(testKey).then((result) => {
                    assert(result === testValue);
                });
            }).then(() => {
                return cache.del(testKey);
            }).then(() => {
                return fastCache.get(testKey).then((result) => {
                    assert(result === undefined);
                });
            }).then(() => {
                return slowCache.get(testKey).then((result) => {
                    assert(result === undefined);
                });
            });
        });
    })
});
