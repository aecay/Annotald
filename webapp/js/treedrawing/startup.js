/*global exports: true, require: false */
/*jshint browser: true */

var lastSavedState = require("./global").lastSavedState,
    $ = require("jquery"),
    _ = require("lodash"),
    displayError = require("../ui/log").error,
    events = require("./events"),
    save = require("./save"),
    undo = require("./undo"),
    selection = require("./selection"),
    contextmenu = require("./contextmenu");

var startupHooks = [],
    shutdownHooks = [],
    savedOnKeydown,
    savedOnMouseup,
    savedOnBeforeUnload,
    savedOnUnload;

var quitTreeDrawing = exports.quitTreeDrawing = function quitTreedrawing (e, force) {
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
    }
};

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

exports.addStartupHook = function addStartupHook (fn) {
    startupHooks.push(fn);
};

exports.addShutdownHook = function addShutdownHook (fn) {
    shutdownHooks.push(fn);
};

exports.startupTreedrawing = function startupTreedrawing () {
    // TODO: something is very slow here; profile
    // TODO: move some of this into hooks
    assignEvents();

    _.each(startupHooks, function (hook) {
        hook();
    });

    lastSavedState = $("#editpane").html();
};
