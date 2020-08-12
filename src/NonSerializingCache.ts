import { ICache } from './ICache';
import Debug from 'debug';

const debug = Debug('layer-cache:nonserializing');

type FillFunction = (key: string) => Promise<string>

type NonSerializingCacheConstructor = new (cache: ICache, fillFn: FillFunction) => ICache;

class NonSerializingCacheImpl implements ICache {
    cache: ICache
    fillFn: FillFunction

    constructor(cache: ICache, fillFn: FillFunction) {
        this.cache = cache;
        this.fillFn = fillFn;
    }

    async get(key: string): Promise<string> {
        debug("Getting '%s'", key);
        let result = await this.cache.get(key);
        if (result === undefined) {
            try {
                result = await this.fillFn(key);
            } catch (err) {
                debug("Fill '%s' failed", key);
                throw err;
            }

            try {
                await this.cache.set(key, result);
                debug("Storing '%s' successful", key);
            } catch (err) {
                debug("Storing '%s' failed: %s", key);
                throw err;
            }
        }

        debug("Get '%s' successful", key);
        return result;
    }

    async set(key: string, value: string): Promise<void> {
        throw new Error("Set is not implemented")
    }

    del(key: string): Promise<void> {
        debug("Deleting '%s'", key);
        return this.cache.del(key);
    }
}

export const NonSerializingCache: NonSerializingCacheConstructor = NonSerializingCacheImpl;
