///<reference path="./../../../types/all.d.ts" />

var dummy;

import $ = require("jquery");
import _ = require("lodash");

import globals = require("./global"); dummy = require("./global");
import contextmenu = require("./contextmenu"); dummy = require("./contextmenu");
import bindings = require("./bindings"); dummy = require("./bindings");
import undo = require("./undo"); dummy = require("./undo");
import selection = require("./selection"); dummy = require("./selection");
import edit = require("./struc-edit"); dummy = require("./struc-edit");
import metadataEditor = require("./metadata"); dummy = require("./metadata.ts");
import dialog = require("./dialog"); dummy = require("./dialog");

export interface ClickHook { (button : number) : void; }

export function killTextSelection(e : Event) : void {
    if (dialog.isDialogShowing() ||
        $(e.target).parents(".togetherjs,.togetherjs-modal").length > 0) {
        return;
    }
    var sel = window.getSelection();
    sel.removeAllRanges();
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
        if (selection.cardinality() === 1) {
            if (selection.get() !== element) {
                e.stopPropagation();
                edit.moveNode(element);
            } else {
                contextmenu.showContextMenu(e);
            }
        } else if (selection.cardinality() === 2) {
            e.stopPropagation();
            edit.moveNodes(element);
        } else {
            contextmenu.showContextMenu(e);
        }
    } else {
        // leftclick
        contextmenu.hideContextMenu();
        if (e.shiftKey && selection.get()) {
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