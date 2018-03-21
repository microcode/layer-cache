const { MemoryCache } = require('../lib/memory');

const assert = require('assert');

describe('MemoryCache', () => {
    it('should return previously set data', function () {
        const cache = new MemoryCache();
        const testKey = 'key';
        const testValue = 'value';

        return cache.set(testKey, testValue).then(function () {
            return cache.get(testKey).then((result) => {
                assert(result === testValue);
            });
        });
    });

    it('should not return expired data', function () {
        const cache = new MemoryCache({ maxAge: 5 });
        const testKey = 'key';
        const testValue = 'value';

        return cache.set(testKey, testValue).then(function () {
            return new Promise(function (resolve) {
                setTimeout(resolve, 10);
            }).then(function () {
                return cache.get(testKey).then((result) => {
                    assert(result === undefined);
                });
            });
        });
    });

    it('should not return expunged data', function () {
        const cache = new MemoryCache({ max: 1 });
        const testKey1 = 'key1';
        const testKey2 = 'key2';
        const testValue = 'value';

        return cache.set(testKey1, testValue).then(function () {
            return cache.set(testKey2, testValue);
        }).then(function () {
            return cache.get(testKey1).then((result) => {
                assert(result === undefined);
            });
        }).then(function () {
            return cache.get(testKey2).then((result) => {
                assert(result === testValue);
            });
        });
    })
});