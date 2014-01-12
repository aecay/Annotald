/*global exports: true, require: false */

var parser = require("../parse"),
    logger = require("../ui/log"),
    lastSavedState = require("global").lastSavedState,
    $ = require("jquery");

var saveInProgress = false,
    savePromise;

exports.save = function save(e, extraArgs) {
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
        savePromise(parser.parseHtmlToXml($("#sn0"))).then(function () {
            logger.notice("Save success");
            saveInProgress = true;
        }, function (err) {
            logger.error("Save error: " + err);
            saveInProgress = false;
        });
    }
};
