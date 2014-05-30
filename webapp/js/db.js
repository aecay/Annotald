/*global require: false, exports: true */

var level = require("level-browserify");
var Q = require("q");

var db = level("annotald");

exports.get = function (key, def) {
    var d = Q.defer();
    db.get(key, function (err, val) {
        if (err) {
            if (typeof def !== "undefined") {
                d.fulfill(def);
            } else {
                d.reject(err);
            }
        } else {
            d.fulfill(JSON.parse(val));
        }
    });
    return d.promise;
};

var put = exports.put = function (key, val) {
    var d = Q.defer();
    db.put(key, JSON.stringify(val), function (err) {
        if (err) {
            d.reject(err);
        } else {
            d.fulfill();
        }
    });
    return d.promise;
};

exports.deleteIn = function (path, key) {
    var d = Q.defer();
    db.get(path, function (err, val) {
        if (err) {
            d.fulfill();
        } else {
            var v = JSON.parse(val);
            delete v[key];
            put(path, v).then(function () {
                d.fulfill();
            });
        }
    });
    return d.promise;
};

exports.setIn = function (path, key, value) {
    var d = Q.defer();
    db.get(path, function (err, res) {
        var v;
        if (err) {
            v = {};
        } else {
            v = JSON.parse(res);
        }
        v[key] = value;
        put(path, v).then(function () {
            d.fulfill();
        });
    });
    return d.promise;
};
