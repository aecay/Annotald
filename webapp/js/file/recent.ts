///<reference path="./../../../types/all.d.ts" />

import file = require("./file");
import _ = require("lodash");
var db = require("../db");

export function recordFileAccess (file : file.AnnotaldFile) : void {
    var record = { fileType: file.fileType, params: file.serialize() };
    db.get("recentFiles", []).done(
        function (rf : { fileType: string; params: any; }[]) : Q.Promise<void> {
            rf.push(record);
            if (rf.length > 5) {
                rf = rf.slice(0, 5);
            }
            return db.put("recentFiles", rf);
        });
}

export function getRecentFiles ()
: Q.Promise<{ fileType: string; params: any; }[]> {
    return db.get("recentFiles", []);
}
