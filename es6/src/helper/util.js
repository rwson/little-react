import * as lodash from "lodash";

function makeArray(obj, flat = false) {
    let res = [];
    for (let i in obj) {
        if (hasOwnProperty(obj, i)) {
            res.push(obj[i]);
        }
    }
    return flat ? flatMap(res) : res;
}

function hasOwnProperty(obj, key) {
    return obj.hasOwnProperty(key);
}

function defineProperty(obj, key, descriptor) {
    return Object.defineProperty(obj, key, descriptor)
}

function uuid() {
    return `${Math.random().toString(36)}-${new Date().getTime().toString(36)}`;
}

function flatMap(arr) {
    let res = [];
    deepEach(arr, (item, index, array) => {
        res.push(item);
    });
    return res;
}

function deepEach(array, callback) {
    array.forEach((item, index, array) => {
        if (lodash.isArray(item)) {
            deepEach(item, callback);
        } else {
            callback(item, index, array);
        }
    });
}

function noop() {}

export {
    makeArray,
    hasOwnProperty,
    defineProperty,
    uuid,
    noop
}