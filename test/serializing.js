const { MemoryCache } = require('..');
const { SerializingCache } = require('..');
const { DelayedCache } = require('./util/delayed');

const assert = require('assert');

describe("SerializingCache", function () {
    describe('get', function () {
        it ("should fill using callback", function () {
            const testValue = 'value';
            const testKey = 'key';

            const memoryCache = new MemoryCache();
            const cache = new SerializingCache(memoryCache, () => {
                return new Promise((resolve) => resolve(testValue));
            });

            return cache.get(testKey).then((result) => {
                assert(result === testValue);
            }).then(() => {
                return memoryCache.get(testKey).then((result) => {
                    assert(result === testValue);
                })
            });
        });

        it("should only issue one read per request run", function () {
            class TestCache extends MemoryCache {
                constructor() {
                    super();
                    this.counter = 0;
                }
                get(key) {
                    this.counter++;
                    return super.get(key);
                }
            }

            const testValue = 'value';
            const testKey = 'key';

            const rootCache = new DelayedCache(new TestCache(), { get: 10 });
            const cache = new SerializingCache(rootCache, () => {
                return new Promise((resolve) => resolve(testValue));
            });

            return Promise.all([
                cache.get(testKey), cache.get(testKey), cache.get(testKey)
            ]).then(() => {
                assert.equal(rootCache.cache.counter, 2, "Cache should be read twice");
            });
        });
    });

    describe('set', function () {
        it('should not be supported', function () {
            const memoryCache = new MemoryCache();
            const cache = new SerializingCache(memoryCache, () => {
                return new Promise((resolve) => resolve("value"));
            });
            const testKey = 'key';

            return cache.set(testKey, "dummy").then(() => {
                throw Error("Set successful");
            }, (err) => {});
        });
    });

    describe('del', function () {
        it ("should fill using callback", function () {
            const testValue = 'value';
            const testKey = 'key';

            const memoryCache = new MemoryCache();
            const cache = new SerializingCache(memoryCache, () => {
                return new Promise((resolve) => resolve(testValue));
            });

            return cache.get(testKey).then((result) => {
                assert(result === testValue);
            }).then(() => {
                return memoryCache.get(testKey).then((result) => {
                    assert(result === testValue);
                })
            });
        });

        it("should only issue one delete per request run", function () {
            class TestCache extends MemoryCache {
                constructor() {
                    super();
                    this.counter = 0;
                }
                del(key) {
                    this.counter++;
                    return super.del(key);
                }
            }

            const testValue = 'value';
            const testKey = 'key';

            const rootCache = new DelayedCache(new TestCache(), { get: 10 });
            const cache = new SerializingCache(rootCache, () => {
                return new Promise((resolve) => resolve(testValue));
            });

            return Promise.all([
                cache.del(testKey), cache.del(testKey), cache.del(testKey)
            ]).then(() => {
                assert.equal(rootCache.cache.counter, 2, "Cache entry should be deleted twice");
            });
        });
    });
});
