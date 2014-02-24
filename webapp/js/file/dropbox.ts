///<reference path="./../../../types/all.d.ts" />

/* tslint:disable:variable-name */

import file = require("./file");

import Q = require ("q");
var DropboxCore = require("../ext/dropbox");
var notify = require("../ui/log");
import $ = require("jquery");

declare var Dropbox;

var client = new DropboxCore.Client({ key: "rw6m6r2gi34luhp" });
client.authDriver(new DropboxCore.AuthDriver.Popup(
    { receiverUrl : "/html/oauth_receiver.html" }));

export class DropboxFile implements file.File {
    private path;
    private content;

    constructor (params : any) {
        this.path = params.path;
        this.content = params.content;
    }

    /* tslint:disable:no-unused-variable */
    static fileType = "Dropbox";
    /* tslint:enable:no-unused-variable */

    static prompt (allowedExtensions : string[] = [".psdx"]) :
    Q.Promise<DropboxFile> {
        var that = this;
        var deferred = Q.defer<DropboxFile>();
        Dropbox.choose({
            success: function (files : any) : void {
                Q($.ajax(files[0].link)).then(
                    function (result : any) : void {
                        deferred.resolve(new that({ content: result,
                                                    path: files[0].name }));
                    }, function (error : any) : void {
                        deferred.reject(error);
                    });
            },
            cancel: function () : void {
                deferred.reject("user canceled");
            },
            linkType: "direct",
            multiselect: false,
            extensions: allowedExtensions
        });
        return deferred.promise;
    }

    serialize () : Object {
        return {
            path : this.path
        };
    }

    write (s : string) : Q.Promise<boolean> {
        var deferred = Q.defer<boolean>();
        client.authenticate(function (error : any, client : any) : void {
            if (error) {
                notify.error("Error authenticating to Dropbox: " + error);
                deferred.reject(error);
                return;
            }
            client.writeFile(this.path, s, function (error : any /*, stat*/) : void {
                if (error) {
                    notify.error("Error saving file to Dropbox: " + error);
                    deferred.reject(error);
                } else {
                    notify.notice("File saved to Dropbox");
                    deferred.resolve(true);
                }
            });
        });
        return deferred.promise;
    }

    read () : Q.Promise<string> {
        var deferred = Q.defer<string>();
        if (this.content) {
            deferred.resolve(this.content);
        } else {
            var that = this;
            client.authenticate(function (error : any, client : any) : void {
                if (error) {
                    notify.error("Error authenticating to Dropbox: " + error);
                    deferred.reject(error);
                    return;
                }
                client.readFile(that.path, function (error : any,
                                                     data : any) : void {
                    if (error) {
                        notify.error("Error reading file from Dropbox: " + error);
                        deferred.reject(error);
                    } else {
                        deferred.resolve(data);
                    }
                });
            });
        }
        return deferred.promise;
    }
}