///<reference path="./../../../types/all.d.ts" />

// Copyright (c) 2012 Anton Karl Ingason, Aaron Ecay, Jana Beck

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

import $ = require("jquery");
import _ = require("lodash");
import strucEdit = require("./struc-edit");
import conf = require("./config");
import undo = require("./undo");
import selection = require("./selection");

export function startsWith (a : string, b : string) : boolean {
    return (a.substr(0, b.length) === b);
}

export function endsWith (a : string, b : string) : boolean {
    return (a.substr(a.length - b.length) === b);
}

/*
 * Utility functions for Annotald.
 */

// TODOs: mark @privates appropriately, consider naming scheme for dom vs JQ args

// * UI helper functions

var messageHistory : string = "";

/**
 * Log the message in the message history.
 * @private
 */
function logMessage(msg : string) : void {
    var d = new Date();
    messageHistory += d.toUTCString() + ": " + $("<div>" + msg +
                                                 "</div>").text() +
        "\n";
}

/**
 * Scroll to display the next place in the document matching a selector.
 *
 * If no matches, do nothing.
 *
 * @returns {JQuery} the node scrolled to, or `undefined` if none.
 */
export function scrollToNext(selector : string) : JQuery {
    var docViewTop = $(window).scrollTop();
    var nextError = $(selector).filter(
        function () : boolean {
            // Magic number alert!  Not sure if the +5 is needed...
            return $(this).offset().top > docViewTop + 5;
        }).first();
    if (nextError.length === 1) {
        window.scroll(0, nextError.offset().top);
        return nextError;
    }
    return undefined;
}

/**
 * Update the CSS class of a node to reflect its label.
 *
 * @param {JQuery} node
 * @param {String} oldlabel (optional) the former label of this node
 */
export function updateCssClass(node : JQuery, oldlabel? : string) : void {
    if (!node.hasClass("snode")) {
        return;
    }
    if (oldlabel) {
        // should never be needed, but a bit of defensiveness can't hurt
        oldlabel = parseLabel($.trim(oldlabel));
    } else {
        // oldlabel wasn't supplied -- try to guess
        oldlabel = _.find(node.prop("class").split(" "),
                          function (s : string) : boolean {
                              return (/[A-Z-]/).test(s);
                          });
    }
    node.removeClass(oldlabel);
    node.addClass(parseLabel(getLabel(node)));
}

// * Functions on node representation

// ** Predicates

/**
 * Indicate whether a node has a lemma associated with it.
 *
 * @param {JQuery} node
 * @returns {Boolean}
 * @private
 */
// TODO: is private right for this one?
export function hasLemma(node : JQuery) : boolean {
    return node.children(".wnode").children(".lemma").length === 1;
};

/**
 * Test whether a node is a purely structural leaf.
 *
 * @param {Node} node the node to operate on
 */
export function isLeafNode(node : Node) : boolean {
    return $(node).children(".wnode").length > 0;
}

/**
 * Test whether a given node is empty, i.e. a trace, comment, or other empty
 * category.
 *
 * @param {Node} node
 * @returns {Boolean}
 */
export function isEmptyNode(node : Node) : boolean {
    if (!isLeafNode(node)) {
        return false;
    }
    if (getLabel($(node)) === "CODE") {
        return true;
    }
    var text = wnodeString(node);
    if (startsWith(text, "*") || text.split("-")[0] === "0") {
        return true;
    }
    return false;
}

/**
 * Test whether a string is empty, i.e. a trace, comment, or other empty
 * category.
 *
 * @param {String} text the text to test
 * @returns {Boolean}
 */
export function isEmpty (text : string) : boolean {
    // TODO(AWE): should this be passed a node instead of a string, and then
    // test whether the node is a leaf or not before giving a return value?  This
    // would simplify the check I had to put in shouldIndexLeafNode, and prevent
    // future such errors.

    // TODO: use CODE-ness of a node, rather than starting with a bracket
    if (startsWith(text, "*") || startsWith(text, "{") ||
        text.split("-")[0] === "0") {
        return true;
    }
    return false;
};

/**
 * Test whether a node is a possible target for movement.
 *
 * @param {Node} node the node to operate on
 */
export function isPossibleTarget(node : Node) : boolean {
    // cannot move under a tag node
    // TODO(AWE): what is the calling convention?  can we optimize this jquery
    // call?
    if ($(node).children().first().is("span")) {
        return false;
    }
    return true;
};

/**
 * Test whether a node is the root node of a tree.
 *
 * @param {JQuery} node the node to operate on
 */
export function isRootNode(node : JQuery) : boolean {
    return node.filter("#sn0>.snode").length > 0;
};

/**
 * Test whether a node is a leaf using heuristics.
 *
 * This function respects the results of the `testValidLeafLabel` and
 * `testValidPhraseLabel` functions, if these are defined.
 *
 * @param {Node} node the node to operate on
 */
// TODO: restore
export function guessLeafNode(node : Node) : boolean {
    // var label = getLabel($(node)).replace("-FLAG", "");
    // if (typeof testValidLeafLabel   !== "undefined" &&
    //     typeof testValidPhraseLabel !== "undefined") {
    //     if (testValidPhraseLabel(label)) {
    //         return false;
    //     } else if (testValidLeafLabel(label)) {
    //         return true;
    //     } else {
    //         // not a valid label, fall back to structural check
    //         return isLeafNode(node);
    //     }
    // } else {
        return isLeafNode(node);
    // }
}

// ** Accessor functions

/**
 * Get the root of the tree that a node belongs to.
 *
 * @param {JQuery} node the node to operate on
 */
export function getTokenRoot(node : JQuery) : Node {
    return node.parents().addBack().filter("#sn0>.snode").get(0);
};

/**
 * Get the text dominated by a given node, without removing empty material.
 *
 * @param {Node} node the node to operate on
 */
// TODO: convert to take jquery?
export function wnodeString(node : Node) : string {
    var text = $(node).find(".wnode").text();
    return text;
}

/**
 * Get the ur-text dominated by a node.
 *
 * This function removes any empty material (traces, comments, etc.)  It does
 * not rejoin words which have been split.  It also does not add spaces.
 *
 * @param {JQuery} root the node to operate on
 */
export function currentText(root : JQuery) : string {
    var nodes = root.get(0).getElementsByClassName("wnode");
    var text = "",
        nv;
    for (var i = 0; i < nodes.length; i++) {
        if (!isEmptyNode(nodes[i])) {
            nv = nodes[i].childNodes[0].nodeValue;
            text += nv;
        }
    }
    return text;
}

/**
 * Get the label of a node.
 *
 * @param {JQuery} node the node to operate on
 */
export function getLabel(node : JQuery) : string {
    return $.trim(textNode(node).text());
}
exports.getLabel = getLabel;

/**
 * Get the first text node dominated by a node.
 * @private
 *
 * @param {JQuery} node the node to operate on
 */
export function textNode(node : JQuery) : JQuery {
    return node.contents().filter(function() : boolean {
                                         return this.nodeType === 3;
                                     }).first();
}

/**
 * Return the lemma of a node, or undefined if none.
 *
 * @param {JQuery} node
 * @returns {String}
 */
export function getLemma(node : JQuery) : string {
    return node.children(".wnode").children(".lemma").first().
        text().substring(1); // strip the dash
}

// TODO: document
export function getMetadata(node : JQuery) : Object {
    var m = node.prop("data-metadata");
    if (m) {
        return JSON.parse(m);
    } else {
        return undefined;
    }
}

/**
 * Test whether a node has a certain dash tag.
 *
 * @param {JQuery} node the node to operate on
 * @param {String} tag the dash tag to look for, without any dashes
 */
export function hasDashTag(node : JQuery, tag : string) : boolean {
    var label = getLabel(node);
    var tags = label.split("-").slice(1);
    return (tags.indexOf(tag) > -1);
}

// ** Index-related functions

/**
 * Return the index portion of a label, or -1 if no index.
 * @private
 *
 * @param {String} label the label to operate on
 */
export function parseIndex (label : string) : number {
    var index = -1;
    var lastindex = Math.max(label.lastIndexOf("-"),
                             label.lastIndexOf("="));
    if (lastindex === -1) {
        return -1;
    }
    var lastpart = parseInt(label.substr(lastindex + 1), 10);
    if (!isNaN(lastpart)) {
        index = Math.max(lastpart, index);
    }
    if (index === 0) {
        return -1;
    }
    return index;
}

/**
 * Return the non-index portion of a label.
 * @private
 *
 * @param {String} label the label to operate on
 */
export function parseLabel (label : string) : string {
    var index = parseIndex(label);
    if (index > 0) {
        var lastindex = Math.max(label.lastIndexOf("-"),
                                 label.lastIndexOf("="));
        var out = $.trim("" + label.substr(0, lastindex));
        return out;
    }
    return $.trim(label);
}

/**
 * Return the type of index attached to a label, either `"-"` or `"="`.
 * @private
 *
 * @param {String} label the label to operate on
 */
// TODO: document that this doesn't check whether there is a numerical index,
// or actually do the test
export function parseIndexType(label : string) : string {
    var lastindex = Math.max(label.lastIndexOf("-"), label.lastIndexOf("="));
    return label.charAt(lastindex);
}

/**
 * Return the movement index associated with a node.
 *
 * @param {JQuery} node the node to operate on
 */
export function getIndex(node : JQuery) : number {
    if (shouldIndexLeaf(node)) {
        return parseIndex(textNode(node.children(".wnode").first()).text());
    } else {
        return parseIndex(getLabel(node));
    }
}

/**
 * Return the type of index associated with a node, either `"-"` or `"="`.
 *
 * @param {JQuery} node the node to operate on
 */
// TODO: only used once, eliminate?
export function getIndexType (node : JQuery) : string {
    if (getIndex(node) < 0) {
        return;
    }
    var label;
    if (shouldIndexLeaf(node)) {
        label = wnodeString(node.get(0));
    } else {
        label = getLabel(node);
    }
    var lastpart = parseIndexType(label);
    return lastpart;
};

/**
 * Determine whether to place a movement index on the node label or the text.
 *
 * @param {JQuery} node the node to operate on
 */
export function shouldIndexLeaf(node : JQuery) : boolean {
    // The below check bogusly returns true if the leftmost node in a tree is
    // a trace, even if it is not a direct daughter.  Only do the more
    // complicated check if we are at a POS label, otherwise short circuit
    if (node.children(".wnode").length === 0) {
        return false;
    }
    var str = wnodeString(node.get(0));
    return (str.substring(0, 3) === "*T*" ||
            str.substring(0, 5) === "*ICH*" ||
            str.substring(0, 4) === "*CL*" ||
            $.trim(str) === "*");
}

/**
 * Get the highest index attested in a token.
 *
 * @param {Node} token the token to work on
 */
export function maxIndex(token : Node) : number {
    var allSNodes = $(token).find(".snode,.wnode");
    var ind = 0;
    var label;

    for (var i = 0; i < allSNodes.length; i++) {
        label = getLabel($(allSNodes[i]));
        ind = Math.max(parseIndex(label), ind);
    }
    return ind;
}

/**
 * Increase the value of a tree's indices by an amount
 * @private
 *
 * @param {JQuery} tokenRoot the token to operate on
 * @param {number} numberToAdd
 */
export function addToIndices(tokenRoot : JQuery, numberToAdd : number) : void {
    var nodes = tokenRoot.find(".snode,.wnode").addBack();
    nodes.each(function() : void {
        var curNode = $(this);
        var nindex = getIndex(curNode);
        if (nindex > 0) {
            if (shouldIndexLeaf(curNode)) {
                var leafText = wnodeString(this);
                leafText = parseLabel(leafText) + parseIndexType(leafText);
                textNode(curNode.children(".wnode").first()).text(
                    leafText + (nindex + numberToAdd));
            } else {
                var label = getLabel(curNode);
                label = parseLabel(label) + parseIndexType(label);
                label = label + (nindex + numberToAdd);
                setNodeLabel(curNode, label, true);
            }
        }
    });
};

export function removeIndex(node : JQuery) : void {
    node = $(node);
    if (getIndex(node) === -1) {
        return;
    }
    var label, setLabelFn;
    if (shouldIndexLeaf(node)) {
        label = wnodeString(node.get(0));
        setLabelFn = setLeafLabel;
    } else {
        label = getLabel(node);
        setLabelFn = setNodeLabel;
    }
    setLabelFn(node,
               label.substr(0, Math.max(label.lastIndexOf("-"),
                                        label.lastIndexOf("="))),
               true);
}

// ** Case-related functions

/**
 * Find the case associated with a node.
 *
 * This function respects the case-related variable `caseMarkers`.  It does
 * not check if a node is in `caseTags`.
 *
 * @param {JQuery} node
 * @returns {String} the case on the node, or `""` if none
 */
export function getCase(node : JQuery) : string {
    var label = parseLabel(getLabel(node));
    return labelGetCase(label);
};

/**
 * Find the case associated with a label.
 *
 * This function respects the case-related variable `caseMarkers`.
 *
 * @param {String} label
 * @returns {String} the case on the label, or `""` if none.
 */
export function labelGetCase(label : string) : string {
    var dashTags = label.split("-");
    if (_.contains(conf.caseTags, dashTags[0])) {
        dashTags = _.rest(dashTags);
        // TODO: this should be specified on the type of conf.caseMarkers
        var cases = <string[]>_.intersection(conf.caseMarkers, dashTags);
        if (cases.length === 0) {
            return "";
        } else if (cases.length === 1) {
            return cases[0];
        } else {
            throw "Tag has two cases: " + label;
        }
    } else {
        return "";
    }
}

/**
 * Test if a node has case.
 *
 * This function tests whether a node is in `caseTags`, and then whether it
 * has case.
 *
 * @param {JQuery} node
 * @returns {Boolean}
 */
export function hasCase(node : JQuery) : boolean {
    var label = parseLabel(getLabel(node));
    return labelGetCase(label) !== "";
}

/**
 * Test if a label has case.
 *
 * This function tests whether a label is in `caseTags`, and then whether it
 * has case.
 *
 * @param {String} label
 * @returns {Boolean}
 */
export function labelHasCase(label : string) : boolean {
    return labelGetCase(label) !== "";
}

/**
 * Test whether a node label corresponds to a case phrase.
 *
 * Based on the `casePhrases` configuration variable.
 *
 * @param {JQuery} nodeLabel
 * @returns {Boolean}
 */
export function isCasePhrase(node : JQuery) : boolean {
    return _.contains(conf.casePhrases, getLabel(node).split("-")[0]);
}

/**
 * Test whether a label can bear case.
 *
 * Respects the `caseTags` configuration variable.
 *
 * @param {String} label
 * @returns {Boolean}
 */
export function isCaseLabel(label : string) : boolean {
    var dashTags = label.split("-");
    return _.contains(conf.caseTags, dashTags[0]);
}

/**
 * Test whether a node can bear case.
 *
 * See ``isCaseLabel``.
 *
 * @param {JQuery} node
 * @returns {Boolean}
 */
export function isCaseNode(node : JQuery) : boolean {
    return isCaseLabel(getLabel(node));
}

/**
 * Remove the case from a string label.
 *
 * @param {String} label
 * @returns {String} the label without case
 */
export function labelRemoveCase(label : string) : string {
    if (labelHasCase(label)) {
        var theCase = labelGetCase(label);
        return label.replace("-" + theCase, "");
    }
    return label;
}

/**
 * Remove the case from a node.
 *
 * Does not record undo information.
 *
 * @param {JQuery} node
 */
function removeCase(node : JQuery) : void {
    if (!hasCase(node)) {
        return;
    }
    var label = getLabel(node);
    setNodeLabel(node, labelRemoveCase(label));
}

/**
 * Set the case on a node.
 *
 * Removes any previous case.  Does not record undo information.
 *
 * @param {JQuery} node
 */
export function setCase(node : JQuery, theCase : string) : void {
    removeCase(node);
    var osn = selection.get();
    selection.set(node.get(0));
    strucEdit.toggleExtension(theCase, [theCase]);
    selection.set(osn);
};

// TODO: toggling the case requires intelligence about where the dash tag
// should be put, which is only in toggleExtension

// function labelSetCase(label) {

// }

// ** Label-related functions
/**
 * Sets the label of a node
 *
 * Contains none of the heuristics of {@link setLabel}.
 *
 * @param {JQuery} node the target node
 * @param {String} label the new label
 */
export function setNodeLabel(node : JQuery,
                             label: string,
                             noUndo? : boolean) : void {
    if (noUndo) {
        undo.undoBeginTransaction();
    }
    if (node.hasClass("snode")) {
        if (label[label.length - 1] !== " ") {
            // Some other spots in the code depend on the label ending with a
            // space...
            label += " ";
        }
    } else if (node.hasClass("wnode")) {
        // Words cannot have a trailing space, or CS barfs on save.
        label = $.trim(label);
    } else {
        // should never happen
        return;
    }
    var oldLabel = parseLabel(getLabel(node));
    textNode(node).replaceWith(label);
    updateCssClass(node, oldLabel);
    if (noUndo) {
        undo.undoAbortTransaction();
    }
}

export function setLeafLabel(node : JQuery, label : string) : void {
    if (!node.hasClass(".wnode")) {
        // why do we do this?  We should be less fault-tolerant.
        node = node.children(".wnode").first();
    }
    textNode(node).replaceWith($.trim(label));
}

// TODO: only called from one place, with indices: possibly specialize name?
export function appendExtension(node : JQuery,
                                extension : number,
                                type? : string) : void {
    if (!type) {
        type = "-";
    }
    if (shouldIndexLeaf(node) && !isNaN(extension)) {
        // Adding an index to an empty category, and the EC is not an
        // empty operator.  The final proviso is needed because of
        // things like the empty WADJP in comparatives.
        var oldLabel = textNode(node.children(".wnode").first()).text();
        setLeafLabel(node, oldLabel + type + extension);
    } else {
        setNodeLabel(node, getLabel(node) + type + extension, true);
    }
}
// * Uncategorized

// TODO: more perspicuous name
export function changeJustLabel (oldlabel : string, newlabel : string) : string {
    var label = oldlabel;
    var index = parseIndex(oldlabel);
    if (index > 0) {
        label = parseLabel(oldlabel);
        var indextype = parseIndexType(oldlabel);
        return newlabel + indextype + index;
    }
    return newlabel;
}

// This function takes 3 arguments: a node label with dash tags and possibly
// indices, a dash tag to toggle (no dash), and a list of possible extensions
// (in L-to-R order).  It returns a string, which is the label with
// transformations applied
export function toggleStringExtension (oldlabel : string,
                                       extension : string,
                                       extensionList : string[]) : string {
    if (extension[0] === "-") {
        // temporary compatibility hack for old configs
        extension = extension.substring(1);
        extensionList = extensionList.map(function(s : string) : string {
            return s.substring(1);
        });
    }
    var index = parseIndex(oldlabel);
    var indextype = "";
    if (index > 0) {
        indextype = parseIndexType(oldlabel);
    }
    var currentLabel = parseLabel(oldlabel);

    // The strategy here is as follows:
    // - split the label into an array of dash tags
    // - operate on the array
    // - reform the array into a string
    var currentLabelParts = currentLabel.split("-");
    var labelBase = currentLabelParts.shift();
    var idx = currentLabelParts.indexOf(extension);

    if (idx > -1) {
        // currentLabelParts contains extension, remove it
        currentLabelParts.splice(idx, 1);
    } else {
        idx = extensionList.indexOf(extension);
        if (idx > -1) {
            // Loop through the list, stop when we pass the right spot
            for (var i = 0; i < currentLabelParts.length; i++) {
                if (idx < extensionList.indexOf(currentLabelParts[i])) {
                    break;
                }
            }
            currentLabelParts.splice(i, 0, extension);
        } else {
            currentLabelParts.push(extension);
        }
    }

    var out = labelBase;
    if (currentLabelParts.length > 0) {
        out += "-" + currentLabelParts.join("-");
    }
    if (index > 0) {
        out += indextype;
        out += index;
    }
    return out;
};

export function lookupNextLabel(oldlabel : string, labels : string[]) : string {
    // labels is either: an array, an object
    var newlabel = null;
    // TODO(AWE): make this more robust!
    if (!(labels instanceof Array)) {
        var prefix = oldlabel.split("-")[0];
        var newLabels = labels[prefix];
        if (!newLabels) {
            newLabels = _.values(labels)[0];
        }
        labels = newLabels;
    }
    for (var i = 0; i < labels.length; i++) {
        if (labels[i] === parseLabel(oldlabel)) {
            if (i < labels.length - 1) {
                newlabel = labels[i + 1];
            } else {
                newlabel = labels[0];
            }
        }
    }
    if (!newlabel) {
        newlabel = labels[0];
    }
    newlabel = changeJustLabel(oldlabel, newlabel);

    return newlabel;
};

// TODO(AWE): add getMetadataTU fn, to also do trickle-up of metadata.

// TODO: unused?
// TODO: don't pass tokenroot in as id, instead use the jquery object itself
// and use node.find()
// function getNodesByIndex(tokenRoot, ind) {
//     var nodes = $("#" + tokenRoot + " .snode,#" + tokenRoot +
//                   " .wnode").filter(
//         function(index) {
//             // TODO(AWE): is this below correct?  optimal?
//             return getIndex($(this)) === ind;
//         });
//     return nodes;
// }

/*
 * returns value of lowest index if there are any indices, returns -1 otherwise
*/
/* TODO: unused?
function minIndex (tokenRoot, offset) {
    var allSNodes = $("#" + tokenRoot + " .snode,#" + tokenRoot + " .wnode");
    var highnumber = 9000000;
    var index = highnumber;
    var label, lastpart;
    for (var i=0; i < allSNodes.length; i++){
        label = getLabel($(allSNodes[i]));
        lastpart = parseInt(label.substr(label.lastIndexOf("-")+1));
        if (!isNaN(parseInt(lastpart))) {
            if (lastpart != 0 && lastpart >=offset) {
                index = Math.min(lastpart, index);
            }
        }
    }
    if (index == highnumber) {
        return -1;
    }

    if (index < offset) {
        return -1;
    }

    return index;
}
 */

/* something I wrote long ago, and never used, but might be useful someday
function nextNodeSuchThat(node, pred) {
    var next = node.nextElementSibling;
    if (next) {
        if (pred(next)) {
            return next;
        } else {
            return nextNodeSuchThat(next, pred);
        }
    } else if (node.parentNode) {
        return nextNodeSuchThat(node.parentNode, pred);
    } else {
        return null;
    }
}
*/

// Local Variables:
// eval: (outline-minor-mode 1)
// End:
