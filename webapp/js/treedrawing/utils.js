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

/*global require: false, exports: true */

/*jshint browser: true */

var $ = require("jquery"),
    _ = require("lodash"),
    globals = require("./global"),
    startnode = globals.startnode,
    strucEdit = require("./struc-edit"),
    conf = require("./config"),
    undo = require("./undo");

/*
 * Utility functions for Annotald.
 */

// TODOs: mark @privates appropriately, consider naming scheme for dom vs JQ args

// * UI helper functions

var messageHistory = "";

/**
 * Log the message in the message history.
 * @private
 */
function logMessage(msg) {
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
function scrollToNext(selector) {
    var docViewTop = $(window).scrollTop();
    var nextError = $(selector).filter(
        function () {
            // Magic number alert!  Not sure if the +5 is needed...
            return $(this).offset().top > docViewTop + 5;
        }).first();
    if (nextError.length === 1) {
        window.scroll(0, nextError.offset().top);
        return nextError;
    }
    return undefined;
}
exports.scrollToNext = scrollToNext;

/**
 * Update the CSS class of a node to reflect its label.
 *
 * @param {JQuery} node
 * @param {String} oldlabel (optional) the former label of this node
 */
function updateCssClass(node, oldlabel) {
    if (!node.hasClass("snode")) {
        return;
    }
    if (oldlabel) {
        // should never be needed, but a bit of defensiveness can't hurt
        oldlabel = parseLabel($.trim(oldlabel));
    } else {
        // oldlabel wasn't supplied -- try to guess
        oldlabel = node.prop("class").split(" ");
        oldlabel = _.find(oldlabel, function (s) { return (/[A-Z-]/).match(s); });
    }
    node.removeClass(oldlabel);
    node.addClass(parseLabel(getLabel(node)));
}
exports.updateCssClass = updateCssClass;

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
exports.hasLemma = function hasLemma(node) {
    return node.children(".wnode").children(".lemma").length === 1;
};

/**
 * Test whether a node is a purely structural leaf.
 *
 * @param {Node} node the node to operate on
 */
function isLeafNode(node) {
    return $(node).children(".wnode").size() > 0;
}
exports.isLeafNode = isLeafNode;

/**
 * Test whether a given node is empty, i.e. a trace, comment, or other empty
 * category.
 *
 * @param {Node} node
 * @returns {Boolean}
 */
function isEmptyNode(node) {
    if (!isLeafNode(node)) {
        return false;
    }
    if (getLabel($(node)) === "CODE") {
        return true;
    }
    var text = wnodeString(node);
    if (text.startsWith("*") || text.split("-")[0] === "0") {
        return true;
    }
    return false;
}
exports.isEmptyNode = isEmptyNode;

/**
 * Test whether a string is empty, i.e. a trace, comment, or other empty
 * category.
 *
 * @param {String} text the text to test
 * @returns {Boolean}
 */
exports.isEmpty = function isEmpty (text) {
    // TODO(AWE): should this be passed a node instead of a string, and then
    // test whether the node is a leaf or not before giving a return value?  This
    // would simplify the check I had to put in shouldIndexLeafNode, and prevent
    // future such errors.

    // TODO: use CODE-ness of a node, rather than starting with a bracket
    if (text.startsWith("*") || text.startsWith("{") ||
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
exports.isPossibleTarget = function isPossibleTarget(node) {
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
exports.isRootNode = function isRootNode(node) {
    return node.filter("#sn0>.snode").size() > 0;
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
// exports.guessLeafNode = function guessLeafNode(node) {
//     var label = getLabel($(node)).replace("-FLAG", "");
//     if (typeof testValidLeafLabel   !== "undefined" &&
//         typeof testValidPhraseLabel !== "undefined") {
//         if (testValidPhraseLabel(label)) {
//             return false;
//         } else if (testValidLeafLabel(label)) {
//             return true;
//         } else {
//             // not a valid label, fall back to structural check
//             return isLeafNode(node);
//         }
//     } else {
//         return isLeafNode(node);
//     }
// };

// ** Accessor functions

/**
 * Get the root of the tree that a node belongs to.
 *
 * @param {JQuery} node the node to operate on
 */
exports.getTokenRoot = function getTokenRoot(node) {
    return node.parents().addBack().filter("#sn0>.snode").get(0);
};

/**
 * Get the text dominated by a given node, without removing empty material.
 *
 * @param {Node} node the node to operate on
 */
function wnodeString(node) {
    var text = $(node).find(".wnode").text();
    return text;
}
exports.wnodeString = wnodeString;

/**
 * Get the ur-text dominated by a node.
 *
 * This function removes any empty material (traces, comments, etc.)  It does
 * not rejoin words which have been split.  It also does not add spaces.
 *
 * @param {JQuery} root the node to operate on
 */
exports.currentText = function currentText(root) {
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
};

/**
 * Get the label of a node.
 *
 *@param {JQuery} node the node to operate on
 */
function getLabel(node) {
    return $.trim(textNode(node).text());
}
exports.getLabel = getLabel;

/**
 * Get the first text node dominated by a node.
 * @private
 *
 * @param {JQuery} node the node to operate on
 */
function textNode(node) {
    return node.contents().filter(function() {
                                         return this.nodeType === 3;
                                     }).first();
}
exports.textNode = textNode;

/**
 * Return the lemma of a node, or undefined if none.
 *
 * @param {JQuery} node
 * @returns {String}
 */
exports.getLemma = function getLemma(node) {
    return node.children(".wnode").children(".lemma").first().
        text().substring(1); // strip the dash
};

// TODO: document
exports.getMetadata = function getMetadata(node) {
    var m = node.prop("data-metadata");
    if (m) {
        return JSON.parse(m);
    } else {
        return undefined;
    }
};

/**
 * Test whether a node has a certain dash tag.
 *
 * @param {JQuery} node the node to operate on
 * @param {String} tag the dash tag to look for, without any dashes
 */
exports.hasDashTag = function hasDashTag(node, tag) {
    var label = getLabel(node);
    var tags = label.split("-").slice(1);
    return (tags.indexOf(tag) > -1);
};

// ** Index-related functions

/**
 * Return the index portion of a label, or -1 if no index.
 * @private
 *
 * @param {String} label the label to operate on
 */
function parseIndex (label) {
    var index = -1;
    var lastindex = Math.max(label.lastIndexOf("-"),label.lastIndexOf("="));
    if (lastindex === -1) {
        return -1;
    }
    var lastpart = parseInt(label.substr(lastindex+1), 10);
    if(!isNaN(parseInt(lastpart, 10))) {
        index = Math.max(lastpart, index);
    }
    if (index === 0) {
        return -1;
    }
    return index;
}
exports.parseIndex = parseIndex;

/**
 * Return the non-index portion of a label.
 * @private
 *
 * @param {String} label the label to operate on
 */
function parseLabel (label) {
    var index = parseIndex(label);
    if (index > 0) {
        var lastindex = Math.max(label.lastIndexOf("-"),
                                 label.lastIndexOf("="));
        var out = $.trim("" + label.substr(0,lastindex));
        return out;
    }
    return $.trim(label);
}
exports.parseLabel = parseLabel;

/**
 * Return the type of index attached to a label, either `"-"` or `"="`.
 * @private
 *
 * @param {String} label the label to operate on
 */
// TODO: document that this doesn't check whether there is a numerical index,
// or actually do the test
function parseIndexType(label) {
    var lastindex = Math.max(label.lastIndexOf("-"), label.lastIndexOf("="));
    return label.charAt(lastindex);
}
exports.parseIndexType = parseIndexType;

/**
 * Return the movement index associated with a node.
 *
 * @param {JQuery} node the node to operate on
 */
function getIndex(node) {
    if (shouldIndexLeaf(node)) {
        return parseIndex(textNode(node.children(".wnode").first()).text());
    } else {
        return parseIndex(getLabel(node));
    }
}
exports.getIndex = getIndex;

/**
 * Return the type of index associated with a node, either `"-"` or `"="`.
 *
 * @param {JQuery} node the node to operate on
 */
// TODO: only used once, eliminate?
exports.getIndexType = function getIndexType (node) {
    if (getIndex(node) < 0) {
        return -1;
    }
    var label;
    if (shouldIndexLeaf(node)) {
        label = wnodeString(node);
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
function shouldIndexLeaf(node) {
    // The below check bogusly returns true if the leftmost node in a tree is
    // a trace, even if it is not a direct daughter.  Only do the more
    // complicated check if we are at a POS label, otherwise short circuit
    if (node.children(".wnode").size() === 0) {
        return false;
    }
    var str = wnodeString(node);
    return (str.substring(0,3) === "*T*" ||
            str.substring(0,5) === "*ICH*" ||
            str.substring(0,4) === "*CL*" ||
            $.trim(str) === "*");
}
exports.shouldIndexLeaf = shouldIndexLeaf;

/**
 * Get the highest index attested in a token.
 *
 * @param {Node} token the token to work on
 */
function maxIndex(token) {
    var allSNodes = $(token).find(".snode,.wnode");
    var ind = 0;
    var label;

    for (var i = 0; i < allSNodes.length; i++) {
        label = getLabel($(allSNodes[i]));
        ind = Math.max(parseIndex(label), ind);
    }
    return ind;
}
exports.maxIndex = maxIndex;

/**
 * Increase the value of a tree's indices by an amount
 * @private
 *
 * @param {JQuery} tokenRoot the token to operate on
 * @param {number} numberToAdd
 */
exports.addToIndices = function addToIndices(tokenRoot, numberToAdd) {
    var nodes = tokenRoot.find(".snode,.wnode").addBack();
    nodes.each(function() {
        var curNode = $(this);
        var nindex = getIndex(curNode);
        if (nindex > 0) {
            if (shouldIndexLeaf(curNode)) {
                var leafText = wnodeString(curNode);
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

exports.removeIndex = function removeIndex(node) {
    node = $(node);
    if (getIndex(node) === -1) {
        return;
    }
    var label, setLabelFn;
    if (shouldIndexLeaf(node)) {
        label = wnodeString(node);
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
exports.getCase = function getCase(node) {
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
function labelGetCase(label) {
    var dashTags = label.split("-");
    if (_.contains(conf.caseTags, dashTags[0])) {
        dashTags = _.rest(dashTags);
        var cases = _.intersection(conf.caseMarkers, dashTags);
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
exports.labelGetCase = labelGetCase;

/**
 * Test if a node has case.
 *
 * This function tests whether a node is in `caseTags`, and then whether it
 * has case.
 *
 * @param {JQuery} node
 * @returns {Boolean}
 */
function hasCase(node) {
    var label = parseLabel(getLabel(node));
    return labelGetCase(label);
}
exports.hasCase = hasCase;

/**
 * Test if a label has case.
 *
 * This function tests whether a label is in `caseTags`, and then whether it
 * has case.
 *
 * @param {String} label
 * @returns {Boolean}
 */
function labelHasCase(label) {
    return labelGetCase(label) !== "";
}
exports.labelHasCase = labelHasCase;

/**
 * Test whether a node label corresponds to a case phrase.
 *
 * Based on the `casePhrases` configuration variable.
 *
 * @param {JQuery} nodeLabel
 * @returns {Boolean}
 */
exports.isCasePhrase = function isCasePhrase(node) {
    return _.contains(conf.casePhrases, getLabel(node).split("-")[0]);
};

/**
 * Test whether a label can bear case.
 *
 * Respects the `caseTags` configuration variable.
 *
 * @param {String} label
 * @returns {Boolean}
 */
function isCaseLabel(label) {
    var dashTags = label.split("-");
    return _.contains(conf.caseTags, dashTags[0]);
}
exports.isCaseLabel = isCaseLabel;

/**
 * Test whether a node can bear case.
 *
 * See ``isCaseLabel``.
 *
 * @param {JQuery} node
 * @returns {Boolean}
 */
exports.isCaseNode = function isCaseNode(node) {
    return isCaseLabel(getLabel(node));
};

/**
 * Remove the case from a string label.
 *
 * @param {String} label
 * @returns {String} the label without case
 */
function labelRemoveCase(label) {
    if (labelHasCase(label)) {
        var theCase = labelGetCase(label);
        return label.replace("-" + theCase, "");
    }
    return label;
}
exports.labelRemoveCase = labelRemoveCase;

/**
 * Remove the case from a node.
 *
 * Does not record undo information.
 *
 * @param {JQuery} node
 */
function removeCase(node) {
    if (!hasCase(node)) {
        return;
    }
    var label = getLabel(node);
    setNodeLabel(node, labelRemoveCase(label));
}
exports.removeCase = removeCase;

/**
 * Set the case on a node.
 *
 * Removes any previous case.  Does not record undo information.
 *
 * @param {JQuery} node
 */
exports.setCase = function setCase(node, theCase) {
    removeCase(node);
    var osn = startnode;
    startnode = node;
    strucEdit.toggleExtension(theCase, [theCase]);
    startnode = osn;
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
function setNodeLabel(node, label, noUndo) {
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

function setLeafLabel(node, label) {
    if (!node.hasClass(".wnode")) {
        // why do we do this?  We should be less fault-tolerant.
        node = node.children(".wnode").first();
    }
    textNode(node).replaceWith($.trim(label));
}
// * Uncategorized



// TODO: more perspicuous name
function changeJustLabel (oldlabel, newlabel) {
    var label = oldlabel;
    var index = parseIndex(oldlabel);
    if (index > 0) {
        label = parseLabel(oldlabel);
        var indextype = parseIndexType(oldlabel);
        return newlabel+indextype+index;
    }
    return newlabel;
}
exports.changeJustLabel = changeJustLabel;

// This function takes 3 arguments: a node label with dash tags and possibly
// indices, a dash tag to toggle (no dash), and a list of possible extensions
// (in L-to-R order).  It returns a string, which is the label with
// transformations applied
exports.toggleStringExtension = function toggleStringExtension (oldlabel,
                                                                extension,
                                                                extensionList) {
    if (extension[0] === "-") {
        // temporary compatibility hack for old configs
        extension = extension.substring(1);
        extensionList = extensionList.map(function(s) { return s.substring(1); });
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
    currentLabel = currentLabel.split("-");
    var labelBase = currentLabel.shift();
    var idx = currentLabel.indexOf(extension);

    if (idx > -1) {
        // currentLabel contains extension, remove it
        currentLabel.splice(idx, 1);
    } else {
        idx = extensionList.indexOf(extension);
        if (idx > -1) {
            // Loop through the list, stop when we pass the right spot
            for (var i = 0; i < currentLabel.length; i++) {
                if (idx < extensionList.indexOf(currentLabel[i])) {
                    break;
                }
            }
            currentLabel.splice(i, 0, extension);
        } else {
            currentLabel.push(extension);
        }
    }

    var out = labelBase;
    if (currentLabel.length > 0) {
        out += "-" + currentLabel.join("-");
    }
    if (index > 0) {
        out += indextype;
        out += index;
    }
    return out;
};

exports.lookupNextLabel = function lookupNextLabel(oldlabel, labels) {
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
    newlabel = changeJustLabel(oldlabel,newlabel);

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
