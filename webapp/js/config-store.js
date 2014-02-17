/*global require: false, exports: true */

var localForage = require("localforage");

exports.listConfigs = function listConfigs () {
    return localForage.getItem("configs");
};

exports.setConfig = function setConfig (name, value) {
    return localForage.getItem("configs").then(function (configs) {
        configs[name] = value;
        return localForage.setItem("configs", configs);
    });
};

exports.getConfig = function getConfig (name) {
    return localForage.getItem("configs").then(function (configs) {
        return configs[name];
    });
};

exports.deleteConfig = function deleteConfig (name) {
    return localForage.getItem("configs").then(function (configs) {
        configs[name] = undefined;
        return localForage.setItem("configs", configs);
    });
};
