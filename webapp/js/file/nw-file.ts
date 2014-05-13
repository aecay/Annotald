///<reference path="./../../../types/all.d.ts" />

/* tslint:disable:quotemark */

import file = require("./file");
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

export class NwFile implements file.File {
    private path;
    private content;

    constructor (params : NwFileParams) {
        this.path = params.path;
        this.content = params.content;
    }

    /* tslint:disable:no-unused-variable */
    static fileType = "NW";
    /* tslint:enable:no-unused-variable */

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

    write (s : string) : Q.Promise<boolean> {
        var deferred = Q.defer<boolean>();
        fs.writeFile(this.path, s, null, function (err : any) : void {
            if (err) {
                deferred.resolve(false);
            } else {
                deferred.resolve(true);
            }
        });
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
        return deferred.promise;
    }
}
