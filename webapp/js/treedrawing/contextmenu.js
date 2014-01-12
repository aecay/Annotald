// Copyright (c) 2011 Anton Karl Ingason, Aaron Ecay

// This file is part of the Annotald program for annotating
// phrase-structure treebanks in the Penn Treebank style.

// This file is distributed under the terms of the GNU General
// Public License as published by the Free Software Foundation, either
// version 3 of the License, or (at your option) any later version.

// This program is distributed in the hope that it will be useful, but
// WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Lesser
// General Public License for more details.

// You should have received a copy of the GNU Lesser General Public
// License along with this program.  If not, see
// <http://www.gnu.org/licenses/>.

/*global exports: true, require: false */

/*jshint browser: true */

var _ = require("lodash"),
    $ = require("jquery"),
    selection = require("./selection"),
    undo = require("./undo"),
    utils = require("./utils"),
    edit = require("./struc-edit"),
    conf = require("./config");

var conmenus = {},
    conleafs = [],
    caseMarkers = [],
    // TODO: setter for displayCaseMenu
    displayCaseMenu = false,
    extensions = conf.extensions;

function hideContextMenu () {
    $("#conMenu").css("visibility","hidden");
}
exports.hideContextMenu = hideContextMenu;

function addConMenu (label, suggestions) {
    conmenus[label] = {
        suggestions : suggestions
    };
}
exports.addConMenu = addConMenu;

function addConLeaf (suggestion, before, label, word) {
    var conleaf = {
        suggestion : suggestion,
        before : before,
        label : label,
        word : word
    };

    conleafs.push(conleaf);
}
exports.addConLeaf = addConLeaf;

exports.addCaseMarker = function addCaseMarker (marker) {
    caseMarkers.push(marker);
};
// TODO: addCaseMarkers, plural

/**
 * Toggle the extension of a node.
 *
 * A context menu action function.
 *
 * @param {Node} node
 * @param {String} extension the extension to toggle
 * @returns {Function} A function which, when called, will execute the action.
 * @private
 */
function doToggleExtension(node, extension) {
    return function() {
        undo.touchTree($(node));
        selection.clearSelection();
        selection.selectNode(node);
        edit.toggleExtension(extension);
        hideContextMenu();
        selection.clearSelection();
    };
}

/**
 * Set the case of a node.
 *
 * A context menu action function.  Recurses into children of this node,
 * stopping when a barrier (case node or explicitly defined barrier) is
 * reached.
 *
 * @param {Node} node
 * @param {String} theCase the case to assign
 * @returns {Function} A function which, when called, will execute the action.
 * @private
 */
function setCaseOnTag(node, theCase) {
    function doKids(n, override) {
        if (utils.isCaseNode(n)) {
            utils.setCase(n, theCase);
        } else if (_.contains(conf.caseBarriers, utils.getLabel(n).split("-")[0]) &&
                   !n.parent().is(".CONJP") &&
                   !override) {
            // nothing
        } else {
            n.children(".snode").each(function() {
                doKids($(this));
            });
        }
    }
    return function() {
        var n = $(node);
        undo.touchTree(n);
        doKids(n, true);
    };
}

/**
 * Insert a leaf node.
 *
 * A context menu action function.
 *
 * @param {Object} conleaf an object describing the leaf to be added.  Has the
 * following keys:
 *
 * - `before` Boolean, insert this leaf beofre or fter the target
 * - `label` String, the label of the node to insert
 * - `word` String, the text of the node to insert
 * @param {Node} node
 * @returns {Function} A function which, when called, will execute the action.
 * @private
 */
function doConLeaf(conleaf, node) {
    return function() {
        edit.makeLeaf(conleaf.before, conleaf.label, conleaf.word, node, true);
        hideContextMenu();
    };
}

/**
 * Add a group of labels to the context menu.
 *
 * When activating the context menu, if the label of the targeted node belongs
 * to one of these groups, the other entries in the group will be suggested as
 * new labels.
 *
 * @param {String[]} group
 */
function addConMenuGroup(group) {
    for (var i = 0; i < group.length; i++) {
        addConMenu(group[i], group);
    }
}
exports.addConMenuGroup = addConMenuGroup;

/**
 * Add a terminal node to the context menu.
 *
 * Add a terminal node that the context menu will allow inserting in the tree.
 *
 * @param {String} phrase the label of the leaf
 * @param {String} terminal the text of the leaf
 */
function addConLeafBefore(phrase, terminal) {
    addConLeaf("&lt; (" + phrase + " " + terminal + ")",
               true, phrase, terminal);
}
exports.addConLeafBefore = addConLeafBefore;

/**
 * Compute the suggested changes for the context menu for a label.
 *
 * @param {String} label
 * @private
 */
function getSuggestions(label) {
    var indstr = "",
        indtype = "",
        theCase = "";
    if (utils.parseIndex(label) > 0) {
        indstr = utils.parseIndex(label);
        indtype = utils.parseIndexType(label);
    }
    label = utils.parseLabel(label);
    theCase = utils.labelGetCase(label);
    if (theCase !== "") {
        theCase = "-" + theCase;
    }
    label = utils.labelRemoveCase(label);

    var suggestions = [];
    var menuitems = conf.customConMenuGroups;
    if (conmenus[label] !== null) {
        menuitems = conmenus[label].suggestions;
    }

    for (var i = 0; i < menuitems.length; i++) {
        var menuitem = menuitems[i];
        if (utils.isCaseLabel(menuitem)) {
            menuitem += theCase;
        }
        suggestions.push(menuitem + indtype + indstr);
    }
    return _.uniq(suggestions);
}

/**
 * Populate the context menu for a given node.
 *
 * Does not display the menu.
 *
 * @param {Node} nodeOrig
 * @private
 */
function loadContextMenu(nodeOrig) {
    var nO = $(nodeOrig),
        nodeIndex = utils.getIndex(nO),
        indexSep = "",
        indexString = "",
        nodelabel = utils.getLabel(nO),
        newnode,
        i;
    function loadConMenuMousedown () {
        var suggestion = "" + $(this).text();
        utils.setNodeLabel(nO, suggestion);
        hideContextMenu();
    }

    if (nodeIndex > -1) {
        indexSep = utils.parseIndexType(nodelabel);
        indexString = indexSep + utils.parseIndex(nodelabel);
        nodelabel = utils.parseLabel(nodelabel);
    }
    $("#conLeft").empty();
    $("#conLeft").append($("<div class='conMenuHeading'>Label</div>"));


    var suggestions = getSuggestions(nodelabel);
    for (i = 0; i < suggestions.length; i++) {
        if (suggestions[i] !== nodelabel) {
            newnode = $("<div class='conMenuItem'><a href='#'>" +
                            suggestions[i]+indexString+"</a></div>");
            $(newnode).mousedown(loadConMenuMousedown);
            $("#conLeft").append(newnode);
        }
    }

    // do the right side context menu
    $("#conRight").empty();

    if (displayCaseMenu) {
        if (utils.hasCase(nO) || utils.isCasePhrase(nO)) {
            $("#conRight").append($("<div class='conMenuHeading'>Case</div>"));
            caseMarkers.forEach(function(c) {
                newnode = $("<div class='conMenuItem'><a href='#'>-" + c +
                                "</a></div>");
                $(newnode).mousedown(setCaseOnTag(nodeOrig, c));
                $("#conRight").append(newnode);
            });
        }
    }

    // do addleafbefore
    $("#conRight").append($("<div class='conMenuHeading'>Leaf before</div>"));
    for (i = 0; i < conleafs.length; i++) {
        newnode = $("<div class='conMenuItem'><a href='#'>" +
                        conleafs[i].suggestion + "</a></div>");
        $(newnode).mousedown(doConLeaf(conleafs[i], nodeOrig));
        $("#conRight").append(newnode);
    }

    $("#conRightest").empty();
    $("#conRightest").append($("<div class='conMenuHeading'>Toggle ext.</div>"));

    // TODO: make only a subset of the extensions togglable, i.e. introduce a
    // new variable togglableExtensions
    for (i = 0; i < extensions.length; i++) {
        // do the right side context menu
        newnode = $("<div class='conMenuItem'><a href='#'>" +
                        extensions[i] + "</a></div>");
        $(newnode).mousedown(doToggleExtension(nodeOrig, extensions[i]));
        $("#conRightest").append(newnode);
    }
}

exports.showContextMenu = function showContextMenu(e) {
    var element = e.target || e.srcElement;
    if (element === document.getElementById("sn0")) {
        selection.clearSelection();
        return;
    }

    var left = e.pageX;
    var top = e.pageY;
    left = left + "px";
    top = top + "px";

    var conl = $("#conLeft"),
        conr = $("#conRight"),
        conrr = $("#conRightest"),
        conm = $("#conMenu");

    conl.empty();
    loadContextMenu(element);

    // Make the columns equally high
    conl.height("auto");
    conr.height("auto");
    conrr.height("auto");
    var h = _.max([conl,conr,conrr], function (x) { return x.height(); });
    conl.height(h);
    conr.height(h);
    conrr.height(h);

    conm.css("left",left);
    conm.css("top",top);
    conm.css("visibility","visible");
};
