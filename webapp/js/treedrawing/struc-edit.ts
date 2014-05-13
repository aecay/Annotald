///<reference path="./../../../types/all.d.ts" />

/* tslint:disable:variable-name no-bitwise quotemark */

import $ = require("jquery");
import utils = require("./utils");
import selection = require("./selection");
import undo = require("./undo");
import events = require("./events");
import conf = require("./config");

// * Coindexation

/**
 * Coindex nodes.
 *
 * Coindex the two selected nodes.  If they are already coindexed, toggle
 * types of coindexation (normal -> gapping -> backwards gapping -> double
 * gapping -> no indices).  If only one node is selected, remove its index.
 */
export function coIndex() : void {
    var sel = selection.get();
    var sel2 = selection.get(true);
    if (selection.cardinality() === 1) {
        if (utils.getIndex(sel)) {
            undo.touchTree($(sel));
            utils.removeIndex(sel);
        }
    } else if (selection.cardinality() === 2) {
        // don't do anything if different token roots
        var startRoot = utils.getTokenRoot($(sel));
        var endRoot = utils.getTokenRoot($(sel2));
        if (startRoot !== endRoot) {
            // TODO: message
            return;
        }

        undo.touchTree($(sel));
        // if both nodes already have an index
        if (utils.getIndex(sel) && utils.getIndex(sel2)) {
            // and if it is the same index
            if (utils.getIndex(sel) === utils.getIndex(sel2)) {
                var types = utils.getIndexType(sel) +
                    utils.getIndexType(sel2);

                // remove it
                if (types === "=-") {
                    utils.setIndexType(sel2, "=");
                } else if (types === "--") {
                    utils.setIndexType(sel2, "=");
                } else if (types === "-=") {
                    utils.setIndexType(sel, "=");
                    utils.setIndexType(sel2, "-");
                } else if (types === "==") {
                    utils.removeIndex(sel);
                    utils.removeIndex(sel2);
                }
            }
        } else if (utils.getIndex(sel) && !utils.getIndex(sel2)) {
            utils.setIndex(sel2, utils.getIndex(sel));
        } else if (!utils.getIndex(sel) && utils.getIndex(sel2)) {
            utils.setIndex(sel, utils.getIndex(sel2));
        } else { // no indices here, so make them
            var index = utils.maxIndex(startRoot) + 1;
            utils.setIndex(sel, index);
            utils.setIndex(sel2, index);
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
export function moveNode(parent : Element) : boolean {
    var parent_ip = $(selection.get()).parents("#sn0>.snode,#sn0").first();
    var other_parent = $(parent).parents("#sn0>.snode,#sn0").first();
    if (parent === document.getElementById("sn0") ||
        !parent_ip.is(other_parent)) {
        parent_ip = $("#sn0");
    }
    var parent_before;
    var textbefore = utils.currentText(parent_ip);
    if (// can't move under a tag node
        !utils.isPossibleTarget(parent) ||
            // can't move an only child
            $(selection.get()).parent().children().length === 1 ||
            // can't move under one's own child
            $(parent).parents().is(selection.get()) ||
            // can't move an empty leaf node by itself
            utils.isEmptyNode(selection.get())) {
        selection.clearSelection();
        return false;
    } else if ($(selection.get()).parents().is(parent)) {
        // move up if moving to a node that is already my parent
        if ($(selection.get()).parent().children().first().is(selection.get())) {
            if ($(selection.get()).parentsUntil(parent).slice(0, -1).
                filter(":not(:first-child)").length > 0) {
                selection.clearSelection();
                return false;
            }
            if (parent === document.getElementById("sn0")) {
                undo.touchTree($(selection.get()));
                undo.registerNewRootTree($(selection.get()));
            } else {
                undo.touchTree($(selection.get()));
            }
            $(selection.get()).insertBefore($(parent).children().filter(
                                                 $(selection.get()).parents()));
            if (utils.currentText(parent_ip) !== textbefore) {
                alert("failed what should have been a strict test");
            }
        } else if ($(selection.get()).parent().children().last().
                   is(selection.get())) {
            if ($(selection.get()).parentsUntil(parent).slice(0, -1).
                filter(":not(:last-child)").length > 0) {
                selection.clearSelection();
                return false;
            }
            if (parent === document.getElementById("sn0")) {
                undo.touchTree($(selection.get()));
                undo.registerNewRootTree($(selection.get()));
            } else {
                undo.touchTree($(selection.get()));
            }
            $(selection.get()).insertAfter($(parent).children().
                                     filter($(selection.get()).parents()));
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
        var tokenMerge = utils.isRootNode( $(selection.get()) );
        var maxindex = utils.maxIndex(utils.getTokenRoot($(parent)));
        var movednode = $(selection.get());

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
        if (parent.compareDocumentPosition(selection.get()) & 0x4) {
            // check whether the nodes are adjacent.  Ideally, we would like
            // to say selfAndParentsUntil, but no such jQuery fn exists, thus
            // necessitating the disjunction.
            // TODO: too strict
            // &&
            // $(selection.get()).prev().is(
            //     $(parent).parentsUntil(startnode.parentNode).last()) ||
            // $(selection.get()).prev().is(parent)

            // parent precedes startnode
            undo.undoBeginTransaction();
            if (tokenMerge) {
                undo.registerDeletedRootTree($(selection.get()));
                undo.touchTree($(parent));
                // TODO: this will bomb if we are merging more than 2 tokens
                // by multiple selection.
                utils.addToIndices(movednode, maxindex);
            } else {
                undo.touchTree($(selection.get()));
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
        } else if ((parent.compareDocumentPosition(selection.get()) & 0x2)) {
            // &&
            // $(selection.get()).next().is(
            //     $(parent).parentsUntil(startnode.parentNode).last()) ||
            // $(selection.get()).next().is(parent)

            // startnode precedes parent
            undo.undoBeginTransaction();
            if (tokenMerge) {
                undo.registerDeletedRootTree($(selection.get()));
                undo.touchTree($(parent));
                utils.addToIndices(movednode, maxindex);
            } else {
                undo.touchTree($(selection.get()));
                undo.touchTree($(parent));
            }
            movednode.insertBefore($(parent).children().first());
            if (utils.currentText(parent_ip) !== textbefore) {
                undo.undoAbortTransaction();
                parent_ip.replaceWith(parent_before);
                if (parent_ip.attr("id") === "sn0") {
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
export function moveNodes(parent : Element) : boolean {
    if (selection.cardinality() !== 2) {
        return;
    }
    undo.undoBeginTransaction();
    undo.touchTree($(selection.get()));
    undo.touchTree($(parent));
    if (selection.get().compareDocumentPosition(selection.get(true)) & 0x2) {
        // endnode precedes startnode, reverse them
        var temp = selection.get();
        selection.set(selection.get(true));
        selection.set(temp, true);
    }
    if (selection.get().parentNode === selection.get(true).parentNode) {
        // collect startnode and its sister up until endnode
        $(selection.get()).add($(selection.get()).nextUntil($(selection.get(true)))).
            add($(selection.get(true))).
            wrapAll('<div xxx="newnode" class="snode">XP</div>');

    } else {
        return; // they are not sisters
    }
    var toselect = $(".snode[xxx=newnode]").first();
    // BUG when making XP and then use context menu: TODO XXX

    selection.set(toselect.get(0));
    var res = undo.ignoringUndo(function () : void { moveNode(parent); });
    if (res) {
        undo.undoEndTransaction();
    } else {
        undo.undoAbortTransaction();
    }
    selection.set($(".snode[xxx=newnode]").first().get(0));
    selection.clear(true);
    pruneNode();
    selection.clearSelection();
}

// * Deletion

/**
 * Delete a node.
 *
 * The node can only be deleted if doing so does not affect the text, i.e. it
 * directly dominates no non-empty terminals.
 */
export function pruneNode() : void {
    if (selection.cardinality() === 1) {
        if (utils.isLeafNode(selection.get()) &&
            utils.isEmptyNode(selection.get())) {
            // it is ok to delete leaf if it is empty/trace
            if (utils.isRootNode($(selection.get()))) {
                // perversely, it is possible to have a leaf node at the root
                // of a file.
                undo.registerDeletedRootTree($(selection.get()));
            } else {
                undo.touchTree($(selection.get()));
            }
            var idx = utils.getIndex(selection.get());
            if (idx > 0) {
                var root = $(utils.getTokenRoot($(selection.get())));
                var sameIdx = root.find('.snode').filter(function () : boolean {
                    return utils.getIndex(this) === idx;
                }).not(selection.get());
                if (sameIdx.length === 1) {
                    var osn = selection.get();
                    selection.set(sameIdx.get(0));
                    coIndex();
                    selection.set(osn);
                }
            }
            $(selection.get()).remove();
            selection.clearSelection();
            selection.updateSelection();
            return;
        } else if (utils.isLeafNode(selection.get())) {
            // but other leaves are not deleted
            return;
        } else if (selection.get() === document.getElementById("sn0")) {
            return;
        }

        var toselect = $(selection.get()).children().first();
        undo.touchTree($(selection.get()));
        $(selection.get()).replaceWith($(selection.get()).children());
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
export function makeLeaf(before : boolean,
                         label : string = "NP-SBJ",
                         word : string = "*con*",
                         target? : Element) : void
{
    if (!(target || selection.get())) {
        return;
    }
    if (target === undefined) {
        target = selection.get();
    }

    undo.undoBeginTransaction();
    var isRootLevel = false;
    if (utils.isRootNode($(target))) {
        isRootLevel = true;
    } else {
        undo.touchTree($(target));
    }

    var lemma = "";
    var temp = word.split("-");
    if (temp.length > 1) {
        lemma = temp.pop();
        word = temp.join("-");
    }

    var doCoindex = false;

    if (selection.get(true)) {
        var startRoot = utils.getTokenRoot($(selection.get()));
        var endRoot = utils.getTokenRoot($(selection.get(true)));
        if (startRoot === endRoot) {
            word = "*ICH*";
            label = utils.getLabel($(selection.get(true)));
            if (utils.startsWith(label, "W")) {
                word = "*T*";
                label = label.substr(1).replace(/-[0-9]+$/, "");
            } else if (label.split("-").indexOf("CL") > -1) {
                word = "*CL*";
                label = utils.getLabel($(selection.get(true))).replace("-CL", "");
                if (label.substring(0, 3) === "PRO") {
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
    if (lemma !== "") {
        newleaf += "<span class='lemma'>-" + lemma +
            "</span>";
    }
    newleaf += "</span></div>\n";
    var newleafJQ = $(newleaf);
    if (before) {
        newleafJQ.insertBefore(target);
    } else {
        newleafJQ.insertAfter(target);
    }
    if (doCoindex) {
        selection.set(newleafJQ.get(0));
        coIndex();
    }
    selection.clear();
    selection.clear(true);
    selection.selectNode(newleafJQ.get(0));
    selection.updateSelection();
    if (isRootLevel) {
        undo.registerNewRootTree(newleafJQ);
    }
    undo.undoEndTransaction();
}

/**
 * Create a leaf node before the selected node.
 *
 * Uses heuristic to determine whether the new leaf is to be a trace, empty
 * subject, etc.
 */
export function leafBefore() : void {
    makeLeaf(true);
}

/**
 * Create a leaf node after the selected node.
 *
 * Uses heuristic to determine whether the new leaf is to be a trace, empty
 * subject, etc.
 */
export function leafAfter() : void {
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
export function makeNode(label? : string) : void {
    // check if something is selected
    if (!selection.get()) {
        return;
    }
    if (!label) {
        label = "XP";
    }
    var rootLevel = utils.isRootNode($(selection.get()));
    undo.undoBeginTransaction();
    if (rootLevel) {
        undo.registerDeletedRootTree($(selection.get()));
    } else {
        undo.touchTree($(selection.get()));
    }
    var parent_ip = $(selection.get()).parents("#sn0>.snode,#sn0").first();
    var parent_before = parent_ip.clone();
    var newnode = '<div class="snode ' + label + '">' + label + ' </div>\n';
    // make end = start if only one node is selected
    if (!selection.get(true)) {
        // if only one node, wrap around that one
        $(selection.get()).wrapAll(newnode);
    } else {
        if (selection.get().compareDocumentPosition(
            selection.get(true)) & 0x2) { // jshint ignore:line
            // startnode and endnode in wrong order, reverse them
            var temp = selection.get();
            selection.set(selection.get(true));
            selection.set(temp, true);
        }

        // check if they are really sisters XXXXXXXXXXXXXXX
        if ($(selection.get()).siblings().is(selection.get(true))) {
            // then, collect startnode and its sister up until endnode
            var oldtext = utils.currentText(parent_ip);
            $(selection.get()).add($(selection.get()).nextUntil(
                $(selection.get(true)))).add(
                $(selection.get(true))).wrapAll(newnode);
            // undo if this messed up the text order
            if (utils.currentText(parent_ip) !== oldtext) {
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

    var toselect = $(selection.get()).parent();

    selection.clearSelection();

    if (rootLevel) {
        undo.registerNewRootTree(toselect);
    }

    undo.undoEndTransaction();

    selection.selectNode(toselect.get(0));
    selection.updateSelection();
}

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
export function toggleExtension(extension : string,
                                extensionList? : string []) : boolean
{
    if (selection.cardinality() !== 1) {
        return false;
    }

    if (!extensionList) {
        if (utils.guessLeafNode(selection.get())) {
            extensionList = conf.leafExtensions;
        } else if (utils.getLabel($(selection.get())).split("-")[0] === "IP" ||
                   utils.getLabel($(selection.get())).split("-")[0] === "CP") {
            // TODO: should FRAG be a clause?
            // TODO: make configurable
            extensionList = conf.clauseExtensions;
        } else {
            extensionList = conf.extensions;
        }
    }

    // Tried to toggle an extension on an inapplicable node.
    if (extensionList.indexOf(extension) < 0) {
        return false;
    }

    undo.touchTree($(selection.get()));
    var textnode = utils.textNode($(selection.get()));
    var oldlabel = $.trim(textnode.text());
    // Extension is not de-dashed here.  toggleStringExtension handles it.
    // The new config format however requires a dash-less extension.
    var newlabel = utils.toggleStringExtension(oldlabel, extension, extensionList);
    textnode.replaceWith(newlabel + " ");
    utils.updateCssClass($(selection.get()), oldlabel);

    return true;
}
