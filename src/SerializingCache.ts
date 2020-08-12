import { ICache } from './ICache';
import Debug from 'debug';

const debug = Debug('layer-cache:serializing');

/* tslint:disable:max-classes-per-file */

enum RequestType {
    GET = 'get',
    DELETE = 'del'
}

interface Request {
    type: RequestType
    resolve: (value?: any) => any
    reject: (err: Error) => any
}

class Entry {
    private requests: Request[]
    constructor(requests: Request[]) {
        this.requests = requests;
    }

    get length(): number {
        return this.requests.length;
    }

    push(request: Request) {
        this.requests.push(request);
    }

    detach() {
        const requests = this.requests;
        this.requests = [];
        return requests;
    }
}

type FillFunction = (key: string) => Promise<string>

type SerializingCacheConstructor = new (cache: ICache, fillFn: FillFunction) => ICache;

class SerializingCacheImpl implements ICache {
    cache: ICache
    fillFn: FillFunction
    entries: Record<string, Entry>

    constructor(cache: ICache, fillFn: FillFunction) {
        this.cache = cache;
        this.fillFn = fillFn;

        this.entries = {};
    }

    get(key: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const request: Request = { type: RequestType.GET, resolve, reject };
            const entry = this.entries[key];
            if (!entry) {
                debug("Get '%s' started", key);
                this.entries[key] = new Entry([request]);
                this.__run(key);
            } else {
                debug("Get '%s' queued (%d)", key, entry.length);
                entry.push(request);
            }
        });
    }

    async set(key: string, value: string): Promise<void> {
        throw new Error("Set is not implemented")
    }

    del(key: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const request: Request = { type: RequestType.DELETE, resolve, reject };
            const entry = this.entries[key];

            if (!entry) {
                debug("Delete '%s' started", key);
                this.entries[key] = new Entry([request]);
                this.__run(key);
            } else {
                debug("Delete '%s' queued", key);
                entry.push(request);
            }
        });
    }

    __run(key: string) {
        const entry = this.entries[key];

        const requests = entry.detach();

        const gets = requests.filter((request) => request.type === RequestType.GET);
        const deletes = requests.filter((request) => request.type === RequestType.DELETE);

        let root = Promise.resolve();

        if (deletes.length > 0) {
            root = root.then(() => {
                debug("Deleting '%s'", key);
                return this.cache.del(key).then(() => {
                    debug("Delete '%s' successful", key);
                    deletes.forEach(request => request.resolve());
                }).catch((err) => {
                    debug("Delete '%s' failed", key);
                    deletes.forEach(request => request.reject(err));
                });
            })
        }

        if (gets.length > 0) {
            root = root.then(() => {
                debug("Getting '%s'", key);
                return this.__query(key).then((result) => {
                    debug("Get '%s' successful", key);
                    gets.forEach(request => request.resolve(result));
                }).catch((err) => {
                    debug("Get '%s' failed", key);
                    gets.forEach(request => request.reject(err));
                });
            });
        }

        root.catch(() => { /* */ }).then(() => {
            if (entry.length > 0) {
                debug("Entry '%s' has new requests, restarting", key);
                this.__run(key);
            } else {
                debug("Entry '%s' is empty.", key);
                delete this.entries[key];
            }
        });
    }

    async __query(key: string): Promise<string> {
        let result = await this.cache.get(key);
        if (result !== undefined) {
            return result;
        }

        debug("Cache returned no result for '%s', filling...", key);
        try {
            result = await this.fillFn(key);
            debug("Fill '%s' successful", key);
        } catch (err) {
            debug("Fill '%s' failed", key);
            throw err;
        }

        try {
            await this.cache.set(key, result);
            debug("Storing '%s' successful", key);
        } catch (err) {
            debug("Storing '%s' failed", key);
            throw err;
        }

        return result;
    }
}

export const SerializingCache: SerializingCacheConstructor = SerializingCacheImpl;
