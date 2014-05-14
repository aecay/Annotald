///<reference path="./../../../types/all.d.ts" />

/* tslint:disable:quotemark */

import file = require("./file");
import recent = require("./recent");
import Q = require("q");
var vex = require("vex");
import fs = require("fs");

interface File {
    path: string;
}

export interface NwFileParams {
    path: string;
    content?: string;
}

export class NwFile implements file.AnnotaldFile {
    private path;
    private content;
    fileType = "NW";

    constructor (params : NwFileParams) {
        this.path = params.path;
        this.content = params.content;
    }

    static prompt () : Q.Promise<NwFile> {
        var that = this;
        var deferred = Q.defer<NwFile>();
        vex.dialog.open({ message: "Please choose a file",
                          input: '<div class="vex-custom-field-wrapper"><label' +
                          ' for="file">File</label><div' +
                          ' class="vex-custom-input-wrapper"><input name="file"' +
                          ' type="file" id="local-file-input"/></div></div>',
                          callback: function () : void {
                              var file = (<HTMLInputElement>
                                          document.getElementById(
                                              "local-file-input")).
                                  files[0],
                              fr = new FileReader();
                              fr.onload = function (event : any) : void {
                                  // TODO: path
                                  deferred.resolve(new that({
                                      path: file["path"],
                                      content: event.target.result
                                  }));
                              };
                              // TODO: error handling
                              fr.readAsText(file);
                          },
                          buttons: [{text: "OK", type: "submit"}]});
        return deferred.promise;
    }

    serialize () : Object {
        return {
            // TODO
            // path : this.path
        };
    }

    write (s : string) : Q.Promise<void> {
        var deferred = Q.defer<void>();
        fs.writeFile(this.path, s, null, function (err : any) : void {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(undefined);
            }
        });
        recent.recordFileAccess(this);
        return deferred.promise;
    }

    read () : Q.Promise<string> {
        var deferred = Q.defer<string>();
        if (this.content) {
            deferred.resolve(this.content);
        } else {
            fs.readFile(this.path, null, function (err : any, data : string) : void {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(data);
                }
            });
        }
        recent.recordFileAccess(this);
        return deferred.promise;
    }
}
file.registerFileType("NW",
                      (params : any) : file.AnnotaldFile => new NwFile(params));
