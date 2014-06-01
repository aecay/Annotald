///<reference path="./../../../types/all.d.ts" />

/* tslint:disable:quotemark no-string-literal */

import $ = require("jquery");
import _ = require("lodash");
var wut = require("./../../../js-ext/wut");

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

// * Editing parts of the tree

// TODO: document entry points better
// DONE(?): split these fns up...they are monsters.

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
    var commentRaw = $.trim(utils.wnodeString(selection.get()));
    var commentType = commentRaw.split(":")[0];
    // remove the {
    commentType = commentType.substring(1);
    var commentText = commentRaw.split(":")[1];
    commentText = commentText.substring(0, commentText.length - 1);
    // regex because string does not give global search.
    commentText = commentText.replace(/_/g, " ");
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
            if (/_|\n|:|\}|\{|\(|\)/.test(newText)) {
                // TODO(AWE): slicker way of indicating errors...
                alert("illegal characters in comment: illegal characters are" +
                      " _, :, {}, (), and newline");
                // hideDialogBox();
                $("#commentEditBox").val(newText);
                return;
            }
            newText = newText.replace(/ /g, "_");
            commentType = $("input:radio[name=commentType]:checked").val();
            utils.setNodeLabel($(selection.get()).children(".wnode"),
                               "{" + commentType + ":" + newText + "}");
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
 * Return the JQuery object with the editor for a leaf node.
 * @private
 */
function leafEditorHtml(label : string,
                        word : string,
                        lemma : string)
: JQuery {
    // Single quotes mess up the HTML code.
    if (lemma) {
        lemma = lemma.replace(/'/g, "&#39;");
    }
    word = word.replace(/'/g, "&#39;");
    label = label.replace(/'/g, "&#39;");

    var editorHtml = H.div({ id: "leafeditor",
                             "class": "snode",
                             "data-freezeWatch" : "true" },
                           H.input({ id: "leafphrasebox",
                                     "class": "labeledit",
                                     type: "text",
                                     value: label }),
                           H.input(<{[key: string] : string}>_.assign(
                               { id: "leaftextbox",
                                 "class": "labeledit",
                                 type: "text",
                                 value: word
                               },
                               !utils.isEmpty(word) ?
                                   { disabled: "disabled"} :
                               {})),
                           lemma ? H.input({ id: "leaflemmabox",
                                             "class": "labeledit",
                                             type: "text",
                                             value: lemma }) : "");

    return $(editorHtml);
}

/**
 * Return the JQuery object with the replacement after editing a leaf node.
 * @private
 */
function leafEditorReplacement(type: string,
                               label : string,
                               word : string,
                               lemma? : string)
: JQuery {
    if (lemma) {
        lemma = lemma.replace(/</g, "&lt;");
        lemma = lemma.replace(/>/g, "&gt;");
        lemma = lemma.replace(/'/g, "&#39;");
    }

    word = word.replace(/</g, "&lt;");
    word = word.replace(/>/g, "&gt;");
    word = word.replace(/'/g, "&#39;");

    // TODO: test for illegal chars in label
    label = label.toUpperCase();

    var replText = $("<div class='snode' data-nodetype='" + type +
                     "'><span class='wnode'>" +
                     word + "</span></div>");
    if (lemma) {
        metadata.setMetadata(replText.get(0), "lemma", lemma);
    }
    labelConvert.setLabelForNode(label, replText.get(0));

    return replText;
}

/**
 * Edit the selected node
 *
 * If the selected node is a terminal, edit its label, and lemma.  The text is
 * available for editing if it is an empty node (trace, comment, etc.).  If a
 * non-terminal, edit the node label.
 */
export function displayRename () : void {
    var editTarget = selection.get();
    var label = utils.getLabel($(editTarget));
    var oldNodeType = editTarget.getAttribute("data-nodetype");

    // Inner functions
    function space(event : KeyboardEvent) : void {
        var element = (event.target || event.srcElement);
        $(element).val($(element).val());
        event.preventDefault();
    }
    function postChange(newNode : JQuery) : void {
        if (newNode) {
            utils.updateCssClass(newNode, label);
            selection.clearSelection();
            selection.updateSelection();
            bindings.uninhibit();
            $("#sn0").mousedown(events.handleNodeClick);
            $("#editpane").mousedown(selection.clearSelection);
            $("#butundo").prop("disabled", false);
            $("#butredo").prop("disabled", false);
            $("#butsave").prop("disabled", false);
        }
    }

    // Begin code
    if (selection.cardinality() !== 1) {
        return;
    }
    undo.undoBeginTransaction();
    undo.touchTree($(selection.get()));
    bindings.inhibit();
    $("#sn0").unbind("mousedown");
    $("#editpane").unbind("mousedown");
    $("#butundo").prop("disabled", true);
    $("#butredo").prop("disabled", true);
    $("#butsave").prop("disabled", true);

    if (utils.isLeafNode(editTarget)) {
        // this is a terminal
        var word = utils.wnodeString(editTarget);
        var lemma = utils.getLemma($(editTarget));
        // is this right? we still want to allow editing of index, maybe?
        var isLeafNode = utils.guessLeafNode(selection.get());

        $(editTarget).replaceWith(leafEditorHtml(label, word, lemma));

        $("#leafphrasebox,#leaftextbox,#leaflemmabox").keydown(
            function(event : KeyboardEvent) : void {
                var replNode;
                if (event.keyCode === 32) {
                    space(event);
                }
                if (event.keyCode === 27) {
                    replNode = leafEditorReplacement(oldNodeType, label,
                                                     word, lemma);
                    $("#leafeditor").replaceWith(replNode);
                    postChange(replNode);
                    undo.undoAbortTransaction();
                }
                if (event.keyCode === 13) {
                    var newlabel = $("#leafphrasebox").val().toUpperCase();
                    var newword = $("#leaftextbox").val();
                    var newlemma;
                    if (lemma) {
                        newlemma = $("#leaflemmabox").val();
                    }

                    if (isLeafNode) {
                        // TODO: restore
                        // if (typeof testValidLeafLabel !== "undefined") {
                        //     if (!testValidLeafLabel(newlabel)) {
                        //         displayWarning("Not a valid leaf label: '" +
                        //                        newlabel + "'.");
                        //         return;
                        //     }
                        // }
                    } else {
                        // TODO: restore
                        // if (typeof testValidPhraseLabel !== "undefined") {
                        //     if (!testValidPhraseLabel(newlabel)) {
                        //         displayWarning("Not a valid phrase label: '" +
                        //                        newlabel + "'.");
                        //         return;
                        //     }
                        // }
                    }
                    if (newword + newlemma === "") {
                        log.warning("Cannot create an empty leaf.");
                        return;
                    }
                    replNode = leafEditorReplacement(oldNodeType, newlabel,
                                                     newword, newlemma);
                    $("#leafeditor").replaceWith(replNode);
                    postChange(replNode);
                    undo.undoEndTransaction();
                    undo.undoBarrier();
                }
                if (event.keyCode === 9) {
                    var element = (event.target || event.srcElement);
                    if ($("#leafphrasebox").is(element)) {
                        if (!$("#leaftextbox").prop("disabled")) {
                            $("#leaftextbox").focus();
                        } else if ($("#leaflemmabox").length === 1) {
                            $("#leaflemmabox").focus();
                        }
                    } else if ($("#leaftextbox").is(element)) {
                        if ($("#leaflemmabox").length === 1) {
                            $("#leaflemmabox").focus();
                        } else {
                            $("#leafphrasebox").focus();
                        }
                    } else if ($("#leaflemmabox").is(element)) {
                        $("#leafphrasebox").focus();
                    }
                    event.preventDefault();
                }
            }).mouseup(function editLeafClick(
                e : JQueryMouseEventObject
            ) : void {
                e.stopPropagation();
            });
        setTimeout(function () : void { $("#leafphrasebox").focus(); }, 10);
    } else {
        // this is not a terminal
        var editor = $("<input id='labelbox' class='labeledit' " +
                       "type='text' value='" + label + "' />");
        var origNode = $(selection.get());
        // var isWordLevelConj =
        //         origNode.children(".snode").children(".snode").size() === 0 &&
        //         // TODO: make configurable
        //         origNode.children(".CONJ") .size() > 0;
        utils.textNode(origNode).replaceWith(editor);
        $("#labelbox").keydown(
            function(event : KeyboardEvent) : void {
                if (event.keyCode === 9) {
                    event.preventDefault();
                }
                if (event.keyCode === 32) {
                    space(event);
                }
                if (event.keyCode === 27) {
                    $("#labelbox").replaceWith(label + " ");
                    postChange(origNode);
                    undo.undoAbortTransaction();
                }
                if (event.keyCode === 13) {
                    var newphrase = $("#labelbox").val().toUpperCase();
                    // TODO: restore
                    // if (typeof testValidPhraseLabel !== "undefined") {
                    //     if (!(testValidPhraseLabel(newphrase) ||
                    //           (typeof testValidLeafLabel !== "undefined" &&
                    //            isWordLevelConj &&
                    //            testValidLeafLabel(newphrase)))) {
                    //         logger.warning("Not a valid phrase label: '" +
                    //                        newphrase + "'.");
                    //         return;
                    //     }
                    // }
                    $("#labelbox").replaceWith(newphrase + " ");
                    postChange(origNode);
                    undo.undoEndTransaction();
                    undo.undoBarrier();
                }
            }).mouseup(function editNonLeafClick (
                e : JQueryMouseEventObject
            ) : void {
                e.stopPropagation();
            });
        setTimeout(function () : void { $("#labelbox").focus(); }, 10);
    }
}
displayRename["async"] = true;

/**
 * Edit the lemma of a terminal node.
 */
export function editLemma () : void {
    var lemmaEditTarget : Element = selection.get();
    // Inner functions
    function space (event : KeyboardEvent) : void {
        var element = (event.target || event.srcElement);
        $(element).val($(element).val());
        event.preventDefault();
    }
    function postChange () : void {
        lemmaEditTarget.removeAttribute("data-freezeWatch");
        selection.clearSelection();
        selection.updateSelection();
        bindings.uninhibit();
        $("#sn0").mousedown(events.handleNodeClick);
        $("#butundo").prop("disabled", false);
        $("#butredo").prop("disabled", false);
        $("#butsave").prop("disabled", false);
    }

    // TODO: remove the observer in node-formatter.ts

    // Begin code
    var lemma = utils.getLemma($(lemmaEditTarget));
    if (!lemma) {
        return;
    }
    bindings.inhibit();
    $("#sn0").unbind("mousedown");
    undo.undoBeginTransaction();
    undo.touchTree($(lemmaEditTarget));
    $("#butundo").prop("disabled", true);
    $("#butredo").prop("disabled", true);
    $("#butsave").prop("disabled", true);

    lemmaEditTarget.setAttribute("data-freezeWatch", "true");

    var editor = $("<span id='leafeditor' class='wnode'><input " +
                   "id='leaflemmabox' class='labeledit' type='text' value='" +
                   lemma + "' /></span>");
    $(lemmaEditTarget).children(".wnode").children(".lemma").replaceWith(editor);
    $("#leaflemmabox").keydown(
        function (event : KeyboardEvent) : void {
            if (event.keyCode === 9) {
                event.preventDefault();
            }
            if (event.keyCode === 32) {
                space(event);
            }
            if (event.keyCode === 27) {
                $("#leafeditor").replaceWith("<span class='lemma'>-" +
                                             lemma + "</span>");
                postChange();
                undo.undoAbortTransaction();
            }
            if (event.keyCode === 13) {
                var newlemma = $("#leaflemmabox").val();
                newlemma = newlemma.replace("<", "&lt;");
                newlemma = newlemma.replace(">", "&gt;");
                newlemma = newlemma.replace(/'/g, "&#39;");

                $("#leafeditor").remove();
                metadata.setMetadata(lemmaEditTarget, "lemma", newlemma);
                postChange();
                undo.undoEndTransaction();
                undo.undoBarrier();
            }
        }).mouseup(function editLemmaClick (
            e : JQueryMouseEventObject
        ) : void {
            e.stopPropagation();
        });
    setTimeout(function () : void { $("#leaflemmabox").focus(); }, 10);
}
editLemma["async"] = true;

/**
 * Perform an appropriate editing operation on the selected node.
 */
export function editNode () : void {
    if (utils.getLabel($(selection.get())) === "CODE" &&
        _.contains(conf.commentTypes,
                   // strip leading { and the : and everything after
                   utils.wnodeString(selection.get()).substr(1).split(":")[0])
        ) {
        editComment();
    } else {
        displayRename();
    }
}
editNode["async"] = true;

// * Splitting words

export function splitWord () : void {
    if (selection.cardinality() !== 1) {
        return;
    }
    if (!utils.isLeafNode(selection.get()) ||
        utils.isEmptyNode(selection.get())) {
        return;
    }
    undo.undoBeginTransaction();
    undo.touchTree($(selection.get()));
    var wordSplit = utils.wnodeString(selection.get()).split("-");
    var origWord = wordSplit[0];
    var startsWithAt = false, endsWithAt = false;
    if (origWord[0] === "@") {
        startsWithAt = true;
        origWord = origWord.substr(1);
    }
    if (origWord.substr(origWord.length - 1, 1) === "@") {
        endsWithAt = true;
        origWord = origWord.substr(0, origWord.length - 1);
    }
    var origLemma = "XXX";
    if (wordSplit.length === 2) {
        origLemma = "@" + wordSplit[1] + "@";
    }
    var origLabel = utils.getLabel($(selection.get()));
    function doSplit () : void {
        var words = $("#splitWordInput").val().split("@");
        if (words.join("") !== origWord) {
            log.warning("The two new words don't match the original.  Aborting");
            undo.undoAbortTransaction();
            return;
        }
        if (words.length < 0) {
            log.warning("You have not specified where to split the word.");
            undo.undoAbortTransaction();
            return;
        }
        if (words.length > 2) {
            log.warning("You can only split in one place at a time.");
            undo.undoAbortTransaction();
            return;
        }
        var labelSplit = origLabel.split("+");
        var secondLabel = "X";
        if (labelSplit.length === 2) {
            utils.setLeafLabel($(selection.get()), labelSplit[0]);
            secondLabel = labelSplit[1];
        }
        utils.setLeafLabel($(selection.get()),
                           (startsWithAt ? "@" : "") + words[0] + "@");
        var hasLemma = utils.getLemma($(selection.get()));
        strucEdit.makeLeaf(false,
                           secondLabel,
                           "@" + words[1] + (endsWithAt ? "@" : ""));
        if (hasLemma) {
            // TODO: move to something like foo@1 and foo@2 for the two pieces
            // of the lemmata
            metadata.setMetadata(selection.get(), "lemma", origLemma);
        }
        dialog.hideDialogBox();
        undo.undoEndTransaction();
        undo.undoBarrier();
    }
    var html = "Enter an at-sign at the place to split the word: \
<input type='text' id='splitWordInput' value='" + origWord +
"' /><div id='dialogButtons'><input type='button' id='splitWordButton'\
 value='Split' /></div>";
    dialog.showDialogBox("Split word", html, doSplit);
    $("#splitWordButton").click(doSplit);
    $("#splitWordInput").focus();
}
splitWord["async"] = true;

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
export function setLabel(labels : string[]) : boolean {
    if (selection.cardinality() !== 1) {
        return false;
    }

    var sel = selection.get();

    var label = _.find(labels, function (l : string) : boolean {
        return labelConvert.nodeMatchesLabel(sel, l);
    });

    if (!label) {
        return false;
    }

    var newlabel : string = labels.slice(1).concat(
        [labels[0]])[labels.indexOf(label)];

    undo.touchTree($(selection.get()));

    labelConvert.setLabelForNode(label, sel, undefined, true);
    labelConvert.setLabelForNode(newlabel, sel);

    // TODO: should be handled by onchange handler...
    utils.updateCssClass($(selection.get()), label);

    return true;
}
