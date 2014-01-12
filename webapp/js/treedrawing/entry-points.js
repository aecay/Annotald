/*global module: true, require: false */

var s = require("./struc-edit"),
    undo = require("./undo"),
    n = require("./node-edit"),
    selection = require("./selection"),
    search = require("./search");

module.exports = {
    leafAfter: s.leafAfter,
    leafBefore: s.leafBefore,
    setLabel: s.setLabel,
    makeNode: s.makeNode,
    coIndex: s.coIndex,
    toggleCollapsed: false, // TODO
    splitWord: false, // TODO
    toggleExtension: s.toggleExtension,
    pruneNode: s.pruneNode,
    undo: undo.undo,
    redo: undo.redo,
    editNode: n.editNode,
    clearSelection: selection.clearSelection,
    toggleLemmata: false, // TODO
    displayRename: false, // TODO
    search: search.search
};
