///<reference path="./../../../types/all.d.ts" />

// export interface Event {
//     // A pox on your mutually incompatible houses.
//     keyCode : number;
//     ctrlKey : boolean;
//     shiftKey : boolean;
//     pageX : number;
//     pageY : number
// }

import $ = require("jquery");
import _ = require("lodash");
import globals = require("./global");
import contextmenu = require("./contextmenu");
import bindings = require("./bindings");
import undo = require("./undo");
import selection = require("./selection");
import edit = require("./struc-edit");
import metadataEditor = require("./metadata-editor");
import dialog = require("./dialog");

export interface ClickHook { (button : number) : void; }

export interface KeyDownHook {
    (x : { keyCode: number; shift: boolean; ctrl: boolean; },
     y : Function,
     z : any[]) : void;
}

export function killTextSelection(e : Event) : void {
    if (dialog.isDialogShowing() ||
        $(e.target).parents(".togetherjs,.togetherjs-modal").length > 0) {
        return;
    }
    var sel = window.getSelection();
    sel.removeAllRanges();
};

var keyDownHooks : KeyDownHook[] = [];

export function addKeyDownHook(fn : KeyDownHook) : void {
    keyDownHooks.push(fn);
};

export function handleKeyDown(e : KeyboardEvent) : boolean {
    if ((e.ctrlKey && e.shiftKey) || e.metaKey || e.altKey) {
        // unsupported modifier combinations
        return true;
    }
    if (e.keyCode === 16 || e.keyCode === 17 || e.keyCode === 18) {
        // Don't handle shift, ctrl, and meta presses
        return true;
    }
    if ($(e.target).parents(".togetherjs,.togetherjs-modal").length > 0) {
        // Don't interfere with TogetherJS UI elements
        return true;
    }
    var commandMap;
    if (e.ctrlKey) {
        commandMap = bindings.ctrlKeyMap;
    } else if (e.shiftKey) {
        commandMap = bindings.shiftKeyMap;
    } else {
        commandMap = bindings.regularKeyMap;
    }
    globals.lastEventWasMouse = false;
    if (!commandMap[e.keyCode]) {
        return true;
    }
    e.preventDefault();
    var theFn = commandMap[e.keyCode].func;
    var theArgs = commandMap[e.keyCode].args;
    _.each(keyDownHooks, function (fn : KeyDownHook) : void {
        fn({
            keyCode: e.keyCode,
            shift: e.shiftKey,
            ctrl: e.ctrlKey
           },
          theFn,
          theArgs);
    });
    theFn.apply(undefined, theArgs);
    if (!theFn.async) {
        undo.undoBarrier();
    }
    return false;
};

var clickHooks : ClickHook[] = [];

export function addClickHook(fn : ClickHook) : void {
    clickHooks.push(fn);
}

export function handleNodeClick(e : JQueryMouseEventObject) : void {
    var element = <Element>e.target; // TODO: e.srcEmement neded?
    metadataEditor.saveMetadata();
    if (e.button === 2) {
        // rightclick
        if (globals.startnode && !globals.endnode) {
            if (globals.startnode !== element) {
                e.stopPropagation();
                edit.moveNode(element);
            } else {
                contextmenu.showContextMenu(e);
            }
        } else if (globals.startnode && globals.endnode) {
            e.stopPropagation();
            edit.moveNodes(element);
        } else {
            contextmenu.showContextMenu(e);
        }
    } else {
        // leftclick
        contextmenu.hideContextMenu();
        if (e.shiftKey && globals.startnode) {
            selection.selectNode(element, true);
            e.preventDefault(); // Otherwise, this sets the text
                                // selection in the browser...
        } else {
            selection.selectNode(element);
            if (e.ctrlKey) {
                edit.makeNode("XP");
            }
        }
    }
    _.each(clickHooks, function (fn : ClickHook) : void {
        fn(e.button);
    });
    e.stopPropagation();
    globals.lastEventWasMouse = true;
    undo.undoBarrier();
}
