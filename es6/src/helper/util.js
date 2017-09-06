function makeArray(obj) {
    let res = [];
    for (let i in obj) {
        if (hasOwnProperty(obj, i)) {
            res.push(obj[i]);
        }
    }
    return res;
}

function hasOwnProperty(obj, key) {
    return obj.hasOwnProperty(key);
}

function noop() {}

export {
    makeArray,
    hasOwnProperty,
    noop
}