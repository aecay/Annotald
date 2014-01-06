/*global require: false, exports: true */

var idb = require("./idb"),
    Q = require("q");

function onUpgradeNeeded (event) {
    var db = event.target.result;
    db.createObjectStore("configs", { keyPath: "name" });
}

exports.listConfigs = function listConfigs () {
    var db = idb.getDB("Annotald Configs", 1, onUpgradeNeeded);
    return db.then(function(db) {
        var deferred = Q.defer(),
            results = [],
            trans = db.transaction("configs").objectStore("configs").openCursor();
        trans.onsuccess = function (event) {
            var cursor = event.target.result;
            if (cursor) {
                results.unshift(cursor.value);
                cursor.continue();
            } else {
                deferred.resolve(results);
            }
        };
        trans.onerror = function (error) {
            deferred.reject(error);
        };
        return deferred.promise;
    });
};

exports.setConfig = function setConfig (name, value) {
    var db = idb.getDB("Annotald Configs", 1, onUpgradeNeeded);
    return db.then(function(db) {
        var deferred = Q.defer();
        var trans = db.transaction("configs","readwrite").objectStore("configs").
            put({ name: name,
                  value: value });
        trans.onsuccess = function () {
            deferred.resolve(true);
        };
        trans.onerror = function (err) {
            deferred.reject(err);
        };
        return deferred.promise;
    });
};

exports.getConfig = function getConfig (name) {
    var db = idb.getDB("Annotald Configs", 1, onUpgradeNeeded);
    return db.then(function (db) {
        var deferred = Q.defer(),
            trans = db.transaction("configs").objectStore("configs").get(name);
        trans.onsuccess = function (event) {
            deferred.resolve(event.target.result.value);
        };
        trans.onerror = function (error) {
            deferred.reject(error);
        };
        return deferred.promise;
    });
};

exports.deleteConfig = function deleteConfig (name) {
    var db = idb.getDB("Annotald Configs", 1, onUpgradeNeeded);
    return db.then(function (db) {
        var deferred = Q.defer(),
            trans = db.transaction("configs", "readwrite").objectStore("configs").
                delete(name);
        trans.onsuccess = function () {
            deferred.resolve(true);
        };
        trans.onerror = function (error) {
            deferred.reject(error);
        };
        return deferred.promise;
    });
};
