///<reference path="./../../../types/all.d.ts" />

/* tslint:disable:variable-name no-bitwise quotemark */

import $ = require("jquery");
import utils = require("./utils");
import selection = require("./selection");
import undo = require("./undo");
import events = require("./events");
import conf = require("./config");
import lc = require("./label-convert");
import log = require("./../ui/log");

// TODO: we should be able to import this...
var wut = require("./../ext/wut");
var HP = {};
wut.pollute(HP);
var H = <WutFunctions>HP;

// * Coindexation

/**
 * Coindex nodes.
 *

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
            log.error("Cannot coindex nodes in different sentences");
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

function randomString(length : number, chars : string) : string {
    var result = "";
    for (var i = length; i > 0; --i) {
        result += chars[Math.round(Math.random() * (chars.length - 1))];
    }
    return result;
}

// TODO: implement the no-movement-of-empty-leaves restriction
export function moveNode(parent : HTMLElement) : boolean {
    var node = selection.get();
    var parent_ip = $(utils.getTokenRoot($(node)));
    var other_parent = $(utils.getTokenRoot($(parent)));
    var _bail = () : void => { return; };
    var tokenMerge = false;

    if (parent.classList.contains("sentnode")) {
        parent = document.getElementById("sn0");
    }

    undo.beginTransaction();

    undo.touchTree($(parent));
    undo.touchTree($(node));

    if ($(node).parent().hasClass("sentnode")) {
        // Moving a sentence into another
        undo.registerDeletedRootTree($(node));
        var oldId = $(node).attr("data-id");
        $(node).parent().replaceWith(node);
        _bail = () : void => { $(node).wrap(
            '<div class="sentnode" data-id="' + oldId + '" />'); };
        tokenMerge = true;
    } else if ($(parent).hasClass("sentnode") || !parent_ip.is(other_parent)) {
        // Moving a node out into its own sentence
        node = $(selection.get()).wrap(
            '<div class="sentnode" data-id="' +
                randomString(8, "abcdefghijklmnopqrstuvwxyz0123456789") +
                '" />').parent().get(0);
        undo.registerNewRootTree($(node));
        _bail = () : void => { $(node).replaceWith($(node).children()); };
    }
    var parent_before;
    var $node = $(node);

    function abort () : void {
        selection.clearSelection();
        undo.abortTransaction();
        _bail();
    }

    if (// can't move under a tag node
        !utils.isPossibleTarget(parent) ||
            // can't move an only child
            $(node).parent().children().length === 1 ||
            // can't move under one's own child
            $(parent).parents().is(selection.get()) ||
            // can't move an empty leaf node by itself
            utils.isEmptyNode(selection.get())) {
        abort();
        return false;
    } else if ($node.parents().is(parent)) {
        // move up if moving to a node that is already my parent
        if ($node.parent().children().filter(
                function () : boolean {
                    return !utils.isEmptyNode(this);
                }).first().is(node)) {
            if ($node.parentsUntil(parent).slice(0, -1).
                filter(":not(:first-child)").length > 0) {
                abort();
                return false;
            }
            $node.insertBefore($(parent).children().filter(
                $node.parents()));
        } else if ($node.parent().children().filter(
                       function () : boolean {
                           return !utils.isEmptyNode(this);
                       }).last().is(node)) {
            if ($node.parentsUntil(parent).slice(0, -1).
                filter(":not(:last-child)").length > 0) {
                abort();
                return false;
            }
            $node.insertAfter($(parent).children().
                              filter($node.parents()));
        } else {
            // cannot move from this position
            abort();
            return false;
        }
    } else {
        // otherwise move under my sister
        var maxindex = utils.maxIndex(utils.getTokenRoot($(parent)));
        var movednode = $node;

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

        // TODO: this will fail if we're trying to move into an empty node.
        if ((parent.compareDocumentPosition(node) & 0x4) &&
            $(parent).parentsUntil($node.parent()).addBack().is(
                $node.prevAll().filter(function () : boolean {
                    return !utils.isEmptyNode(this);
                }).first())) {
            // parent precedes startnode
            if (tokenMerge) {
                // TODO: this will bomb if we are merging more than 2 tokens
                // by multiple selection.
                utils.addToIndices(movednode, maxindex);
            }
            movednode.appendTo(parent);
        } else if ((parent.compareDocumentPosition(node) & 0x2) &&
                   $(parent).parentsUntil($node.parent()).addBack().is(
                       $node.nextAll().filter(function () : boolean {
                           return !utils.isEmptyNode(this);
                       }).first())) {
            if (tokenMerge) {
                utils.addToIndices(movednode, maxindex);
            }
            movednode.insertBefore($(parent).children().first());
        } else {
            abort();
            return false;
        }
    }
    selection.clearSelection();
    return true;
}

export function moveNodes(parent : HTMLElement) : boolean {
    if (selection.cardinality() !== 2) {
        return;
    }
    undo.beginTransaction();
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
        undo.endTransaction();
    } else {
        undo.abortTransaction();
    }
    selection.set($(".snode[xxx=newnode]").first().get(0));
    selection.clear(true);
    pruneNode();
    selection.clearSelection();
}

export function pruneNode() : void {
    if (selection.cardinality() !== 1) {
        return;
    }
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

// TODO: the hardcoding of defaults in this function is ugly.  We should
// supply a default heuristic fn to try to guess these, then allow
// settings.js to override it.

// TODO: maybe put the heuristic into leafbefore/after, and leave this fn clean?
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

    undo.beginTransaction();
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
            label = lc.getLabelForNode(selection.get(true));
            if (utils.startsWith(label, "W")) {
                word = "*T*";
                label = label.substr(1).replace(/-[0-9]+$/, "");
            } else if (label.split("-").indexOf("CL") > -1) {
                word = "*CL*";
                label = lc.getLabelForNode(selection.get(true)).replace("-CL", "");
                if (label.substring(0, 3) === "PRO") {
                    label = "NP";
                }
            }
            doCoindex = true;
        } else { // abort if selecting from different tokens
            undo.abortTransaction();
            return;
        }
    }

    var newleaf = "<div class='snode' data-nodetype='leaf'>" +
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
    lc.setLabelForNode(label, newleafJQ.get(0));
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
    undo.endTransaction();
}

export function leafBefore() : void {
    makeLeaf(true);
}

export function leafAfter() : void {
    makeLeaf(false);
};

export function makeNode(label? : string) : void {
    // check if something is selected
    if (!selection.get()) {
        return;
    }
    if (!label) {
        label = "XP";
    }
    var rootLevel = utils.isRootNode($(selection.get()));
    undo.beginTransaction();
    if (rootLevel) {
        undo.registerDeletedRootTree($(selection.get()));
    } else {
        undo.touchTree($(selection.get()));
    }
    var parent_ip = $(utils.getTokenRoot($(selection.get())));
    var parent_before = parent_ip.clone();
    var newnode = $(H.div({ "class": "snode", "data-category" : "XP" }));
    // make end = start if only one node is selected
    if (!selection.get(true)) {
        // if only one node, wrap around that one
        $(selection.get()).wrapAll(newnode);
    } else {
        if (selection.get().compareDocumentPosition(
            selection.get(true)) & 0x2) {
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
                undo.abortTransaction();
                selection.clearSelection();
                return;
            }
        } else {
            return;
        }
    }

    selection.clearSelection();

    if (rootLevel) {
        undo.registerNewRootTree(newnode);
    }

    undo.endTransaction();

    selection.selectNode(newnode.get(0));
}

export function toggleExtension (extension : string) : void {
    if (selection.cardinality() !== 1) {
        return;
    }
    lc.toggleExtensionForNode(extension, selection.get());
}
