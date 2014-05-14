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

exports.put = function (key, val) {
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
