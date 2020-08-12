import "mocha";
import * as chai from "chai";

import { OnionCache } from './OnionCache';
import { MemoryCache } from './MemoryCache';

const expect = chai.expect;

/* tslint:disable:only-arrow-functions */

describe('OnionCache', function () {
    describe('get', function () {
        it('should fetch from first cache', async function () {
            const fastCache = new MemoryCache();
            const slowCache = new MemoryCache();
            const cache = new OnionCache(fastCache, slowCache);
            const testKey = 'key';
            const testValue = 'value';

            await fastCache.set(testKey, testValue);

            const result = await cache.get(testKey);
            expect(result).to.equal(testValue);
        });

        it('should fetch from second cache if not in first cache', async function () {
            const fastCache = new MemoryCache();
            const slowCache = new MemoryCache();
            const cache = new OnionCache(fastCache, slowCache);
            const testKey = 'key';
            const testValue = 'value';

            await slowCache.set(testKey, testValue);

            const result = await cache.get(testKey);
            expect(result).to.equal(testValue);
        });

        it('should populate first cache with data from second cache', async function () {
            const fastCache = new MemoryCache();
            const slowCache = new MemoryCache();
            const cache = new OnionCache(fastCache, slowCache);
            const testKey = 'key';
            const testValue = 'value';

            await slowCache.set(testKey, testValue);

            const result1 = await fastCache.get(testKey);
            expect(result1).to.equal(undefined);

            const result2 = await cache.get(testKey);
            expect(result2).to.equal(testValue);

            const result3 = await fastCache.get(testKey);
            expect(result3).to.equal(testValue);
        });
    });

    describe('set', function () {
        it('should set to all caches', async function () {
            const fastCache = new MemoryCache();
            const slowCache = new MemoryCache();
            const cache = new OnionCache(fastCache, slowCache);
            const testKey = 'key';
            const testValue = 'value';

            await cache.set(testKey, testValue);

            const result1 = await fastCache.get(testKey);
            expect(result1).to.equal(testValue);

            const result2 = await slowCache.get(testKey);
            expect(result2).to.equal(testValue);
        });
    });

    describe('del', function () {
        it('should delete from all caches', async function () {
            const fastCache = new MemoryCache();
            const slowCache = new MemoryCache();
            const cache = new OnionCache(fastCache, slowCache);
            const testKey = 'key';
            const testValue = 'value';

            await cache.set(testKey, testValue);

            const result1 = await fastCache.get(testKey);
            expect(result1).to.equal(testValue);

            const result2 = await slowCache.get(testKey);
            expect(result2).to.equal(testValue);

            await cache.del(testKey);

            const result3 = await fastCache.get(testKey);
            expect(result3).to.equal(undefined);

            const result4 = await slowCache.get(testKey);
            expect(result4).to.equal(undefined);
        });
    });
});
