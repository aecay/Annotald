/*global exports: true, require: false */

var Q = require("q");

function onError (event) {
    throw "IDB error: " + event.target.errorCode;
}

function onUpgradeNeeded (event) {
    var db = event.target.result;
    db.createObjectStore("files", { keyPath: "path" });
}

function getDB () {
    var deferred = Q.defer()
    , idb = window.indexedDB
    , db = idb.open("Annotald", 1);

    db.onerror = onError;
    db.onupgradeneeded = onUpgradeNeeded;
    db.onsuccess = function (event) {
        deferred.resolve(event.target.result);
    };

    return deferred.promise;
}

exports.readFile = function readFileBrowser (path) {
    // TODO: use file api where supported
    var db = getDB();

    return db.then(function (db) {
        var deferred = Q.defer();
        var request = db.transaction("files").objectStore("files").get(path);

        request.onerror = onError;
        request.onsuccess = function (event) {
            deferred.resolve(event.target.result.content);
        };
        // TODO: error handling
        return deferred.promise;
    });
};

exports.writeFile = function writeFileBrowser (path, content) {
    var db = getDB();

    return db.then(function (db) {
        var deferred = Q.defer();

        var request = db.transaction("files", "readwrite").objectStore("files").put(
            { path: path
            , content: content });
        request.onsuccess = function () {
            deferred.resolve(true);
        };
        // TODO: error handling
        return deferred.promise;
    });
};
