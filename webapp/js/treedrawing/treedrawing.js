// Copyright (c) 2011, 2012 Anton Karl Ingason, Aaron Ecay, Jana Beck

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

// Global TODOs:
// - (AWE) make the dash-tags modular, so that ctrl x -> set XXX, w ->
//   set NP-SBJ doesn't blow away the XXX
// - (AWE) what happens when you delete e.g. an NP node w metadata?
//   Does the metadata get blown away? pro/demoted? Does deletion fail, or
//   raise a prompt?
// - strict mode
// - modularize doc -- namespaces?
// - make key commands for case available

// TODO: for unsaved ch warning: use tolabeledbrax, not html...html is
// sensitive to search highlight, selection, etc

/*jshint ignore:start */

// * Initialization




var currentIndex = 1; // TODO: move to where it goes

function logUnload() {
    logEvent("page-unload");
}

addStartupHook(function() {
    logEvent("page-load");
});

// * UI functions

/**
 * Show the message history.
 */
function showMessageHistory() {
    showDialogBox("Messages", "<textarea readonly='readonly' " +
                  "style='width:100%;height:100%;'>" +
                  messageHistory + "</textarea>");
}
addStartupHook(function () {
    $("#messagesTitle").click(showMessageHistory);
});


// * Server-side operations

// ** Validating

var validatingCurrently = false;

function validateTrees(e) {
    if (!validatingCurrently) {
        validatingCurrently = true;
        displayInfo("Validating...");
        setTimeout(function () {
            // TODO: since this is a settimeout, do we need to also make it async?
            validateTreesSync(true, e.shiftKey);
        }, 0);
    }
}

function validateTreesSync(async, shift) {
    var toValidate = toLabeledBrackets($("#editpane"));
    $.ajax("/doValidate",
           { type: 'POST',
             url: "/doValidate",
             data: { trees: toValidate,
                     validator: $("#validatorsSelect").val(),
                     shift: shift
                   },
             success: validateHandler,
             async: async,
             dataType: "json"
           });
}

function validateHandler(data) {
    if (data.result == "success") {
        displayInfo("Validate success.");
        $("#editpane").html(data.html);
        assignEvents();
        prepareUndoIds();
    } else if (data.result == "failure") {
        displayWarning("Validate failed: " + data.reason);
    }
    validatingCurrently = false;
    // TODO(AWE): more nuanced distinction between validation found errors and
    // validation script itself contains errors
}

function nextValidationError() {
    var node = scrollToNext(".snode[class*=\"FLAG\"],.snode[class$=\"FLAG\"]");
    selectNode(node.get(0));
}

// ** Advancing through the file

function nextTree(e) {
    e = e || {};
    var find;
    if (e.shiftKey) find = "-FLAG";
    advanceTree(find, false, 1);
}

function prevTree(e) {
    e = e || {};
    var find;
    if (e.shiftKey) find = "-FLAG";
    advanceTree(find, false, -1);
}

function advanceTree(find, async, offset) {
    var theTrees = toLabeledBrackets($("#editpane"));
    displayInfo("Fetching tree...");
    return $.ajax("/advanceTree",
                  { async: async,
                    success: function(res) {
                        if (res.result == "failure") {
                            displayWarning("Fetching tree failed: " + res.reason);
                        } else {
                            // TODO: what to do about the save warning
                            $("#editpane").html(res.tree);
                            documentReadyHandler();
                            nukeUndo();
                            currentIndex = res.treeIndexStart + 1;
                            displayInfo("Tree " + currentIndex + " fetched.");
                            displayTreeIndex("Editing tree #" + currentIndex +
                                             " out of " + res.totalTrees);
                        }
                    },
                    dataType: "json",
                    type: "POST",
                    data: { trees: theTrees,
                            find: find,
                            offset: offset
                          }});
}

function displayTreeIndex(text) {
    $("#treeIndexDisplay").text(text);
}

// TODO: test post-merge
function goToTree() {
    function goTo() {
        var i;
        var treeIndex = $("#gotoInput").val();
        advanceTree(undefined, false, treeIndex - currentIndex);
        hideDialogBox();
    }
    var html = "Enter the index of the tree you'd like to jump to: \
<input type='text' id='gotoInput' value=' ' /><div id='dialogButtons'><input type='button' id='gotoButton'\
 value='GoTo' /></div>";
    showDialogBox("GoTo Tree", html, goTo);
    $("#gotoButton").click(goTo);
    $("#gotoInput").focus();
}

// ** Event logging and idle

// *** Event logging function

function logEvent(type, data) {
    data = data || {};
    data.type = type;
    $.ajax("/doLogEvent",
          {
              async: true,
              dataType: "json",
              type: "POST",
              data: { eventData: JSON.stringify(data) },
              traditional: true
          });
}

// *** Idle timeout

var idleTimeout = false;
var isIdle = false;

function resetIdleTimeout() {
    if (idleTimeout) {
        clearTimeout(idleTimeout);
    }
    idleTimeout = setTimeout(autoIdle, 30 * 1000);
}

function autoIdle() {
    logEvent("auto-idle");
    becomeIdle();
}

addStartupHook(resetIdleTimeout);

addKeyDownHook(function() {
    unAutoIdle();
    resetIdleTimeout();
});

addClickHook(function() {
    unAutoIdle();
    resetIdleTimeout();
});

function unAutoIdle() {
    if (isIdle) {
        logEvent("auto-resume");
        becomeEditing();
    }
}

// *** User interface

function becomeIdle() {
    isIdle = true;
    $("#idlestatus").html("<div style='color:#C75C5C'>IDLE.</div>");
    $("#butidle").unbind("mousedown").mousedown(resume);
}

function becomeEditing() {
    isIdle = false;
    $("#idlestatus").html("<div style='color:#64C465'>Editing.</div>");
    $("#butidle").unbind("mousedown").mousedown(idle);
}

function idle() {
    logEvent("user-idle");
    becomeIdle();
}

function resume() {
    logEvent("user-resume");
    becomeEditing();
}

// *** Key/click logging

addStartupHook(function () {
    // This must be delayed, because this file is loaded before settings.js is
    if (logDetail) {
        addKeyDownHook(function (keydata, fn, args) {
            var key = (keydata.ctrl ? "C-" : "") +
                    (keydata.shift ? "S-" : "") +
                    String.fromCharCode(keydata.keyCode),
                theFn = fn.name + "(" +
                    args.map(function (x) { return JSON.stringify(x); }).join(", ") +
                    ")";
            logEvent("keypress",
                     { key: key,
                       fn: theFn
                     });
        });

        addClickHook(function (button) {
            logEvent("mouse-click",
                     { button: button
                     });
        });

        // TODO: what about mouse movement?
    }
});


// * Misc

function fixError() {
    if (!startnode || endnode) return;
    var sn = $(startnode);
    if (hasDashTag(sn, "FLAG")) {
        toggleExtension("FLAG", ["FLAG"]);
    }
    updateSelection();
}

function zeroDashTags() {
    if (!startnode || endnode) return;
    var label = getLabel($(startnode));
    var idx = parseIndex(label),
        idxType = parseIndexType(label),
        lab = parseLabel(label);
    if (idx == -1) {
        idx = idxType = "";
    }
    touchTree($(startnode));
    setLabelLL($(startnode), lab.split("-")[0] + idxType + idx);
}

// TODO: should allow numeric indices; document
function basesAndDashes(bases, dashes) {
    function _basesAndDashes(string) {
        var spl = string.split("-");
        var b = spl.shift();
        return (bases.indexOf(b) > -1) &&
            _.all(spl, function (x) { return (dashes.indexOf(x) > -1); });
    }
    return _basesAndDashes;
}

function untilSuccess() {
    for (var i = 0; i < arguments.length; i++) {
        var fn = arguments[i][0],
            args = arguments[i].slice(1);
        var res = fn.apply(null, args);
        if (res) {
            return;
        }
    }
}

function leafOrNot(leaf, not) {
    var fn, args;
    if (guessLeafNode($(startnode))) {
        fn = arguments[0][0];
        args = arguments[0].slice(1);
    } else {
        fn = arguments[1][0];
        args = arguments[1].slice(1);
    }
    fn.apply(null, args);
}

// TODO: badly need a DSL for forms

// Local Variables:
// js2-additional-externs: ("$" "setTimeout" "customCommands\
// " "customConLeafBefore" "customConMenuGroups" "extensions" "leaf_extensions\
// " "clause_extensions" "JSON" "testValidLeafLabel" "testValidPhraseLabel\
// " "_" "startTime" "console" "loadContextMenu" "safeGet\
// " "jsonToTree" "objectToTree" "dictionaryToForm" "formToDictionary\
// " "displayWarning" "displayInfo" "displayError" "isEmpty" "isPossibleTarget\
// " "isRootNode" "isLeafNode" "guessLeafNode" "getTokenRoot" "wnodeString\
// " "currentText" "getLabel" "textNode" "getMetadata" "hasDashTag\
// " "parseIndex" "parseLabel" "parseIndexType" "getIndex" "getIndexType\
// " "shouldIndexLeaf" "maxIndex" "addToIndices" "changeJustLabel\
// " "toggleStringExtension" "lookupNextLabel" "commentTypes\
// " "invisibleCategories" "invisibleRootCategories" "ipnodes" "messageHistory\
// " "scrollToNext" "clearTimeout" "logDetail" "hasLemma" "getLemma\
// " "logDetail" "isEmptyNode")
// indent-tabs-mode: nil
// eval: (outline-minor-mode 1)
// End:
