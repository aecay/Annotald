/*global exports: true, require: false */
/*jshint browser: true */

var lastSavedState = require("./global").lastSavedState,
    $ = require("jquery"),
    _ = require("lodash"),
    displayError = require("../ui/log").error,
    events = require("./events"),
    save = require("./save");

var startuphooks = [],
    savedOnKeydown,
    savedOnMouseup,
    savedOnBeforeUnload,
    savedOnUnload;

function navigationWarning() {
    if ($("#editpane").html() !== lastSavedState) {
        return "Unsaved changes exist, are you sure you want to leave the page?";
    }
    return undefined;
}

function assignEvents() {
    // load custom commands from user settings file
    customCommands();

    // Save global event handlers
    savedOnKeydown = document.body.onkeydown;
    savedOnMouseup = document.body.onmouseup;
    savedOnBeforeUnload = window.onbeforeunload;
    savedOnUnload = window.onunload;

    // Install global event handlers
    document.body.onkeydown = events.handleKeyDown;
    document.body.onmouseup = events.killTextSelection;
    window.onbeforeunload = navigationWarning;
    window.onunload = logUnload;

    // Install element-specific event handlers
    $("#sn0").mousedown(events.handleNodeClick);
    $("#butsave").mousedown(save.save);
    $("#butundo").mousedown(undo);
    $("#butredo").mousedown(redo);
    $("#butidle").mousedown(idle);
    $("#butexit").unbind("click").click(quitServer);
    $("#butvalidate").unbind("click").click(validateTrees);
    $("#butnexterr").unbind("click").click(nextValidationError);
    $("#butnexttree").unbind("click").click(nextTree);
    $("#butprevtree").unbind("click").click(prevTree);
    $("#butgototree").unbind("click").click(goToTree);
    $("#editpane").mousedown(clearSelection);
    $("#conMenu").mousedown(hideContextMenu);
    // $(document).mousewheel(handleMouseWheel);
}

function styleIpNodes() {
    for (var i = 0; i < ipnodes.length; i++) {
        styleTag(ipnodes[i], "border-top: 1px solid black;" +
                 "border-bottom: 1px solid black;" +
                 "background-color: #C5908E;");
    }
}

exports.addStartupHook = function addStartupHook (fn) {
    startuphooks.push(fn);
};

exports.startupTreedrawing = function startupTreedrawing () {
    // TODO: something is very slow here; profile
    // TODO: move some of this into hooks
    assignEvents();
    styleIpNodes();
    setupCommentTypes();
    globalStyle.appendTo("head");
    // Load the custom context menu groups from user settings file
    customConMenuGroups();
    // Load the custom context menu "leaf before" items
    customConLeafBefore();

    _.each(startuphooks, function (hook) {
        hook();
    });

    lastSavedState = $("#editpane").html();
};

exports.quitTreeDrawing = function quitTreedrawing (e, force) {
    unAutoIdle();
    if (!force && $("#editpane").html() !== lastSavedState) {
        displayError("Cannot exit, unsaved changes exist.  <a href='#' " +
                     "onclick='quitServer(null, true);return false;'>Force</a>");
    } else {
        document.body.onmeydown = savedOnKeydown;
        document.body.onmouseup = savedOnMouseup;
        window.onunload = savedOnUnload;
        window.onbeforeunlaod = savedOnBeforeUnload;
    }
};
