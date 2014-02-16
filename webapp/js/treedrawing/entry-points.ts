///<reference path="./../../../types/all.d.ts" />

import s = require("./struc-edit");
import xUndo = require("./undo");
import n = require("./node-edit");
import selection = require("./selection");
import xSearch = require("./search");
import view = require("./view");
import nodeFormatter = require("./node-formatter");

export var nf = nodeFormatter;

export var leafAfter = s.leafAfter;
export var leafBefore = s.leafBefore;
export var setLabel = s.setLabel;
export var makeNode = s.makeNode;
export var coIndex = s.coIndex;
export var splitWord = n.splitWord;
export var toggleExtension = s.toggleExtension;
export var pruneNode = s.pruneNode;
export var undo = xUndo.undo;
export var redo = xUndo.redo;
export var editNode = n.editNode;
export var clearSelection = selection.clearSelection;
export var displayRename = n.displayRename;
export var search = xSearch.search;
export var toggleLemmata = view.toggleLemmata;
export var toggleCollapsed = view.toggleCollapsed;
