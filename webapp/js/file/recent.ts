///<reference path="./../../../types/all.d.ts" />

import file = require("./file");

var recentFiles : { fileType: string; params: any; }[] = [];

export function recordFileAccess (type: string, params: any) : void {
    recentFiles.push({ fileType: type, params: params });
}

export class RecentFile {
    // static prompt () : Q.Promise<File> {
    //     // TODO
    // }
}
