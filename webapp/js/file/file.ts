///<reference path="./../../../types/all.d.ts" />

import Q = require("q");

export interface AnnotaldFile {
    write (content : string) : Q.Promise<void>;
    serialize () : Object;
    fileType : string;
    read () : Q.Promise<string>;
}

export interface IFilePrompt {
    prompt () : Q.Promise<AnnotaldFile>;
}

var fileTypeRegistry : { [key : string] : (params : any) => AnnotaldFile } = {};

export function registerFileType (type : string,
                                  cls : (params : any) => AnnotaldFile)
: void {
    fileTypeRegistry[type] = cls;
}

export function reconstituteFile (type : string, params : any) : AnnotaldFile {
    return fileTypeRegistry[type](params);
}
