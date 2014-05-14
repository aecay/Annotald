/*global require: false, exports: true */

var level = require("level-browserify");
var Q = require("q");

var db = level("annotald-config");

function parse (x) {
    try {
        x = JSON.parse(x);
    } catch (e) {
        x = {};
    }
    return x;
}

exports.listConfigs = function listConfigs () {
    var d = Q.defer();
    db.get("configs", function (err, x) {
        if (err) {
            d.resolve({});
        } else {
            d.resolve(parse(x));
        }
    });
    return d.promise;
};

exports.setConfig = function setConfig (name, value) {
    var d = Q.defer();
    db.get("configs", function (err, configs) {
        if (err) {
            configs = "{}";
        }
        configs = parse(configs);
        configs[name] = value;
        db.put("configs", JSON.stringify(configs), function (err) {
            if (err) {
                d.reject(err);
            } else {
                d.resolve();
            }
        });
    });
    return d.promise;
};

exports.getConfig = function getConfig (name) {
    var d = Q.defer();
    db.get("configs", function (err, configs) {
        d.resolve(configs && parse(configs)[name]);
    });
    return d.promise;
};

exports.deleteConfig = function deleteConfig (name) {
    var d = Q.defer();
    db.get("configs", function (err, configs) {
        if (err || !configs) {
            d.resolve();
        }
        configs = parse(configs);
        delete configs[name];
        db.put("configs", JSON.stringify(configs), function (err) {
            if (err) {
                d.reject(err);
            } else {
                d.resolve();
            }
        });
    });
    return d.promise;
};

exports.getLastConfig = function () {
    var d = Q.defer();
    db.get("lastConfig", function (err, lc) {
        d.resolve(lc);
    });
    return d.promise;
};

exports.setLastConfig = function (val) {
    var d = Q.defer();
    db.put("lastConfig", val, function (err) {
        if (err) {
            d.reject(err);
        } else {
            d.resolve();
        }
    });
    return d.promise;
};
