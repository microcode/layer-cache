import { ICache } from '../ICache';

interface DelayedCacheOptions {
    get?: number
    set?: number
    del?: number
}

function delay(timeout: number) {
    return new Promise((resolve) => setTimeout(resolve, timeout));
}

export class DelayedCache implements ICache {
    cache: ICache
    options: DelayedCacheOptions

    constructor(cache: ICache, options: DelayedCacheOptions) {
        this.cache = cache;
        this.options = Object.assign({
            get: 0,
            set: 0,
            del: 0
        }, options);
    }

    async get(key: string): Promise<string> {
        await delay(this.options.get);
        return this.cache.get(key);
    }

    async set(key: string, value: string): Promise<void> {
        await delay(this.options.set);
        return this.cache.set(key, value);
    }

    async del(key: string): Promise<void> {
        await delay(this.options.del);
        return this.cache.del(key);
    }
}
