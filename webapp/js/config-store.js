/*global require: false, exports: true */

var Q = require("q");

var db = require("./db");

exports.listConfigs = function listConfigs () {
    return db.get("configs", {});
};

exports.setConfig = function setConfig (name, value) {
    return db.get("configs", {}).then(function (configs) {
        configs[name] = value;
        return db.put("configs", configs);
    });
};

exports.getConfig = function getConfig (name) {
    return db.get("configs", {}).then(function (configs) {
        return configs && configs[name];
    });
};

exports.deleteConfig = function deleteConfig (name) {
    return db.get("configs", {}).then(function (configs) {
        delete configs[name];
        return db.put("configs", configs);
    });
};

exports.getLastConfig = function () {
    return db.get("lastConfig");
};

exports.setLastConfig = function (val) {
    return db.put("lastConfig", val);
};
