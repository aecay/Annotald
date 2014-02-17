///<reference path="./../../../types/all.d.ts" />

export interface Hook { () : void; };

/* These vars and functions need to be put before the requires, because of
 * circular dependency issues.
 */

var startupHooks : Hook[] = [],
    shutdownHooks : Hook[] = [],
    savedOnKeydown,
    savedOnMouseup,
    savedOnBeforeUnload,
    savedOnUnload,
    shutdownCallback;

export function addStartupHook (fn : Hook) : void {
    startupHooks.push(fn);
}

export function addShutdownHook (fn : Hook) : void {
    shutdownHooks.push(fn);
};

import globals = require("./global");
var lastSavedState = globals.lastSavedState;
import $ = require("jquery");
import _ = require("lodash");
var displayError = require("../ui/log").error;
import events = require("./events");
import save = require("./save");
import undo = require("./undo");
import selection = require("./selection");
import contextmenu = require("./contextmenu");

require("./entry-points");      // TODO: is this necessary?

export function quitTreeDrawing (e : Event, force : boolean) : void {
    // unAutoIdle();
    if (!force && $("#editpane").html() !== lastSavedState) {
        displayError("Cannot exit, unsaved changes exist.  <a href='#' " +
                     "onclick='quitServer(null, true);return false;'>Force</a>");
    } else {
        document.body.onkeydown = savedOnKeydown;
        document.body.onmouseup = savedOnMouseup;
        window.onunload = savedOnUnload;
        window.onbeforeunload = savedOnBeforeUnload;
        _.each(shutdownHooks, function (hook : Hook) : void {
            hook();
        });
        shutdownCallback();
    }
}

function navigationWarning () : string {
    if ($("#editpane").html() !== lastSavedState) {
        return "Unsaved changes exist, are you sure you want to leave the page?";
    }
    return undefined;
}

function assignEvents () : void {
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

export function startupTreedrawing (callback : Hook) : void {
    // TODO: something is very slow here; profile
    assignEvents();

    _.each(startupHooks, function (hook : Hook) : void {
        hook();
    });

    lastSavedState = $("#editpane").html();
    shutdownCallback = callback;
}

export function resetGlobals () : void {
    // TODO: encapsulation violation
    var newGlobals : { [key : string] : any; } = {
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
    _.forOwn(newGlobals, function (v : any, k : string) : void {
        globals[k] = v;
    });
    contextmenu.resetGlobals();
}
