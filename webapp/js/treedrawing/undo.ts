///<reference path="./../../../types/all.d.ts" />

import $ = require("jquery");
import _ = require("lodash");
import selection = require("./selection");
import startup = require("./startup");
import utils = require("./utils");

var logger = require("../ui/log");

// TODO: organize this code

interface UndoStep {
    map : { [index : string] : JQuery };
    newTr: string[];
    delTr: {
        before : string;
        tree : JQuery;
    }[];
}

// TODO: type decls!
var undoMap,
    undoNewTrees : string[],
    undoDeletedTrees : {
        before : string;
        tree : JQuery;
    }[],
    undoStack : UndoStep[] = [],
    redoStack : UndoStep[] = [],
    undoTransactionStack = [];

var idNumber = 1;

/**
 * Reset the undo system.
 *
 * This function removes any intermediate state the undo system has stored; it
 * does not affect the undo history.
 * @private
 */
export function resetUndo () : void {
    undoMap = {};
    undoNewTrees = [];
    undoDeletedTrees = [];
    undoTransactionStack = [];
}

/**
 * Reset the undo system entirely.
 *
 * This function zeroes out any undo history.
 */
export function nukeUndo () : void {
    resetUndo();
    undoStack = [];
    redoStack = [];
}

/**
 * Record an undo step.
 * @private
 */
export function undoBarrier () : void {
    if (_.size(undoMap) === 0 &&
        _.size(undoNewTrees) === 0 &&
        _.size(undoDeletedTrees) === 0) {
        return;
    }
    undoStack.push({
        map: undoMap,
        newTr: undoNewTrees,
        delTr: undoDeletedTrees
    });
    resetUndo();
    redoStack = [];
}

/**
 * Begin an undo transaction.
 *
 * This function MUST be matched by a call to either `undoEndTransaction`
 * (which keeps all intermediate steps since the start call) or
 * `undoAbortTransaction` (which discards said steps).
 */
export function undoBeginTransaction () : void {
    undoTransactionStack.push({
        map: undoMap,
        newTr: undoNewTrees,
        delTr: undoDeletedTrees
    });
}

/**
 * End an undo transaction, keeping its changes
 */
export function undoEndTransaction() : void {
    undoTransactionStack.pop();
}

/**
 * End an undo transaction, discarding its changes
 */
export function undoAbortTransaction () : void {
    var t = undoTransactionStack.pop();
    undoMap = t.map;
    undoNewTrees = t.newTr;
    undoDeletedTrees = t.delTr;
}

/**
 * Execute a function, discarding whatever effects it has on the undo system.
 *
 * @param {Function} fn a function to execute
 *
 * @returns the result of `fn`
 */
export function ignoringUndo(fn : Function) : void {
    // a bit of a grim hack, but it works
    undoBeginTransaction();
    var res = fn();
    undoAbortTransaction();
    return res;
}

/**
 * Inform the undo system that changes are being made.
 *
 * @param {JQuery} node the node in which changes are being made
 */
export function touchTree(node : JQuery) : void {
    var root = $(utils.getTokenRoot(node));
    if (!undoMap[root.prop("id")]) {
        undoMap[root.prop("id")] = root.clone();
    }
};

/**
 * Inform the undo system of the addition of a new tree at the root level.
 *
 * @param {JQuery} tree the tree being added
 */
export function registerNewRootTree(tree : JQuery) : void {
    var newid = "id" + idNumber;
    idNumber++;
    undoNewTrees.push(newid);
    tree.prop("id", newid);
};

/**
 * Inform the undo system of a tree's removal at the root level
 *
 * @param {JQuery} tree the tree being removed
 */
export function registerDeletedRootTree(tree : JQuery) : void {
    var prev = tree.prev();
    if (prev.length === 0) {
        prev = null;
    }
    undoDeletedTrees.push({
        tree: tree,
        before: prev && prev.prop("id")
    });
}

/**
 * Perform an undo operation.
 *
 * This is a worker function, wrapped by `undo` and `redo`.
 * @private
 */
// TODO: actual type
function doUndo(undoData : UndoStep) : UndoStep {
    // The following hint to the type of map is needed by the compiler,
    // apparently
    var map : { [index : string] : JQuery } = {},
        newTr = [],
        delTr = [];

    _.forEach(undoData.map, function(v : JQuery, k : string) : void {
        var theNode = $("#" + k);
        map[k] = theNode.clone();
        theNode.replaceWith(v);
    });

    // Add back the deleted trees before removing the new trees, just in case
    // the insertion point of one of these is going to get zapped.  This
    // shouldn't happen, though.
    _.forEach(undoData.delTr, function(
        v : { before : string; tree : JQuery; }
    ) : void {
        var prev = v.before;
        if (prev) {
            v.tree.insertAfter($("#" + prev));
        } else {
            v.tree.prependTo($("#sn0"));
        }
        newTr.push(v.tree.prop("id"));
    });

    _.forEach(undoData.newTr, function(v : string) : void {
        var theNode = $("#" + v);
        var prev = theNode.prev();
        if (prev.length === 0) {
            prev = null;
        }
        delTr.push({
            tree: theNode.clone(),
            before: prev && prev.prop("id")
        });
        theNode.remove();
    });

    return {
        map: map,
        newTr: newTr,
        delTr: delTr
    };
}

/**
 * Perform undo.
 */
export function undo() : void {
    if (undoStack.length === 0) {
        logger.warning("No further undo information");
        return;
    }
    var lastUndo = undoStack.pop();
    redoStack.push(doUndo(lastUndo));
    selection.clearSelection();
    selection.updateSelection();
};

/**
 * Perform redo.
 */
export function redo () : void {
    if (redoStack.length === 0) {
        logger.warning("No further redo information");
        return;
    }
    undoStack.push(doUndo(redoStack.pop()));
    selection.clearSelection();
    selection.updateSelection();
};

function prepareUndoIds() : void {
    $("#sn0>.snode").map(function () : void {
        $(this).prop("id", "id" + idNumber);
        idNumber++;
    });
    nukeUndo();
}

startup.addStartupHook(prepareUndoIds);
