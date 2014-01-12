/*global require: false, exports: true, setTimeout: true */

/*jshint browser: true, quotmark: false, devel: true */

var $ = require("jquery"),
    _ = require("lodash"),
    utils = require("./utils"),
    globals = require("./global"),
    startnode = globals.startnode,
    endnode = globals.endnode,
    undo = require("./undo"),
    logger = require("../ui/log"),
    selection = require("./selection"),
    events = require("./events"),
    dialog = require("./dialog"),
    startup = require("./startup"),
    conf = require("./config");

// * Editing parts of the tree

// TODO: document entry points better
// DONE(?): split these fns up...they are monsters.

var commentTypeCheckboxes ;

startup.addStartupHook(function setupCommentTypes() {
    var commentTypes = conf.commentTypes;
    commentTypeCheckboxes = "Type of comment: ";
    for (var i = 0; i < commentTypes.length; i++) {
        commentTypeCheckboxes +=
            '<input type="radio" name="commentType" value="' +
            commentTypes[i] + '" id="commentType' + commentTypes[i] +
            '" /> ' + commentTypes[i];
    }
});

function editComment() {
    if (!startnode || endnode) {
        return;
    }
    undo.touchTree($(startnode));
    var commentRaw = $.trim(utils.wnodeString($(startnode)));
    var commentType = commentRaw.split(":")[0];
    // remove the {
    commentType = commentType.substring(1);
    var commentText = commentRaw.split(":")[1];
    commentText = commentText.substring(0, commentText.length - 1);
    // regex because string does not give global search.
    commentText = commentText.replace(/_/g, " ");
    dialog.showDialogBox("Edit Comment",
                  '<textarea id="commentEditBox">' +
                  commentText + '</textarea><div id="commentTypes">' +
                  commentTypeCheckboxes + '</div><div id="dialogButtons">' +
                  '<input type="button"' +
                  'id="commentEditButton" value="Save" /></div>');
    $("input:radio[name=commentType]").val([commentType]);
    $("#commentEditBox").focus().get(0).setSelectionRange(commentText.length,
                                                          commentText.length);
    function editCommentDone (change) {
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
            utils.setNodeLabel($(startnode).children(".wnode"),
                               "{" + commentType + ":" + newText + "}");
        }
        dialog.hideDialogBox();
    }
    $("#commentEditButton").click(editCommentDone);
    $("#commentEditBox").keydown(function (e) {
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
editComment.async = true;
exports.editComment = editComment;

/**
 * Return the JQuery object with the editor for a leaf node.
 * @private
 */
function leafEditorHtml(label, word, lemma) {
    // Single quotes mess up the HTML code.
    if (lemma) {
        lemma = lemma.replace(/'/g, "&#39;");
    }
    word = word.replace(/'/g, "&#39;");
    label = label.replace(/'/g, "&#39;");

    var editorHtml = "<div id='leafeditor' class='snode'>" +
            "<input id='leafphrasebox' class='labeledit' type='text' value='" +
            label +
            "' /><input id='leaftextbox' class='labeledit' type='text' value='" +
            word +
            "' " + (!utils.isEmpty(word) ? "disabled='disabled'" : "") + " />";
    if (lemma) {
        editorHtml += "<input id='leaflemmabox' class='labeledit' " +
            "type='text' value='" + lemma + "' />";
    }
    editorHtml += "</div>";

    return $(editorHtml);
}

/**
 * Return the JQuery object with the replacement after editing a leaf node.
 * @private
 */
function leafEditorReplacement(label, word, lemma) {
    if (lemma) {
        lemma = lemma.replace(/</g,"&lt;");
        lemma = lemma.replace(/>/g,"&gt;");
        lemma = lemma.replace(/'/g,"&#39;");
    }

    word = word.replace(/</g,"&lt;");
    word = word.replace(/>/g,"&gt;");
    word = word.replace(/'/g,"&#39;");

    // TODO: test for illegal chars in label
    label = label.toUpperCase();

    var replText = "<div class='snode'>" + label +
            " <span class='wnode'>" + word;
    if (lemma) {
        replText += "<span class='lemma'>-" +
            lemma + "</span>";
    }
    replText += "</span></div>";
    return $(replText);
}

/**
 * Edit the selected node
 *
 * If the selected node is a terminal, edit its label, and lemma.  The text is
 * available for editing if it is an empty node (trace, comment, etc.).  If a
 * non-terminal, edit the node label.
 */
function displayRename() {
    // Inner functions
    function space(event) {
        var element = (event.target || event.srcElement);
        $(element).val($(element).val());
        event.preventDefault();
    }
    function postChange(newNode) {
        if (newNode) {
            utils.updateCssClass(newNode, oldClass);
            selection.clearSelection();
            selection.updateSelection();
            document.body.onkeydown = events.handleKeyDown;
            $("#sn0").mousedown(events.handleNodeClick);
            $("#editpane").mousedown(selection.clearSelection);
            $("#butundo").prop("disabled", false);
            $("#butredo").prop("disabled", false);
            $("#butsave").prop("disabled", false);
        }
    }

    // Begin code
    if (!startnode || endnode) {
        return;
    }
    undo.undoBeginTransaction();
    undo.touchTree($(startnode));
    document.body.onkeydown = null;
    $("#sn0").unbind("mousedown");
    $("#editpane").unbind("mousedown");
    $("#butundo").prop("disabled", true);
    $("#butredo").prop("disabled", true);
    $("#butsave").prop("disabled", true);
    var label = utils.getLabel($(startnode));
    var oldClass = utils.parseLabel(label);

    if ($(startnode).children(".wnode").size() > 0) {
        // this is a terminal
        var word, lemma;
        // is this right? we still want to allow editing of index, maybe?
        var isLeafNode = utils.guessLeafNode($(startnode));
        if ($(startnode).children(".wnode").children(".lemma").size() > 0) {
            var preword = $.trim($(startnode).children().first().text());
            preword = preword.split("-");
            lemma = preword.pop();
            word = preword.join("-");
        } else {
            word = $.trim($(startnode).children().first().text());
        }

        $(startnode).replaceWith(leafEditorHtml(label, word, lemma));

        $("#leafphrasebox,#leaftextbox,#leaflemmabox").keydown(
            function(event) {
                var replNode;
                if (event.keyCode === 32) {
                    space(event);
                }
                if (event.keyCode === 27) {
                    replNode = leafEditorReplacement(label, word, lemma);
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
                        logger.warning("Cannot create an empty leaf.");
                        return;
                    }
                    replNode = leafEditorReplacement(newlabel, newword,
                                                     newlemma);
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
            }).mouseup(function editLeafClick(e) {
                e.stopPropagation();
            });
        setTimeout(function(){ $("#leafphrasebox").focus(); }, 10);
    } else {
        // this is not a terminal
        var editor = $("<input id='labelbox' class='labeledit' " +
                       "type='text' value='" + label + "' />");
        var origNode = $(startnode);
        // var isWordLevelConj =
        //         origNode.children(".snode").children(".snode").size() === 0 &&
        //         // TODO: make configurable
        //         origNode.children(".CONJ") .size() > 0;
        utils.textNode(origNode).replaceWith(editor);
        $("#labelbox").keydown(
            function(event) {
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
            }).mouseup(function editNonLeafClick(e) {
                e.stopPropagation();
            });
        setTimeout(function(){ $("#labelbox").focus(); }, 10);
    }
}
displayRename.async = true;
exports.displayRename = displayRename;

/**
 * Edit the lemma of a terminal node.
 */
function editLemma() {
    // Inner functions
    function space(event) {
        var element = (event.target || event.srcElement);
        $(element).val($(element).val());
        event.preventDefault();
    }
    function postChange() {
        selection.clearSelection();
        selection.updateSelection();
        document.body.onkeydown = events.handleKeyDown;
        $("#sn0").mousedown(events.handleNodeClick);
        $("#butundo").prop("disabled", false);
        $("#butredo").prop("disabled", false);
        $("#butsave").prop("disabled", false);
    }

    // Begin code
    var childLemmata = $(startnode).children(".wnode").children(".lemma");
    if (!startnode || endnode || childLemmata.size() !== 1) {
        return;
    }
    document.body.onkeydown = null;
    $("#sn0").unbind("mousedown");
    undo.undoBeginTransaction();
    undo.touchTree($(startnode));
    $("#butundo").prop("disabled", true);
    $("#butredo").prop("disabled", true);
    $("#butsave").prop("disabled", true);

    var lemma = $(startnode).children(".wnode").children(".lemma").text();
    lemma = lemma.substring(1);
    var editor=$("<span id='leafeditor' class='wnode'><input " +
                 "id='leaflemmabox' class='labeledit' type='text' value='" +
                 lemma + "' /></span>");
    $(startnode).children(".wnode").children(".lemma").replaceWith(editor);
    $("#leaflemmabox").keydown(
        function(event) {
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
                newlemma = newlemma.replace("<","&lt;");
                newlemma = newlemma.replace(">","&gt;");
                newlemma = newlemma.replace(/'/g,"&#39;");

                $("#leafeditor").replaceWith("<span class='lemma'>-" +
                                             newlemma + "</span>");
                postChange();
                undo.undoEndTransaction();
                undo.undoBarrier();
            }
        }).mouseup(function editLemmaClick(e) {
            e.stopPropagation();
        });
    setTimeout(function(){ $("#leaflemmabox").focus(); }, 10);
}
editLemma.async = true;
exports.editLemma = editLemma;

/**
 * Perform an appropriate editing operation on the selected node.
 */
function editNode() {
    if (utils.getLabel($(startnode)) === "CODE" &&
        _.contains(conf.commentTypes,
                   // strip leading { and the : and everything after
                   utils.wnodeString($(startnode)).substr(1).split(":")[0])
        ) {
        editComment();
    } else {
        displayRename();
    }
}
editNode.async = true;
exports.editNode = editNode;
