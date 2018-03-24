const { BaseCache } = require('./base');
const debug = require('debug')('layer-cache:serializing');

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
                debug("Get '%s' started", key);
                this.entries[key] = new Entry([new Request(GET, resolve, reject)]);
                this.__run(key);
            } else {
                debug("Get '%s' queued (%d)", key, entry.requests.length);
                entry.requests.push(new Request(GET, resolve, reject));
            }
        });
    }

    del(key) {
        return new Promise((resolve, reject) => {
            let entry = this.entries[key];
            if (!entry) {
                debug("Delete '%s' started", key);
                this.entries[key] = new Entry([new Request(DELETE, resolve, reject)]);
                this.__run(key);
            } else {
                debug("Delete '%s' queued", key);
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
                return this.__query(key).then((result) => {
                    debug("Get '%s' successful", key);
                    gets.forEach(request => request.resolve(result));
                }).catch((err) => {
                    debug("Get '%s' failed", key);
                    gets.forEach(request => request.reject(err));
                });
            });
        }

        root.catch(() => {}).then(() => {
            if (entry.requests.length > 0) {
                debug("Entry '%s' has new requests, restarting", key);
                this.__run(key);
            } else {
                debug("Entry '%s' is empty.", key);
                delete this.entries[key];
            }
        });
    }

    __query(key) {
        return this.cache.get(key).then((result) => {
            if (result !== undefined) {
                return result;
            }

            debug("Cache returned no result for '%s', filling...", key);
            return this.fill(key).then((result) => {
                debug("Fill '%s' successful", key);
                return this.cache.set(key, result).then(() => {
                    debug("Storing '%s' successful", key);
                    return result;
                }).catch((err) => {
                    debug("Storing '%s' failed", key);
                    throw err;
                });
            }).catch((err) => {
                debug("Fill '%s' failed", key);
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
        debug("Getting '%s'", key);
        return this.cache.get(key).then((result) => {
            if (result === undefined) {
                return this.fill(key).then((result) => {
                    debug("Fill '%s' successful", key);
                    return this.cache.set(key, result).then(() => {
                        debug("Storing '%s' successful", key);
                        return result;
                    }).catch((err) => {
                        debug("Storing '%s' failed", key);
                        throw err;
                    });
                }).catch((err) => {
                    debug("Fill '%s' failed", key);
                    throw err;
                });
            }

            debug("Get '%s' successful", key);
            return result;
        });
    }

    del(key) {
        debug("Deleting '%s'", key);
        return this.cache.del(key);
    }
}


exports.SerializingCache = SerializingCache;
exports.NonSerializingCache = NonSerializingCache;

