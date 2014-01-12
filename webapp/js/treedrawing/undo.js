/*global require: false, exports: true */

var $ = require("jquery"),
    _ = require("lodash"),
    logger = require("../ui/log"),
    selection = require("./selection"),
    startup = require("./startup"),
    utils = require("./utils");

// TODO: organize this code

var undoMap,
    undoNewTrees,
    undoDeletedTrees,
    undoStack = [],
    redoStack = [],
    undoTransactionStack = [];

var idNumber = 1;

/**
 * Reset the undo system.
 *
 * This function removes any intermediate state the undo system has stored; it
 * does not affect the undo history.
 * @private
 */
var resetUndo = exports.resetUndo = function () {
    undoMap = {};
    undoNewTrees = [];
    undoDeletedTrees = [];
    undoTransactionStack = [];
};

/**
 * Reset the undo system entirely.
 *
 * This function zeroes out any undo history.
 */
var nukeUndo = exports.nukeUndo = function () {
    resetUndo();
    undoStack = [];
    redoStack = [];
};

/**
 * Record an undo step.
 * @private
 */
exports.undoBarrier = function undoBarrier() {
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
};

/**
 * Begin an undo transaction.
 *
 * This function MUST be matched by a call to either `undoEndTransaction`
 * (which keeps all intermediate steps since the start call) or
 * `undoAbortTransaction` (which discards said steps).
 */
var undoBeginTransaction = exports.undoBeginTransaction = function () {
    undoTransactionStack.push({
        map: undoMap,
        newTr: undoNewTrees,
        delTr: undoDeletedTrees
    });
};

/**
 * End an undo transaction, keeping its changes
 */
exports.undoEndTransaction = function undoEndTransaction() {
    undoTransactionStack.pop();
};

/**
 * End an undo transaction, discarding its changes
 */
var undoAbortTransaction = exports.undoAbortTranscation = function () {
    var t = undoTransactionStack.pop();
    undoMap = t.map;
    undoNewTrees = t.newTr;
    undoDeletedTrees = t.delTr;
};

/**
 * Execute a function, discarding whatever effects it has on the undo system.
 *
 * @param {Function} fn a function to execute
 *
 * @returns the result of `fn`
 */
exports.ignoringUndo = function ignoringUndo(fn) {
    // a bit of a grim hack, but it works
    undoBeginTransaction();
    var res = fn();
    undoAbortTransaction();
    return res;
};

/**
 * Inform the undo system that changes are being made.
 *
 * @param {JQuery} node the node in which changes are being made
 */
exports.touchTree = function touchTree(node) {
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
exports.registerNewRootTree = function registerNewRootTree(tree) {
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
exports.registerDeletedRootTree = function registerDeletedRootTree(tree) {
    var prev = tree.prev();
    if (prev.length === 0) {
        prev = null;
    }
    undoDeletedTrees.push({
        tree: tree,
        before: prev && prev.prop("id")
    });
};

/**
 * Perform an undo operation.
 *
 * This is a worker function, wrapped by `undo` and `redo`.
 * @private
 */
function doUndo(undoData) {
    var map = {},
        newTr = [],
        delTr = [];

    _.each(undoData.map, function(v, k) {
        var theNode = $("#" + k);
        map[k] = theNode.clone();
        theNode.replaceWith(v);
    });

    // Add back the deleted trees before removing the new trees, just in case
    // the insertion point of one of these is going to get zapped.  This
    // shouldn't happen, though.
    _.each(undoData.delTr, function(v) {
        var prev = v.before;
        if (prev) {
            v.tree.insertAfter($("#" + prev));
        } else {
            v.tree.prependTo($("#sn0"));
        }
        newTr.push(v.tree.prop("id"));
    });

    _.each(undoData.newTr, function(v) {
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
exports.undo = function undo() {
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
exports.redo = function redo () {
    if (redoStack.length === 0) {
        logger.warning("No further redo information");
        return;
    }
    undoStack.push(doUndo(redoStack.pop()));
    selection.clearSelection();
    selection.updateSelection();
};

function prepareUndoIds() {
    $("#sn0>.snode").map(function () {
        $(this).prop("id", "id" + idNumber);
        idNumber++;
    });
    nukeUndo();
}

startup.addStartupHook(prepareUndoIds);
