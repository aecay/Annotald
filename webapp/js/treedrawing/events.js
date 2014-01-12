/*global exports: true, require: false */

/*jshint browser: true */

var $ = require("jquery"),
    _ = require("lodash"),
    globals = require("./global"),
    contextmenu = require("./contextmenu"),
    bindings = require("./bindings"),
    undo = require("./undo"),
    selection = require("./selection"),
    edit = require("./struc-edit"),
    metadataEditor = require("./medtdata-editor"),
    dialog = require("./dialog");

exports.killTextSelection = function killTextSelection(e) {
    if (dialog.isDialogShowing() ||
        $(e.target).parents(".togetherjs,.togetherjs-modal").length > 0) {
        return;
    }
    var sel = window.getSelection();
    sel.removeAllRanges();
};

var keyDownHooks = [];

exports.addKeyDownHook = function addKeyDownHook(fn) {
    keyDownHooks.push(fn);
};

exports.handleKeyDown = function handleKeyDown(e) {
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
    _.each(keyDownHooks, function (fn) {
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

var clickHooks = [];

exports.addClickHook = function addClickHook(fn) {
    clickHooks.push(fn);
};

exports.handleNodeClick = function handleNodeClick(e) {
    e = e || window.event;
    var element = (e.target || e.srcElement);
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
    _.each(clickHooks, function (fn) {
        fn(e.button);
    });
    e.stopPropagation();
    globals.lastEventWasMouse = true;
    undo.undoBarrier();
};
