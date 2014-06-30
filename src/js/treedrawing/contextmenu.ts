///<reference path="./../../../types/all.d.ts" />

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

import _ = require("lodash");
import $ = require("jquery");
import selection = require("./selection");
import undo = require("./undo");
import utils = require("./utils");
import edit = require("./struc-edit");
import conf = require("./config");
import lc = require("./label-convert");

interface ConLeaf {
    suggestion : string;
    before : boolean;
    label : string;
    word : string;
}

var conmenus : { [index : string] : { suggestions : string[] } } = {},
    conleafs : ConLeaf[] = [],
    caseMarkers : string[] = [];

export function resetGlobals () : void {
    conmenus = {};
    conleafs = [];
    caseMarkers = [];
}

export function hideContextMenu () : void {
    $("#conMenu").css("visibility", "hidden");
}

export function addConMenu (label : string,
                            suggestions : string[]) : void {
    conmenus[label] = {
        suggestions : suggestions
    };
}

export function addConLeaf (suggestion : string,
                            before : boolean,
                            label : string,
                            word : string) : void {
    var conleaf = {
        suggestion : suggestion,
        before : before,
        label : label,
        word : word
    };

    conleafs.push(conleaf);
}

export function addCaseMarker (marker : string) : void {
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
function doToggleExtension(node : HTMLElement, extension : string) : () => void {
    return function () : void {
        undo.touchTree($(node));
        lc.toggleExtensionForNode(extension, node);
        selection.clear();
        hideContextMenu();
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
function setCaseOnTag(node : JQuery, theCase : string) : () => void {
    function doKids(n : JQuery, override? : boolean) : void {
        if (utils.isCaseNode(n.get(0))) {
            utils.setCase(n.get(0), theCase);
        } else if (_.contains(conf.caseBarriers,
                              lc.getLabelForNode(n.get(0)).split("-")[0]) &&
                   !n.parent().is(".CONJP") &&
                   !override) {
            // nothing
        } else {
            n.children(".snode").each(function () : void {
                doKids($(this));
            });
        }
    }
    return function () : void {
        undo.touchTree(node);
        doKids(node, true);
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
function doConLeaf(conleaf : ConLeaf, node : Element) : () => void {
    return function () : void {
        edit.makeLeaf(conleaf.before, conleaf.label, conleaf.word, node);
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
export function addConMenuGroup(group : string[]) : void {
    for (var i = 0; i < group.length; i++) {
        addConMenu(group[i], group);
    }
}

/**
 * Add a terminal node to the context menu.
 *
 * Add a terminal node that the context menu will allow inserting in the tree.
 *
 * @param {String} phrase the label of the leaf
 * @param {String} terminal the text of the leaf
 */
export function addConLeafBefore(phrase : string, terminal : string) : void {
    addConLeaf("&lt; (" + phrase + " " + terminal + ")",
               true, phrase, terminal);
}

/**
 * Compute the suggested changes for the context menu for a label.
 *
 * @param {String} label
 * @private
 */
function getSuggestions(node : Element) : string[] {
    var indstr = "",
        indtype = "",
        theCase = "";
    if (utils.getIndex(node)) {
        indstr = utils.getIndex(node).toString();
        indtype = utils.getIndexType(node);
    }
    var label = lc.getLabelForNode(node);
    theCase = utils.getCase(node);
    if (theCase) {
        theCase = "-" + theCase;
    }

    var suggestions = [];
    var menuitems = conf.customConMenuGroups;
    if (conmenus[label] !== null) {
        menuitems = conmenus[label].suggestions;
    }

    for (var i = 0; i < menuitems.length; i++) {
        var menuitem = menuitems[i];
        // TODO: check whether menuitem is really a bare category
        if (utils.isCaseCategory(menuitem)) {
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
function loadContextMenu(nodeOrig : HTMLElement) : void {
    var nO = $(nodeOrig),
        nodeIndex = utils.getIndex(nodeOrig),
        indexSep = "",
        indexString = "",
        nodelabel = lc.getLabelForNode(nodeOrig),
        newnode,
        i;
    function loadConMenuMousedown () : void {
        var suggestion = "" + $(this).text();
        lc.setLabelForNode(suggestion, nodeOrig);
        hideContextMenu();
    }

    if (nodeIndex) {
        indexSep = utils.getIndexType(nodeOrig);
        indexString = indexSep + utils.getIndex(nodeOrig);
    }
    $("#conLeft").empty();
    $("#conLeft").append($("<div class='conMenuHeading'>Label</div>"));

    var suggestions = getSuggestions(nodeOrig);
    for (i = 0; i < suggestions.length; i++) {
        if (suggestions[i] !== nodelabel) {
            newnode = $("<div class='conMenuItem'><a href='#'>" +
                            suggestions[i] + indexString + "</a></div>");
            $(newnode).mousedown(loadConMenuMousedown);
            $("#conLeft").append(newnode);
        }
    }

    // do the right side context menu
    $("#conRight").empty();

    if (conf.displayCaseMenu) {
        if (utils.hasCase(nodeOrig) || utils.isCasePhrase(nodeOrig)) {
            $("#conRight").append($("<div class='conMenuHeading'>Case</div>"));
            caseMarkers.forEach(function(c : string) : void {
                newnode = $("<div class='conMenuItem'><a href='#'>-" + c +
                                "</a></div>");
                $(newnode).mousedown(setCaseOnTag(nO, c));
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
    for (i = 0; i < conf.extensions.length; i++) {
        // do the right side context menu
        newnode = $("<div class='conMenuItem'><a href='#'>" +
                        conf.extensions[i] + "</a></div>");
        $(newnode).mousedown(doToggleExtension(nodeOrig, conf.extensions[i]));
        $("#conRightest").append(newnode);
    }
}

export function showContextMenu(e : JQueryMouseEventObject) : void {
    var element = <HTMLElement>e.target; // TODO: needed? || e.srcElement;
    if (element === document.getElementById("sn0")) {
        selection.clearSelection();
        return;
    }

    var left = e.pageX + "px";
    var top = e.pageY + "px";

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
    var h = _.max(_.map([conl, conr, conrr], function (x : JQuery) : number {
        return x.height();
    }));
    conl.height(h);
    conr.height(h);
    conrr.height(h);

    conm.css("left", left);
    conm.css("top", top);
    conm.css("visibility", "visible");
}
