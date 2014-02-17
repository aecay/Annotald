///<reference path="./../../../types/all.d.ts" />

/* tslint:disable:quotemark */

import file = require("./file");

import Q = require ("q");
var vex = require("vex");

var saveMsg = "A new tab will open with the contents of the parsed file;" +
        " please use the browser's \"Save As\" feature to save" +
        " the contents of the tab";

export class LocalFile implements file.File {
    private path;
    private content;

    constructor (params : any) {
        this.path = params.path;
        this.content = params.content;
    }

    static fileType = "Local";

    static prompt () : Q.Promise<LocalFile> {
        var deferred = Q.defer<LocalFile>();
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
                                  deferred.resolve(new this({
                                      content: event.target.result
                                  }));
                              };
                              // TODO: error handling
                              fr.readAsText(file);
                              return deferred.promise;
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
        // TODO: add path hint from this.path
        vex.dialog.alert({ message: (saveMsg + "."),
                           callback: function () : void {
                               window.open('data:text/plain,' +
                                           encodeURIComponent(s));
                               deferred.resolve(true);
                           }});
        return deferred.promise;
    }

    read () : Q.Promise<string> {
        var deferred = Q.defer<string>();
        deferred.reject("Cannot read files in the web version");
        return deferred.promise;
    }
}
