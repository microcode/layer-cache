import "mocha";
import * as chai from "chai";

import { MemoryCache } from './MemoryCache';

const expect = chai.expect;

/* tslint:disable:only-arrow-functions */

describe('MemoryCache', function () {
    it('should return previously set data', async function () {
        const cache = new MemoryCache();
        const testKey = 'key';
        const testValue = 'value';

        await cache.set(testKey, testValue);

        const result = await cache.get(testKey);
        expect(result).to.equal(testValue);
    });

    it('should not return expired data', async function () {
        const cache = new MemoryCache({ maxAge: 5 });
        const testKey = 'key';
        const testValue = 'value';

        await cache.set(testKey, testValue);

        await new Promise((resolve) => setTimeout(resolve, 10));

        const result = await cache.get(testKey);
        expect(result).to.equal(undefined);
    });

    it('should not return expunged data', async function () {
        const cache = new MemoryCache({ max: 1 });
        const testKey1 = 'key1';
        const testKey2 = 'key2';
        const testValue = 'value';

        await cache.set(testKey1, testValue);
        await cache.set(testKey2, testValue);

        const result1 = await cache.get(testKey1);
        expect(result1).to.equal(undefined);

        const result2 = await cache.get(testKey2);
        expect(result2).to.equal(testValue);
    })
});
