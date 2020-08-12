import { ICache } from './ICache';
import LRUCache from 'lru-cache';
import Debug from 'debug';

const debug = Debug('layer-cache:memory');

interface MemoryCacheOptions {
    max?: number
    maxAge?: number
}

type MemoryCacheConstructor = new (options?: MemoryCacheOptions) => ICache;

class MemoryCacheImpl implements ICache {
    lru: LRUCache<string,string>

    constructor(options?: MemoryCacheOptions) {
        options = Object.assign({
            max: 64,
            maxAge: 1000 * 60 * 5
        }, options);

        this.lru = new LRUCache(options);
    }

    async get(key: string) {
        debug('get %s', key);
        return this.lru.get(key);
    }

    async set(key: string, value: string) {
        debug('set %s', key);
        this.lru.set(key, value);
    }

    async del(key: string) {
        debug('del %s', key);
        this.lru.del(key);
    }
}

export const MemoryCache: MemoryCacheConstructor = MemoryCacheImpl;