import "mocha";
import * as chai from "chai";

import { MemoryCache } from './MemoryCache';
import { DelayedCache } from './test/DelayedCache';

import { SerializingCache } from './SerializingCache';

const expect = chai.expect;

/* tslint:disable:only-arrow-functions */
/* tslint:disable:max-classes-per-file */

describe("SerializingCache", function () {
    describe('get', function () {
        it ("should fill using callback", async function () {
            const testValue = 'value';
            const testKey = 'key';

            const memoryCache = new MemoryCache();
            const cache = new SerializingCache(memoryCache, async () => testValue);

            const result1 = await cache.get(testKey);
            expect(result1).to.equal(testValue);

            const result2 = await memoryCache.get(testKey);
            expect(result2).to.equal(testValue);
        });

        it("should only issue one read per request run", async function () {
            class TestCache extends MemoryCache {
                counter: number
                constructor() {
                    super();
                    this.counter = 0;
                }

                get(key: string): Promise<string> {
                    this.counter++;
                    return super.get(key);
                }
            }

            const testValue = 'value';
            const testKey = 'key';

            const rootCache = new DelayedCache(new TestCache(), { get: 10 });
            const cache = new SerializingCache(rootCache, async () => testValue);

            await Promise.all([
                cache.get(testKey), cache.get(testKey), cache.get(testKey)
            ]);

            expect((rootCache.cache as TestCache).counter).to.equal(2);
        });
    });

    describe('set', function () {
        it('should not be supported', async function () {
            const memoryCache = new MemoryCache();
            const cache = new SerializingCache(memoryCache, async () => "value");

            const testKey = 'key';

            let set = false;
            try {
                await cache.set(testKey, "dummy");
                set = true;
            } catch (err) {
                // empty block
            }

            expect(set).to.equal(false);
        });
    });

    describe('del', function () {
        it("should only issue one delete per request run", async function () {
            class TestCache extends MemoryCache {
                counter: number
                constructor() {
                    super();
                    this.counter = 0;
                }
                del(key: string) {
                    this.counter++;
                    return super.del(key);
                }
            }

            const testValue = 'value';
            const testKey = 'key';

            const rootCache = new DelayedCache(new TestCache(), { get: 10 });
            const cache = new SerializingCache(rootCache, async () => testValue);

            await Promise.all([
                cache.del(testKey), cache.del(testKey), cache.del(testKey)
            ]);

            expect((rootCache.cache as TestCache).counter).to.equal(2);
        });
    });
});
