///<reference path="./../../../types/all.d.ts" />

import s = require("./struc-edit");
import xUndo = require("./undo");
import n = require("./node-edit");
import selection = require("./selection");
import xSearch = require("./search");
import view = require("./view");
import nodeFormatter = require("./node-formatter");
import bindings = require("./bindings");
import contextmenu = require("./contextmenu");
import userStyle = require("./user-style");
import config = require("./config");
import globals = require("./global");

var exp = {
    bindings: bindings,
    commands: {
        leafAfter: s.leafAfter,
        leafBefore: s.leafBefore,
        setLabel: n.setLabel,
        makeNode: s.makeNode,
        coIndex: s.coIndex,
        splitWord: n.splitWord,
        toggleExtension: s.toggleExtension,
        pruneNode: s.pruneNode,
        undo: xUndo.undo,
        redo: xUndo.redo,
        editNode: n.editNode,
        clearSelection: selection.clearSelection,
        search: xSearch.search,
        toggleLemmata: view.toggleLemmata,
        toggleCollapsed: view.toggleCollapsed
    },
    config: config,
    contextmenu : contextmenu,
    // TODO: don't expose all this
    globals: globals,
    nodeFormatter: nodeFormatter,
    userStyle: userStyle
};

export = exp;
