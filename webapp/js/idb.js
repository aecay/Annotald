/*global exports: true, require: false */

var Q = require("q");

function onError (event) {
    throw "IDB error: " + event.target.errorCode;
}

exports.getDB = function getDB (name, version, upgrade) {
    var deferred = Q.defer()
    , idb = window.indexedDB
    , db = idb.open(name, version);

    db.onerror = onError;
    db.onupgradeneeded = upgrade;
    db.onsuccess = function (event) {
        deferred.resolve(event.target.result);
    };

    return deferred.promise;
};
