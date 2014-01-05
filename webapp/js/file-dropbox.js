/*global require: false, exports: true, Dropbox: false */

var Q = require ("q"),
    Dropbox_core = require("./dropbox"),
    notify = require("./ui-log"),
    $ = require("jquery");

var client = new Dropbox_core.Client({ key: "rw6m6r2gi34luhp" });
client.authDriver(new Dropbox_core.AuthDriver.Popup(
    {receiverUrl:"/html/oauth_receiver.html"}));

exports.writeFile = function writeFileDropbox (path, content) {
    var deferred = Q.defer();
    client.authenticate(function (error, client) {
        if (error) {
            notify.error("Error authenticating to Dropbox: " + error);
            deferred.reject(error);
            return;
        }
        client.writeFile(path, content, function (error, stat) {
            if (error) {
                notify.error("Error saving file to Dropbox: " + error);
                deferred.reject();
            } else {
                notify.notice("File saved to Dropbox");
                deferred.resolve(true);
            }
        });
    });
    return deferred.promise;
};

exports.readFile = function readFileDropbox (path) {
    var deferred = Q.defer();
    if (path !== undefined && path) {
        client.authenticate(function (error, client) {
            if (error) {
                notify.error("Error authenticating to Dropbox: " + error);
                deferred.reject(error);
                return;
            }
            client.read(path, function (error, data) {
                if (error) {
                    notify.error("Error reading file from Dropbox: " + error);
                    deferred.reject();
                } else {
                    deferred.resolve(data);
                }
            });
        });
    } else {
        Dropbox.choose({
            success: function (files) {
                Q($.ajax(files[0].link)).then(function (result) {
                    deferred.resolve({ content: result,
                                       path: files[0].name });
                }, function (error) {
                    deferred.reject(error);
                });
            },
            cancel: function () {
                deferred.reject("user canceled");
            },
            linktype: "direct",
            multiselect: false,
            extensions: ['.psdx']
        });
    }
    return deferred.promise;
};
