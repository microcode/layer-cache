class BaseCache {
    get(key) {
        return new Promise((resolve, reject) => {
            reject(new Error("Method 'get' not implememented"))
        });
    }

    set(key, value) {
        return new Promise((resolve, reject) => {
            reject(new Error("Method 'set' not implememented"))
        });
    }

    del(key) {
        return new Promise((resolve, reject) => {
            reject(new Error("Method 'del' not implememented"))
        });
    }
}

exports.BaseCache = BaseCache;
