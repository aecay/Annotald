///<reference path="./../../../types/all.d.ts" />

/* tslint:disable:quotemark no-string-literal */

import $ = require("jquery");
import _ = require("lodash");
var wut = require("./../ext/wut");

import utils = require("./utils");
import undo = require("./undo");
import log = require("../ui/log");
import selection = require("./selection");
import events = require("./events");
import dialog = require("./dialog");
import startup = require("./startup");
import conf = require("./config");
import bindings = require("./bindings");
import strucEdit = require("./struc-edit");
import labelConvert = require("./label-convert");
import metadata = require("./metadata");

var HP = {};
wut.pollute(HP);
var H = <WutFunctions>HP;


// TODO: document entry points better

var commentTypeCheckboxes;

startup.addStartupHook(function setupCommentTypes () : void {
    var commentTypes = conf.commentTypes;
    commentTypeCheckboxes = "Type of comment: ";
    for (var i = 0; i < commentTypes.length; i++) {
        commentTypeCheckboxes +=
            H.input({
                type: "radio",
                name: "commentType",
                value: commentTypes[i],
                id: "commentType" + commentTypes[i]
            }) + " " + commentTypes[i];
    }
});

export function editComment () : void {
    if (selection.cardinality() !== 1) {
        return;
    }
    undo.touchTree($(selection.get()));
    var sel = selection.get();
    var commentText = $.trim(utils.wnodeString(sel));
    var commentType = sel.getAttribute("data-comtype");
    // TODO: upgrade to vex, make async
    dialog.showDialogBox("Edit Comment",
                         H.textarea({id: "commentEditBox"}, commentText) +
                         H.div({ id: "commentTypes" }, commentTypeCheckboxes) +
                         H.div({ id: "dialogButtons" },
                               H.input( { type: "button",
                                          id: "commentEditButton",
                                          value: "Save"})));
    $("input:radio[name=commentType]").val([commentType]);
    (<HTMLInputElement>$("#commentEditBox").focus().get(0))
        .setSelectionRange(commentText.length,
                           commentText.length);
    function editCommentDone (change : boolean) : void {
        if (change) {
            var newText = $.trim($("#commentEditBox").val());
            commentType = $("input:radio[name=commentType]:checked").val();
            $(sel).find(".wnode").text(newText);
            sel.setAttribute("data-comtype", commentType);
        }
        dialog.hideDialogBox();
    }
    $("#commentEditButton").click(editCommentDone);
    $("#commentEditBox").keydown(function (e : KeyboardEvent) : boolean {
        if (e.keyCode === 13) {
            // return
            editCommentDone(true);
            return false;
        } else if (e.keyCode === 27) {
            editCommentDone(false);
            return false;
        } else {
            return true;
        }
    });
}
editComment["async"] = true;

/**
 * Edit the lemma of a terminal node.
 */
export function editLemma (recursive : boolean = false) : void {
    if (selection.cardinality() !== 1 || ! utils.isLeafNode(selection.get())) {
        return;
    }
    var mdInput = $("#meta-lemma");
    if (mdInput.length === 0 && !recursive) {
        metadata.setMetadata(selection.get(), "lemma", "XXX");
        window.setTimeout(editLemma, 50);
    }
    mdInput.focus();
}

/**
 * Perform an appropriate editing operation on the selected node.
 */
export function editNode () : void {
    var sel = selection.get();
    var oldLabel = labelConvert.getLabelForNode(sel);
    if (oldLabel === "CODE" &&
        _.contains(conf.commentTypes, sel.getAttribute("data-comtype"))) {
        editComment();
    } else {
        undo.beginTransaction();
        dialog.prompt("Enter new label").then((s : string) : void => {
            // TODO: check for illegal characters
            // TODO: perhaps only allow editing category and subcategory?
            labelConvert.setLabelForNode(oldLabel, sel, undefined, true);
            labelConvert.setLabelForNode(s.toUpperCase(), sel);
            undo.endTransaction();
            undo.undoBarrier();
        }).catch(() : void => {
            undo.abortTransaction();
        });
    }
}
editNode["async"] = true;

export function splitWord () : void {
    if (selection.cardinality() !== 1) {
        return;
    }
    if (!utils.isLeafNode(selection.get()) ||
        utils.isEmptyNode(selection.get())) {
        return;
    }
    var sel = selection.get();
    undo.beginTransaction();
    undo.touchTree($(sel));
    var oldText = $(sel).find(".wnode").contents().filter(function () : boolean {
        return this.nodeType === 3;
    }).text();
    dialog.prompt("Enter an @ at the desired split point",
                  $(sel).find(".wnode").text()).then((split : string) : void => {
                      var pieces = split.split("@");
                      if (pieces.length !== 2) {
                          log.error("You must enter exactly one @");
                          return;
                      }
                      var piece1 = pieces[0];
                      var piece2 = pieces[1];
                      if (piece1 + piece2 !== oldText) {
                          log.error("Cannot change node text while splitting");
                      }
                      $(sel).find(".wnode").contents().filter(function () : boolean {
                          return this.nodeType === 3;
                      }).first().text(piece1);
                      strucEdit.makeLeaf(false, "X", piece2);
                      metadata.setMetadata(sel, "has_continuation", "yes");
                  });
}
splitWord["async"] = true;

export function setLabel(labels : string[]) : boolean {
    if (selection.cardinality() !== 1) {
        return false;
    }

    var sel = selection.get();

    var label = labelConvert.getLabelForNode(sel, undefined, false);

    var newlabel : string;

    if (labels.indexOf(label) === -1) {
        newlabel = labels[0];
    } else {
        newlabel = labels.slice(1).concat(
            [labels[0]])[labels.indexOf(label)];
    }

    undo.touchTree($(selection.get()));

    labelConvert.setLabelForNode(label, sel, undefined, true);
    labelConvert.setLabelForNode(newlabel, sel);

    return true;
}
