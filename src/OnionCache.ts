import { ICache } from './ICache';
import Debug from 'debug';

const debug = Debug('layer-cache:onion');

type OnionCacheConstructor = new (...caches: ICache[]) => ICache;

class OnionCacheImpl implements ICache {
    caches: ICache[]
    constructor(...caches: ICache[]) {
        this.caches = caches;
    }

    async get(key: string): Promise<string> {
        debug('get %s', key);
        return this.__get(key, 0);
    }

    private async __get(key: string, index: number): Promise<string> {
        if (index >= this.caches.length) {
            return undefined;
        }

        const cache = this.caches[index];
        const result = await cache.get(key);

        if (!result) {
            return this.__get(key, index + 1);
        }

        await this.__update(key, result, index - 1);
        return result;
    }

    private async __update(key: string, value: string, index: number): Promise<void> {
        if (index < 0) {
            return;
        }

        const cache = this.caches[index];
        await cache.set(key, value);
        return this.__update(key, value, index - 1);
    }

    async set(key: string, value: string): Promise<void> {
        debug('set %s', key);
        return this.__set(key, value, 0);
    }

    private async __set(key: string, value: string, index: number): Promise<void> {
        if (index >= this.caches.length) {
            return;
        }

        const cache = this.caches[index];
        await cache.set(key, value);

        return this.__set(key, value, index + 1);
    }

    async del(key: string): Promise<void> {
        debug('del %s', key);
        return this.__del(key, 0);
    }

    private async __del(key: string, index: number): Promise<void> {
        if (index >= this.caches.length) {
            return;
        }

        const cache = this.caches[index];
        await cache.del(key);
        return this.__del(key, index + 1);
    }
}

export const OnionCache: OnionCacheConstructor = OnionCacheImpl;