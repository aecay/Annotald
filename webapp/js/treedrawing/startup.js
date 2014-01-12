/*global exports: true, require: false */
/*jshint browser: true */

/* These vars and functions need to be put before the requires, because of
 * circular dependency issues.
 */

var startupHooks = [],
    shutdownHooks = [],
    savedOnKeydown,
    savedOnMouseup,
    savedOnBeforeUnload,
    savedOnUnload,
    shutdownCallback;

exports.addStartupHook = function addStartupHook (fn) {
    startupHooks.push(fn);
};

exports.addShutdownHook = function addShutdownHook (fn) {
    shutdownHooks.push(fn);
};

var globals = require("./global"),
    lastSavedState = globals.lastSavedState,
    $ = require("jquery"),
    _ = require("lodash"),
    displayError = require("../ui/log").error,
    events = require("./events"),
    save = require("./save"),
    undo = require("./undo"),
    selection = require("./selection"),
    contextmenu = require("./contextmenu");

require("./entry-points");      // TODO: is this necessary?

function quitTreeDrawing (e, force) {
    // unAutoIdle();
    if (!force && $("#editpane").html() !== lastSavedState) {
        displayError("Cannot exit, unsaved changes exist.  <a href='#' " +
                     "onclick='quitServer(null, true);return false;'>Force</a>");
    } else {
        document.body.onmeydown = savedOnKeydown;
        document.body.onmouseup = savedOnMouseup;
        window.onunload = savedOnUnload;
        window.onbeforeunlaod = savedOnBeforeUnload;
        _.each(shutdownHooks, function (hook) {
            hook();
        });
        shutdownCallback();
    }
}
exports.quitTreeDrawing = quitTreeDrawing;

function navigationWarning() {
    if ($("#editpane").html() !== lastSavedState) {
        return "Unsaved changes exist, are you sure you want to leave the page?";
    }
    return undefined;
}

function assignEvents() {
    // Save global event handlers
    savedOnKeydown = document.body.onkeydown;
    savedOnMouseup = document.body.onmouseup;
    savedOnBeforeUnload = window.onbeforeunload;
    savedOnUnload = window.onunload;

    // Install global event handlers
    document.body.onkeydown = events.handleKeyDown;
    document.body.onmouseup = events.killTextSelection;
    window.onbeforeunload = navigationWarning;
    // window.onunload = logUnload;

    // Install element-specific event handlers
    $("#sn0").mousedown(events.handleNodeClick);
    $("#butsave").mousedown(save.save);
    $("#butundo").mousedown(undo.undo);
    $("#butredo").mousedown(undo.redo);
    $("#butexit").unbind("click").click(quitTreeDrawing);
    // TODO
    //$("#butidle").mousedown(idle);
    //$("#butvalidate").unbind("click").click(validateTrees);
    //$("#butnexterr").unbind("click").click(nextValidationError);
    //$("#butnexttree").unbind("click").click(nextTree);
    //$("#butprevtree").unbind("click").click(prevTree);
    //$("#butgototree").unbind("click").click(goToTree);
    $("#editpane").mousedown(selection.clearSelection);
    $("#conMenu").mousedown(contextmenu.hideContextMenu);
    // $(document).mousewheel(handleMouseWheel);
}

exports.startupTreedrawing = function startupTreedrawing (callback) {
    // TODO: something is very slow here; profile
    assignEvents();

    _.each(startupHooks, function (hook) {
        hook();
    });

    lastSavedState = $("#editpane").html();
    shutdownCallback = callback;
};

exports.resetGlobals = function resetGlobals () {
    // TODO: encapsulation violation
    globals = {
        ipnodes: [],

        commentTypes: [],

        extensions: [],
        clauseExtensions: [],
        leafExtensions: [],

        caseBarriers: [],

        displayCaseMenu: false,
        caseTags: [],
        casePhrases: [],
        caseMarkers: [],

        defaultConMenuGroup: [],

        logDetail: false

    };
    contextmenu.resetGlobals();
};
