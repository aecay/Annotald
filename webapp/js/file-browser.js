/*global exports: true, require: false */

var Q = require("q"),
    idb = require("./idb");

function onUpgradeNeeded (event) {
    var db = event.target.result;
    db.createObjectStore("files", { keyPath: "path" });
}

exports.readFile = function readFileBrowser (path) {
    // TODO: use file api where supported
    var db = idb.getDB("Annotald Files", 1, onUpgradeNeeded);

    return db.then(function (db) {
        var deferred = Q.defer();
        var request = db.transaction("files").objectStore("files").get(path);

        request.onsuccess = function (event) {
            deferred.resolve({content: event.target.result.content,
                              path: path });
        };
        // TODO: error handling
        return deferred.promise;
    });
};

exports.writeFile = function writeFileBrowser (path, content) {
    var db = idb.getDB();

    return db.then(function (db) {
        var deferred = Q.defer();

        var request = db.transaction("files", "readwrite").objectStore("files").put(
            { path: path,
              content: content });
        request.onsuccess = function () {
            deferred.resolve(true);
        };
        // TODO: error handling
        return deferred.promise;
    });
};
