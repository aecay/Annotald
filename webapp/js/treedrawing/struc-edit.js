/*global require: false, exports: true */

/*jshint quotmark: false, camelcase: false, browser: true, devel: true */

var $ = require("jquery"),
    globals = require("./global"),
    startnode = globals.startnode,
    endnode = globals.endnode,
    utils = require("./utils"),
    selection = require("./selection"),
    undo = require("./undo"),
    events = require("./events"),
    conf = require("./config");

// * Coindexation

/**
 * Coindex nodes.
 *
 * Coindex the two selected nodes.  If they are already coindexed, toggle
 * types of coindexation (normal -> gapping -> backwards gapping -> double
 * gapping -> no indices).  If only one node is selected, remove its index.
 */
function coIndex() {
    if (startnode && !endnode) {
        if (utils.getIndex($(startnode)) > 0) {
            undo.touchTree($(startnode));
            utils.removeIndex(startnode);
        }
    } else if (startnode && endnode) {
        // don't do anything if different token roots
        var startRoot = utils.getTokenRoot($(startnode));
        var endRoot = utils.getTokenRoot($(endnode));
        if (startRoot !== endRoot) {
            return;
        }

        undo.touchTree($(startnode));
        // if both nodes already have an index
        if (utils.getIndex($(startnode)) > 0 && utils.getIndex($(endnode)) > 0) {
            // and if it is the same index
            if (utils.getIndex($(startnode)) === utils.getIndex($(endnode))) {
                var theIndex = utils.getIndex($(startnode));
                var types = "" + utils.getIndexType($(startnode)) +
                    "" + utils.getIndexType($(endnode));
                // remove it

                if (types === "=-") {
                    utils.removeIndex(startnode);
                    utils.removeIndex(endnode);
                    utils.appendExtension($(startnode), theIndex, "=");
                    utils.appendExtension($(endnode), theIndex, "=");
                } else if( types === "--" ){
                    utils.removeIndex(endnode);
                    utils.appendExtension($(endnode),
                                          utils.getIndex($(startnode)),
                                          "=");
                } else if (types === "-=") {
                    utils.removeIndex(startnode);
                    utils.removeIndex(endnode);
                    utils.appendExtension($(startnode), theIndex,"=");
                    utils.appendExtension($(endnode), theIndex,"-");
                } else if (types === "==") {
                    utils.removeIndex(startnode);
                    utils.removeIndex(endnode);
                }
            }
        } else if (utils.getIndex($(startnode)) > 0 &&
                   utils.getIndex($(endnode)) === -1) {
            utils.appendExtension($(endnode), utils.getIndex($(startnode)));
        } else if (utils.getIndex($(startnode)) === -1 &&
                   utils.getIndex($(endnode)) > 0) {
            utils.appendExtension($(startnode), utils.getIndex($(endnode)));
        } else { // no indices here, so make them
            var index = utils.maxIndex(startRoot) + 1;
            utils.appendExtension($(startnode), index);
            utils.appendExtension($(endnode), index);
        }
    }
}
// * Movement

/**
 * Move the selected node(s) to a new position.
 *
 * The movement operation must not change the text of the token.
 *
 * Empty categories are not allowed to be moved as a leaf.  However, a
 * non-terminal containing only empty categories can be moved.
 *
 * @param {Node} parent the parent node to move selection under
 *
 * @returns {Boolean} whether the operation was successful
 */
function moveNode(parent) {
    var parent_ip = $(startnode).parents("#sn0>.snode,#sn0").first();
    var other_parent = $(parent).parents("#sn0>.snode,#sn0").first();
    if (parent === document.getElementById("sn0") ||
        !parent_ip.is(other_parent)) {
        parent_ip = $("#sn0");
    }
    var parent_before;
    var textbefore = utils.currentText(parent_ip);
    if (!utils.isPossibleTarget(parent) || // can't move under a tag node
        $(startnode).parent().children().length === 1 || // can't move an only child
        $(parent).parents().is(startnode) || // can't move under one's own child
        utils.isEmptyNode(startnode) // can't move an empty leaf node by itself
       )
    {
        selection.clearSelection();
        return false;
    } else if ($(startnode).parents().is(parent)) {
        // move up if moving to a node that is already my parent
        if ($(startnode).parent().children().first().is(startnode)) {
            if ($(startnode).parentsUntil(parent).slice(0,-1).
                filter(":not(:first-child)").size() > 0) {
                selection.clearSelection();
                return false;
            }
            if (parent === document.getElementById("sn0")) {
                undo.touchTree($(startnode));
                undo.registerNewRootTree($(startnode));
            } else {
                undo.touchTree($(startnode));
            }
            $(startnode).insertBefore($(parent).children().filter(
                                                 $(startnode).parents()));
            if (utils.currentText(parent_ip) !== textbefore) {
                alert("failed what should have been a strict test");
            }
        } else if ($(startnode).parent().children().last().is(startnode)) {
            if ($(startnode).parentsUntil(parent).slice(0,-1).
                filter(":not(:last-child)").size() > 0) {
                selection.clearSelection();
                return false;
            }
            if (parent === document.getElementById("sn0")) {
                undo.touchTree($(startnode));
                undo.registerNewRootTree($(startnode));
            } else {
                undo.touchTree($(startnode));
            }
            $(startnode).insertAfter($(parent).children().
                                     filter($(startnode).parents()));
            if (utils.currentText(parent_ip) !== textbefore) {
                alert("failed what should have been a strict test");
            }
        } else {
            // cannot move from this position
            selection.clearSelection();
            return false;
        }
    } else {
        // otherwise move under my sister
        var tokenMerge = utils.isRootNode( $(startnode) );
        var maxindex = utils.maxIndex(utils.getTokenRoot($(parent)));
        var movednode = $(startnode);

        // NOTE: currently there are no more stringent checks below; if that
        // changes, we might want to demote this
        parent_before = parent_ip.clone();

        // where a and b are DOM elements (not jquery-wrapped),
        // a.compareDocumentPosition(b) returns an integer.  The first (counting
        // from 0) bit is set if B precedes A, and the second bit is set if A
        // precedes B.

        // TODO: perhaps here and in the immediately following else if it is
        // possible to simplify and remove the compareDocumentPosition call,
        // since the jQuery subsumes it
        if (parent.compareDocumentPosition(startnode) & 0x4) { // jshint ignore:line
            // check whether the nodes are adjacent.  Ideally, we would like
            // to say selfAndParentsUntil, but no such jQuery fn exists, thus
            // necessitating the disjunction.
            // TODO: too strict
            // &&
            // $(startnode).prev().is(
            //     $(parent).parentsUntil(startnode.parentNode).last()) ||
            // $(startnode).prev().is(parent)

            // parent precedes startnode
            undo.undoBeginTransaction();
            if (tokenMerge) {
                undo.registerDeletedRootTree($(startnode));
                undo.touchTree($(parent));
                // TODO: this will bomb if we are merging more than 2 tokens
                // by multiple selection.
                utils.addToIndices(movednode, maxindex);
            } else {
                undo.touchTree($(startnode));
                undo.touchTree($(parent));
            }
            movednode.appendTo(parent);
            if (utils.currentText(parent_ip) !== textbefore)  {
                undo.undoAbortTransaction();
                parent_ip.replaceWith(parent_before);
                if (parent_ip.prop("id") === "sn0") {
                    $("#sn0").mousedown(events.handleNodeClick);
                }
                selection.clearSelection();
                return false;
            } else {
                undo.undoEndTransaction();
            }
        } else if ((parent.compareDocumentPosition(startnode) & 0x2)) { //jshint ignore:line
            // &&
            // $(startnode).next().is(
            //     $(parent).parentsUntil(startnode.parentNode).last()) ||
            // $(startnode).next().is(parent)

            // startnode precedes parent
            undo.undoBeginTransaction();
            if (tokenMerge) {
                undo.registerDeletedRootTree($(startnode));
                undo.touchTree($(parent));
                utils.addToIndices(movednode, maxindex);
            } else {
                undo.touchTree($(startnode));
                undo.touchTree($(parent));
            }
            movednode.insertBefore($(parent).children().first());
            if (utils.currentText(parent_ip) !== textbefore) {
                undo.undoAbortTransaction();
                parent_ip.replaceWith(parent_before);
                if (parent_ip === "sn0") {
                    $("#sn0").mousedown(events.handleNodeClick);
                }
                selection.clearSelection();
                return false;
            } else {
                undo.undoEndTransaction();
            }
        } // TODO: conditional branches not exhaustive
    }
    selection.clearSelection();
    return true;
}

/**
 * Move several nodes.
 *
 * The two selected nodes must be sisters, and they and all intervening sisters
 * will be moved as a unit.  Calls {@link moveNode} to do the heavy lifting.
 *
 * @param {Node} parent the parent to move the selection under
 */
exports.moveNodes = function moveNodes(parent) {
    if (!startnode || !endnode) {
        return;
    }
    undo.undoBeginTransaction();
    undo.touchTree($(startnode));
    undo.touchTree($(parent));
    if (startnode.compareDocumentPosition(endnode) & 0x2) { //jshint ignore:line
        // endnode precedes startnode, reverse them
        var temp = startnode;
        startnode = endnode;
        endnode = temp;
    }
    if (startnode.parentNode === endnode.parentNode) {
        // collect startnode and its sister up until endnode
        $(startnode).add($(startnode).nextUntil(endnode)).
            add(endnode).
            wrapAll('<div xxx="newnode" class="snode">XP</div>');

    } else {
        return; // they are not sisters
    }
    var toselect = $(".snode[xxx=newnode]").first();
    toselect = toselect.get(0);
    // BUG when making XP and then use context menu: TODO XXX

    startnode = toselect;
    var res = undo.ignoringUndo(function () { moveNode(parent); });
    if (res) {
        undo.undoEndTransaction();
    } else {
        undo.undoAbortTransaction();
    }
    startnode = $(".snode[xxx=newnode]").first().get(0);
    endnode = undefined;
    pruneNode();
    selection.clearSelection();
};

// * Deletion

/**
 * Delete a node.
 *
 * The node can only be deleted if doing so does not affect the text, i.e. it
 * directly dominates no non-empty terminals.
 */
function pruneNode() {
    if (startnode && !endnode) {
        if (utils.isLeafNode(startnode) && utils.isEmptyNode(startnode)) {
            // it is ok to delete leaf if it is empty/trace
            if (utils.isRootNode($(startnode))) {
                // perversely, it is possible to have a leaf node at the root
                // of a file.
                undo.registerDeletedRootTree($(startnode));
            } else {
                undo.touchTree($(startnode));
            }
            var idx = utils.getIndex($(startnode));
            if (idx > 0) {
                var root = $(utils.getTokenRoot($(startnode)));
                var sameIdx = root.find('.snode').filter(function () {
                    return utils.getIndex($(this)) === idx;
                }).not(startnode);
                if (sameIdx.length === 1) {
                    var osn = startnode;
                    startnode = sameIdx.get(0);
                    coIndex();
                    startnode = osn;
                }
            }
            $(startnode).remove();
            selection.clearSelection();
            selection.updateSelection();
            return;
        } else if (utils.isLeafNode(startnode)) {
            // but other leaves are not deleted
            return;
        } else if (startnode === document.getElementById("sn0")) {
            return;
        }

        var toselect = $(startnode).children().first();
        undo.touchTree($(startnode));
        $(startnode).replaceWith($(startnode).children());
        selection.clearSelection();
        selection.selectNode(toselect.get(0));
        selection.updateSelection();
    }
}

// * Creation

// TODO: the hardcoding of defaults in this function is ugly.  We should
// supply a default heuristic fn to try to guess these, then allow
// settings.js to override it.

// TODO: maybe put the heuristic into leafbefore/after, and leave this fn clean?

/**
 * Create a leaf node adjacent to the selection, or a given target.
 *
 * @param {Boolean} before whether to create the node before or after selection
 * @param {String} label the label to give the new node
 * @param {String} word the text to give the new node
 * @param {Node} target where to put the new node (default: selected node)
 */
function makeLeaf(before, label, word, target) {
    if (!(target || startnode)) {
        return;
    }

    if (!label) {
        label = "NP-SBJ";
    }
    if (!word) {
        word = "*con*";
    }
    if (!target) {
        target = startnode;
    }

    undo.undoBeginTransaction();
    var isRootLevel = false;
    if (utils.isRootNode($(target))) {
        isRootLevel = true;
    } else {
        undo.touchTree($(target));
    }

    var lemma = false;
    var temp = word.split("-");
    if (temp.length > 1) {
        lemma = temp.pop();
        word = temp.join("-");
    }

    var doCoindex = false;

    if (endnode) {
        var startRoot = utils.getTokenRoot($(startnode));
        var endRoot = utils.getTokenRoot($(endnode));
        if (startRoot === endRoot) {
            word = "*ICH*";
            label = utils.getLabel($(endnode));
            if (label.startsWith("W")) {
                word = "*T*";
                label = label.substr(1).replace(/-[0-9]+$/, "");
            } else if (label.split("-").indexOf("CL") > -1) {
                word = "*CL*";
                label = utils.getLabel($(endnode)).replace("-CL", "");
                if (label.substring(0,3) === "PRO") {
                    label = "NP";
                }
            }
            doCoindex = true;
        } else { // abort if selecting from different tokens
            undo.undoAbortTransaction();
            return;
        }
    }

    var newleaf = "<div class='snode " + label + "'>" + label +
        "<span class='wnode'>" + word;
    if (lemma) {
        newleaf += "<span class='lemma'>-" + lemma +
            "</span>";
    }
    newleaf += "</span></div>\n";
    newleaf = $(newleaf);
    if (before) {
        newleaf.insertBefore(target);
    } else {
        newleaf.insertAfter(target);
    }
    if (doCoindex) {
        startnode = newleaf.get(0);
        coIndex();
    }
    startnode = null;
    endnode = null;
    selection.selectNode(newleaf.get(0));
    selection.updateSelection();
    if (isRootLevel) {
        undo.registerNewRootTree(newleaf);
    }
    undo.undoEndTransaction();
}
exports.makeLeaf = makeLeaf;

/**
 * Create a leaf node before the selected node.
 *
 * Uses heuristic to determine whether the new leaf is to be a trace, empty
 * subject, etc.
 */
exports.leafBefore = function leafBefore() {
    makeLeaf(true);
};

/**
 * Create a leaf node after the selected node.
 *
 * Uses heuristic to determine whether the new leaf is to be a trace, empty
 * subject, etc.
 */
exports.leafAfter = function leafAfter() {
    makeLeaf(false);
};

/**
 * Create a phrasal node.
 *
 * The node will dominate the selected node or (if two sisters are selected)
 * the selection and all intervening sisters.
 *
 * @param {String} [label] the label to give the new node (default: XP)
 */
function makeNode(label) {
    // check if something is selected
    if (!startnode) {
        return;
    }
    if (!label) {
        label = "XP";
    }
    var rootLevel = utils.isRootNode($(startnode));
    undo.undoBeginTransaction();
    if (rootLevel) {
        undo.registerDeletedRootTree($(startnode));
    } else {
        undo.touchTree($(startnode));
    }
    var parent_ip = $(startnode).parents("#sn0>.snode,#sn0").first();
    var parent_before = parent_ip.clone();
    var newnode = '<div class="snode ' + label + '">' + label + ' </div>\n';
    // make end = start if only one node is selected
    if (!endnode) {
        // if only one node, wrap around that one
        $(startnode).wrapAll(newnode);
    } else {
        if (startnode.compareDocumentPosition(endnode) & 0x2) { // jshint ignore:line
            // startnode and endnode in wrong order, reverse them
            var temp = startnode;
            startnode = endnode;
            endnode = temp;
        }

        // check if they are really sisters XXXXXXXXXXXXXXX
        if ($(startnode).siblings().is(endnode)) {
            // then, collect startnode and its sister up until endnode
            var oldtext = utils.currentText(parent_ip);
            $(startnode).add($(startnode).nextUntil(endnode)).add(
                endnode).wrapAll(newnode);
            // undo if this messed up the text order
            if(utils.currentText(parent_ip) !== oldtext) {
                // TODO: is this plausible? can we remove the check?
                parent_ip.replaceWith(parent_before);
                undo.undoAbortTransaction();
                selection.clearSelection();
                return;
            }
        } else {
            return;
        }
    }

    var toselect = $(startnode).parent();

    selection.clearSelection();

    if (rootLevel) {
        undo.registerNewRootTree(toselect);
    }

    undo.undoEndTransaction();

    selection.selectNode(toselect.get(0));
    selection.updateSelection();
}
exports.makeNode = makeNode;

// * Label manipulation

/**
 * Toggle a dash tag on a node
 *
 * If the node bears the given dash tag, remove it.  If not, add it.  This
 * function attempts to put multiple dash tags in the proper order, according
 * to the configuration in the `leaf_extensions`, `extensions`, and
 * `clause_extensions` variables in the `settings.js` file.
 *
 * @param {String} extension the dash tag to toggle
 * @param {String[]} [extensionList] override the guess as to the
 * appropriate ordered list of possible extensions.
 */
function toggleExtension(extension, extensionList) {
    if (!startnode || endnode) {
        return false;
    }

    if (!extensionList) {
        if (utils.guessLeafNode(startnode)) {
            extensionList = conf.leaf_extensions;
        } else if (utils.getLabel($(startnode)).split("-")[0] === "IP" ||
                   utils.getLabel($(startnode)).split("-")[0] === "CP") {
            // TODO: should FRAG be a clause?
            // TODO: make configurable
            extensionList = conf.clause_extensions;
        } else {
            extensionList = conf.extensions;
        }
    }

    // Tried to toggle an extension on an inapplicable node.
    if (extensionList.indexOf(extension) < 0) {
        return false;
    }

    undo.touchTree($(startnode));
    var textnode = utils.textNode($(startnode));
    var oldlabel = $.trim(textnode.text());
    // Extension is not de-dashed here.  toggleStringExtension handles it.
    // The new config format however requires a dash-less extension.
    var newlabel = utils.toggleStringExtension(oldlabel, extension, extensionList);
    textnode.replaceWith(newlabel + " ");
    utils.updateCssClass($(startnode), oldlabel);

    return true;
}
exports.toggleExtension = toggleExtension;

/**
 * Set the label of a node intelligently
 *
 * Given a list of labels, this function will attempt to find the node's
 * current label in the list.  If it is successful, it sets the node's label
 * to the next label in the list (or the first, if the node's current label is
 * the last in the list).  If not, it sets the label to the first label in the
 * list.
 *
 * @param labels a list of labels.  This can also be an object -- if so, the
 * base label (without any dash tags) of the target node is looked up as a
 * key, and its corresponding value is used as the list.  If there is no value
 * for that key, the first value specified in the object is the default.
 */
function setLabel(labels) {
    if (!startnode || endnode) {
        return false;
    }

    var textnode = utils.textNode($(startnode));
    var oldlabel = $.trim(textnode.text());
    var newlabel = utils.lookupNextLabel(oldlabel, labels);

    // TODO: restore
    // if (utils.guessLeafNode($(startnode))) {
    //     if (typeof testValidLeafLabel !== "undefined") {
    //         if (!testValidLeafLabel(newlabel)) {
    //             return false;
    //         }
    //     }
    // } else {
    //     if (typeof testValidPhraseLabel !== "undefined") {
    //         if (!testValidPhraseLabel(newlabel)) {
    //             return false;
    //         }
    //     }
    // }

    undo.touchTree($(startnode));

    textnode.replaceWith(newlabel + " ");
    utils.updateCssClass($(startnode), oldlabel);

    return true;
}
exports.setLabel = setLabel;
