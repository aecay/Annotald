///<reference path="./../../../types/all.d.ts" />

/* tslint:disable:quotemark */

import file = require("./file");

import Q = require ("q");
var vex = require("vex");
import recent = require("./recent");
var db = require("../db");

// TODO: factor these out into a util library
export function listFiles () : Q.Promise<string[]> {
    return db.get("files").then((x : {[key : string] : string}) : string[] => {
        return Object.keys(x);
    });
}

export function readFile (name : string) : Q.Promise<string> {
    return db.get("files").then((x : {[key : string] : string}) : string => {
        return x[name];
    });
}

export class LocalFile implements file.AnnotaldFile {
    private name : string;
    fileType : string = "Local";

    constructor (params : any) {
        this.name = params.name;
    }

    static prompt () : Q.Promise<LocalFile> {
        var deferred = Q.defer<LocalFile>();
        var that = this;

        function dialog2Cb (fileText : string) : void {
            var name =  (<HTMLInputElement>
                         document.getElementById(
                             "file-name-input")).value;
            db.get("files", {}).then(function (files : any) : void {
                files[name] = fileText;
                db.put("files", files).then(function () : void {
                    deferred.resolve(new that({
                        name: name
                    }));
                });
            });
        }

        function fileReaderCb (event : any) : void {
            vex.dialog.open({ message: "Please name this file",
                              input: '<div class="vex-custom-field-wrapper"><label' +
                              ' for="name">Name</label><div' +
                              ' class="vex-custom-input-wrapper">' +
                              '<input name="name"' +
                              ' type="text" id="file-name-input"/></div></div>',
                              callback: dialog2Cb.bind(null, event.target.result),
                              buttons: [{text: "OK", type: "submit"}]});
        }

        function dialog1Cb () : void {
            var files = (<HTMLInputElement>
                             document.getElementById(
                                 "local-file-input")).files;
            if (files.length === 0) {
                deferred.reject("no file selected");
                return;
            }
            var file = files[0];
            var fr = new FileReader();
            fr.onload = fileReaderCb;
            // TODO: error handling
            fr.readAsText(file);
        }

        vex.dialog.open({ message: "Please choose a file",
                          input: '<div class="vex-custom-field-wrapper"><label' +
                          ' for="file">File</label><div' +
                          ' class="vex-custom-input-wrapper"><input name="file"' +
                          ' type="file" id="local-file-input"/></div></div>',
                          callback: dialog1Cb,
                          buttons: [{text: "OK", type: "submit"}]});
        return deferred.promise;
    }

    serialize () : Object {
        return {
            name: this.name
        };
    }

    write (s : string) : Q.Promise<void> {
        recent.recordFileAccess(this);
        return db.get("files", {}).then((files : any) : Q.Promise<boolean> => {
            files[this.name] = s;
            return db.put("files", files);
        });
    }

    read () : Q.Promise<string> {
        recent.recordFileAccess(this);
        return db.get("files", {}).then(
            (files : any) : string => files[this.name]);
    }
}
file.registerFileType("Local",
                      (params : any) : file.AnnotaldFile => new LocalFile(params));
