///<reference path="./../../../types/all.d.ts" />

var parser = require("../parse");
var logger = require("../ui/log");
var lastSavedState : string = require("./global").lastSavedState;
import $ = require("jquery");

var saveInProgress : boolean = false;
// TODO: get a proper promise type
var savePromise : (x : string) => { then : Function };

export function save(e : Event, extraArgs? : any) : void {
    if (!extraArgs) {
        extraArgs = {};
    }
    if (document.getElementById("leafphrasebox") ||
        document.getElementById("labelbox")) {
        // It should be impossible to trigger a save in these conditions, but
        // it causes data corruption if the save happens,, so this functions
        // as a last-ditch safety.
        logger.error("Cannot save while editing a node label.");
        return;
    }
    if (!saveInProgress) {
        logger.notice("Saving...");
        saveInProgress = true;
        savePromise(parser.parseHtmlToXml($("#sn0"))).then(function () : void {
            logger.notice("Save success");
            saveInProgress = false;
            lastSavedState = $("#editpane").html();
        }, function (err : any) : void {
            logger.error("Save error: " + err);
            saveInProgress = false;
        });
    }
};
