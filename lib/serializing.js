const { BaseCache } = require('./base');
const log = require('@microcode/debug-ng')('layer-cache:serializing');

const GET = 'get';
const DELETE = 'del';

class Entry {
    constructor(requests) {
        this.requests = requests;
    }

    push(request) {
        this.requests.push(request);
    }

    detach() {
        const requests = this.requests;
        this.requests = [];
        return requests;
    }
}

class Request {
    constructor(type, resolve, reject) {
        this.type = type;
        this.resolve = resolve;
        this.reject = reject;
    }
}

class SerializingCache extends BaseCache {
    constructor(cache, fill) {
        super();

        this.cache = cache;
        this.fill = fill;

        this.entries = {};
    }

    get(key) {
        return new Promise((resolve, reject) => {
            let entry = this.entries[key];
            if (!entry) {
                log.trace("Get '%s' started", key);
                this.entries[key] = new Entry([new Request(GET, resolve, reject)]);
                this.__run(key);
            } else {
                log.trace("Get '%s' queued (%d)", key, entry.requests.length);
                entry.requests.push(new Request(GET, resolve, reject));
            }
        });
    }

    del(key) {
        return new Promise((resolve, reject) => {
            let entry = this.entries[key];
            if (!entry) {
                log.trace("Delete '%s' started", key);
                this.entries[key] = new Entry([new Request(DELETE, resolve, reject)]);
                this.__run(key);
            } else {
                log.trace("Delete '%s' queued", key);
                entry.requests.push(new Request(DELETE, resolve, reject));
            }
        });
    }

    __run(key) {
        const entry = this.entries[key];

        const requests = entry.detach();

        const gets = requests.filter((request) => request.type === GET);
        const deletes = requests.filter((request) => request.type === DELETE);

        let root = Promise.resolve();

        if (deletes.length > 0) {
            root = root.then(() => {
                log.trace("Deleting '%s'", key);
                return this.cache.del(key).then(() => {
                    log.trace("Delete '%s' successful", key);
                    deletes.forEach(request => request.resolve());
                }).catch((err) => {
                    log.trace("Delete '%s' failed", key);
                    deletes.forEach(request => request.reject(err));
                });
            })
        }

        if (gets.length > 0) {
            root = root.then(() => {
                return this.__query(key).then((result) => {
                    log.trace("Get '%s' successful", key);
                    gets.forEach(request => request.resolve(result));
                }).catch((err) => {
                    log.trace("Get '%s' failed", key);
                    gets.forEach(request => request.reject(err));
                });
            });
        }

        root.catch(() => {}).then(() => {
            if (entry.requests.length > 0) {
                log.trace("Entry '%s' has new requests, restarting", key);
                this.__run(key);
            } else {
                log.trace("Entry '%s' is empty.", key);
                delete this.entries[key];
            }
        });
    }

    __query(key) {
        return this.cache.get(key).then((result) => {
            if (result !== undefined) {
                return result;
            }

            log.trace("Cache returned no result for '%s', filling...", key);
            return this.fill(key).then((result) => {
                log.trace("Fill '%s' successful", key);
                return this.cache.set(key, result).then(() => {
                    log.trace("Storing '%s' successful", key);
                    return result;
                }).catch((err) => {
                    log.trace("Storing '%s' failed", key);
                    throw err;
                });
            }).catch((err) => {
                log.error("Fill '%s' failed", key);
                throw err;
            });
        })
    }
}

class NonSerializingCache extends BaseCache {
    constructor(cache, fill) {
        super();

        this.cache = cache;
        this.fill = fill;
    }

    get(key) {
        log.trace("Getting '%s'", key);
        return this.cache.get(key).then((result) => {
            if (result === undefined) {
                return this.fill(key).then((result) => {
                    log.trace("Fill '%s' successful", key);
                    return this.cache.set(key, result).then(() => {
                        log.trace("Storing '%s' successful", key);
                        return result;
                    }).catch((err) => {
                        log.trace("Storing '%s' failed", key);
                        throw err;
                    });
                }).catch((err) => {
                    log.trace("Fill '%s' failed", key);
                    throw err;
                });
            }

            log.trace("Get '%s' successful", key);
            return result;
        });
    }

    del(key) {
        log.trace("Deleting '%s'", key);
        return this.cache.del(key);
    }
}


exports.SerializingCache = SerializingCache;
exports.NonSerializingCache = NonSerializingCache;

