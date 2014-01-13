///<reference path="./../../../types/all.d.ts" />
var s = require("./struc-edit");

var n = require("./node-edit");
var selection = require("./selection");


exports.leafAfter = s.leafAfter;
exports.leafBefore = s.leafBefore;
exports.setLabel = s.setLabel;
exports.makeNode = s.makeNode;
exports.coIndex = s.coIndex;
exports.toggleCollapsed = false;
exports.splitWord = false;
exports.toggleExtension = s.toggleExtension;
exports.pruneNode = s.pruneNode;
exports.undo = undo.undo;
exports.redo = undo.redo;
exports.editNode = n.editNode;
exports.clearSelection = selection.clearSelection;
exports.toggleLemmata = false;
exports.displayRename = false;
exports.search = search.search;

