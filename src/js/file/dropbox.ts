///<reference path="./../../../types/all.d.ts" />

/* tslint:disable:variable-name */

import file = require("./file");
import recent = require("./recent");

import Q = require ("q");
var DropboxCore = require("../ext/dropbox");
import notify = require("../ui/log");
import compat = require("../compat");
var $ = compat.$;

declare var Dropbox;

var client = new DropboxCore.Client({ key: "rw6m6r2gi34luhp" });
client.authDriver(new DropboxCore.AuthDriver.Popup(
    { receiverUrl : "https://s3.amazonaws.com/annotald.com/go/oauth_receiver.html" }));

export class DropboxFile implements file.AnnotaldFile {
    private path : string;
    private content : string;
    fileType : string = "Dropbox";

    constructor (params : any) {
        this.path = params.path;
        this.content = params.content;
    }

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

    write (s : string) : Q.Promise<void> {
        var deferred = Q.defer<void>();
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
                    deferred.resolve(undefined);
                }
            });
        });
        recent.recordFileAccess(this);
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
        recent.recordFileAccess(this);
        return deferred.promise;
    }
}
file.registerFileType("Dropbox",
                      (params : any) : file.AnnotaldFile => new DropboxFile(params));
