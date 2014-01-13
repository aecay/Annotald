///<reference path="./../../../types/all.d.ts" />

import $ = require("jquery");
import startup = require("./startup");
import utils = require("./utils");
import dialog = require("./dialog");
var logger = require("../ui/log");

// TODO: anchor right end of string, so that NP does not match NPR, only NP or
// NP-X (???)

// TODO: profile this and optimize like crazy.

// * HTML strings and other globals

/**
 * The HTML code for a regular search node
 * @private
 * @constant
 */
// TODO: make the presence of a lemma search option contingent on the presence
// of lemmata in the corpus
var searchnodehtml = "<div class='searchnode'>" +
        "<div class='searchadddelbuttons'>" +
        "<input type='button' class='searchornodebut' " +
        "value='|' />" +
        "<input type='button' class='searchdeepnodebut' " +
        "value='D' />" +
        "<input type='button' class='searchprecnodebut' " +
        "value='>' />" +
        "<input type='button' class='searchdelnodebut' " +
        "value='-' />" +
        "<input type='button' class='searchnewnodebut' " +
        "value='+' />" +
        "</div>" +
        "<select class='searchtype'><option>Label</option>" +
        "<option>Text</option><option>Lemma</option></select>: " +
        "<input type='text' class='searchtext' />" +
        "</div>";

/**
 * The HTML code for an "or" search node
 * @private
 * @constant
 */
var searchornodehtml = "<div class='searchnode searchornode'>" +
        "<div class='searchadddelbuttons'>" +
        "<input type='button' class='searchdelnodebut' value='-' />" +
        "</div>" +
        "<input type='hidden' class='searchtype' value='Or' />OR<br />" +
        searchnodehtml + "</div>";

/**
 * The HTML code for a "deep" search node
 * @private
 * @constant
 */
var searchdeepnodehtml = "<div class='searchnode searchdeepnode'>" +
        "<div class='searchadddelbuttons'>" +
        "<input type='button' class='searchdelnodebut' value='-' />" +
        "</div>" +
        "<input type='hidden' class='searchtype' value='Deep' />...<br />" +
        searchnodehtml + "</div>";

/**
 * The HTML code for a "precedes" search node
 * @private
 * @constant
 */
var searchprecnodehtml = "<div class='searchnode searchprecnode'>" +
        "<div class='searchadddelbuttons'>" +
        "<input type='button' class='searchdelnodebut' value='-' />" +
        "</div>" +
        "<input type='hidden' class='searchtype' value='Prec' />&gt;<br />" +
        searchnodehtml + "</div>";

/**
 * The HTML code for a node to add new search nodes
 * @private
 * @constant
 */
var addsearchnodehtml = "<div class='newsearchnode'>" +
        "<input type='hidden' class='searchtype' value='NewNode' />+" +
        "</div>";

/**
 * The HTML code for the default starting search node
 * @private
 * @constant
 */
var searchhtml = "<div id='searchnodes' class='searchnode'><input type='hidden' " +
        "class='searchtype' value='Root' />" + searchnodehtml + "</div>";

/**
 * The last search
 *
 * So that it can be restored next time the dialog is opened.
 * @private
 */
var savedsearch = $(searchhtml);

// * Helper functions

/**
 * Indicate that a node matches a search
 *
 * @param {Node} node the node to flag
 */
function flagSearchMatch (node: Node) : void {
    $(node).addClass("searchmatch");
    $("#matchcommands").show();
}

/**
 * Hook up event handlers after adding a node to the search dialog
 */
function searchNodePostAdd (node? : JQuery) : void {
    $(".searchnewnodebut").unbind("click").click(addSearchDaughter);
    $(".searchdelnodebut").unbind("click").click(searchDelNode);
    $(".searchdeepnodebut").unbind("click").click(searchDeepNode);
    $(".searchornodebut").unbind("click").click(searchOrNode);
    $(".searchprecnodebut").unbind("click").click(searchPrecNode);
    rejiggerSearchSiblingAdd();
    var nodeToFocus = (node && node.find(".searchtext")) ||
            $(".searchtext").first();
    nodeToFocus.focus();
}

/**
 * Recalculate the position of nodes that add siblings in the search dialog.
 * @private
 */
function rejiggerSearchSiblingAdd () : void {
    $(".newsearchnode").remove();
    $(".searchnode").map(function () : void {
        $(this).children(".searchnode").last().after(addsearchnodehtml);
    });
    $(".newsearchnode").click(addSearchSibling);
}

/**
 * Remember the currently-entered search, in order to restore it subsequently.
 * @private
 */
function saveSearch () : void {
    savedsearch = $("#searchnodes").clone();
    var savedselects = savedsearch.find("select");
    var origselects = $("#searchnodes").find("select");
    savedselects.map(function (i : number) : void {
        $(this).val(origselects.eq(i).val());
    });
}

/**
 * Perform the search as entered in the dialog
 * @private
 */
function doSearch () : void {
    // TODO: need to save val of incremental across searches
    var searchnodes = $("#searchnodes");
    saveSearch();
    dialog.hideDialogBox();
    var searchCtx = $(".snode"); // TODO: remove sn0
    var incremental = $("#searchInc").prop("checked");

    if (incremental && $(".searchmatch").length > 0) {
        var lastMatchTop = $(".searchmatch").last().offset().top;
        searchCtx = searchCtx.filter(function () : boolean {
            // TODO: do this with faster document position dom call
            return $(this).offset().top > lastMatchTop;
        });
    }

    clearSearchMatches();

    for (var i = 0; i < searchCtx.length; i++) {
        var res = interpretSearchNode(searchnodes, searchCtx[i]);
        if (res) {
            flagSearchMatch(res);
            if (incremental) {
                break;
            }
        }
    }
    nextSearchMatch(null, true);
    // TODO: when reaching the end of the document in incremental search,
    // don't dehighlight the last match, but print a nice message

    // TODO: need a way to go back in incremental search
}

/**
 * Clear any previous search, reverting the dialog back to its default state.
 * @private
 */
function clearSearch () : void {
    savedsearch = $(searchhtml);
    $("#searchnodes").replaceWith(savedsearch);
    searchNodePostAdd();
}

// * Event handlers

/**
 * Clear the highlighting from search matches.
 */
function clearSearchMatches () : void {
    $(".searchmatch").removeClass("searchmatch");
    $("#matchcommands").hide();
}

/**
 * Scroll down to the next node that matched a search.
 */
function nextSearchMatch(e : Event, fromSearch : boolean) : void {
    if (!fromSearch) {
        if ($("#searchInc").prop("checked")) {
            doSearch();
        }
    }
    utils.scrollToNext(".searchmatch");
}

/**
 * Add a sibling search node
 * @private
 */
function addSearchDaughter (e : Event) : void {
    var node = $(e.target).parents(".searchnode").first();
    var newnode = $(searchnodehtml);
    node.append(newnode);
    searchNodePostAdd(newnode);
}

/**
 * Add a sibling search node
 * @private
 */
function addSearchSibling(e : Event) : void {
    var node = $(e.target);
    var newnode = $(searchnodehtml);
    node.before(newnode);
    searchNodePostAdd(newnode);
}

/**
 * Delete a search node
 * @private
 */
function searchDelNode(e : Event) : void {
    var node = $(e.target).parents(".searchnode").first();
    var tmp = $("#searchnodes").children(".searchnode:not(.newsearchnode)");
    if (tmp.length === 1 && tmp.is(node) &&
        node.children(".searchnode").length === 0) {
        logger.warning("Cannot remove only search term!");
        return;
    }
    var child = node.children(".searchnode").first();
    if (child.length === 1) {
        node.contents().filter(":not(.searchnode)").remove();
        child.unwrap();
    } else {
        node.remove();
    }
    rejiggerSearchSiblingAdd();
}

/**
 * Add an "or" search node
 * @private
 */
function searchOrNode(e : Event) : void {
    var node = $(e.target).parents(".searchnode").first();
    var newnode = $(searchornodehtml);
    node.replaceWith(newnode);
    newnode.children(".searchnode").replaceWith(node);
    searchNodePostAdd(newnode);
}

/**
 * Add a "deep" search node
 * @private
 */
function searchDeepNode(e : Event) : void {
    var node = $(e.target).parents(".searchnode").first();
    var newnode = $(searchdeepnodehtml);
    node.append(newnode);
    searchNodePostAdd(newnode);
}

/**
 * Add a "precedes" search node
 * @private
 */
function searchPrecNode(e : Event) : void {
    var node = $(e.target).parents(".searchnode").first();
    var newnode = $(searchprecnodehtml);
    node.after(newnode);
    searchNodePostAdd(newnode);
}

// * Search interpretation function

/**
 * Interpret the DOM nodes comprising the search dialog.
 *
 * This function is treponsible for transforming the representation of a
 * search query as HTML into an executable query, and matching it against a
 * node.
 * @private
 *
 * @param {Node} node the search node to interpret
 * @param {Node} target the tree node to match it against
 * @param {Object} options search options
 * @returns {Node} `target` if it matched the query, otherwise `undefined`
 */

function interpretSearchNode(node : JQuery,
                             target : Node,
                             options : { norecurse? : boolean; } = {}) : Node {
    // TODO: optimize to remove jquery calls, only use regex matching if needed
    // TODO: make case sensitivity an option?
    var searchtype = $(node).children(".searchtype").val();
    var rx, hasMatch, i, j;
    var newTarget = $(target).children();
    var childSearches = $(node).children(".searchnode");

    if ($(node).parent().is("#searchnodes") &&
        !$("#searchnodes").children(".searchnode").first().is(node) &&
        !options.norecurse) {
        // special case siblings at root level
        // What an ugly hack, can it be improved?
        newTarget = $(target).siblings();
        for (j = 0; j < newTarget.length; j++) {
            if (interpretSearchNode(node, newTarget[j], { norecurse: true })) {
                return target;
            }
        }
    }

    if (searchtype === "Label") {
        rx = RegExp("^" + $(node).children(".searchtext").val(), "i");
        hasMatch = $(target).hasClass("snode") && rx.test(utils.getLabel($(target)));
        if (!hasMatch) {
            return undefined;
        }
    } else if (searchtype === "Text") {
        rx = RegExp("^" + $(node).children(".searchtext").val(), "i");
        hasMatch = $(target).children(".wnode").length === 1 &&
            rx.test(utils.wnodeString(target));
        if (!hasMatch) {
            return undefined;
        }
    } else if (searchtype === "Lemma") {
        rx = RegExp("^" + $(node).children(".searchtext").val(), "i");
        hasMatch = utils.hasLemma($(target)) &&
            rx.test(utils.getLemma($(target)));
        if (!hasMatch) {
            return undefined;
        }
    } else if (searchtype === "Root") {
        newTarget = $(target);
    } else if (searchtype === "Or") {
        for (i = 0; i < childSearches.length; i++) {
            if (interpretSearchNode($(childSearches[i]), target)) {
                return target;
            }
        }
        return undefined;
    } else if (searchtype === "Deep") {
        newTarget = $(target).find(".snode,.wnode");
    } else if (searchtype === "Prec") {
        newTarget = $(target).nextAll();
    }

    for (i = 0; i < childSearches.length; i++) {
        var succ = false;
        for (j = 0; j < newTarget.length; j++) {
            if (interpretSearchNode($(childSearches[i]), newTarget[j])) {
                succ = true;
                break;
            }
        }
        if (!succ) {
            return undefined;
        }
    }

    return target;
}

// * The core search function

/**
 * Display a search dialog.
 */
export function search () : void {
    var html = "<div id='searchnodes' />" +
            "<div id='dialogButtons'><label for='searchInc'>Incremental: " +
            "</label><input id='searchInc' name='searchInc' type='checkbox' />" +
            // TODO: it seems that any plausible implementation of search is
            // going to use rx, so it doesn't make sense to turn it off
            // "<label for='searchRE'>Regex: </label>" +
            // "<input id='searchRE' name='searchRE' type='checkbox' />" +
            "<input id='clearSearch' type='button' value='Clear' />" +
            "<input id='doSearch' type='button' value='Search' /></div>";
    dialog.showDialogBox("Search", html, doSearch, saveSearch);
    $("#searchnodes").replaceWith(savedsearch);
    $("#doSearch").click(doSearch);
    $("#clearSearch").click(clearSearch);
    searchNodePostAdd();
}

// * Startup hook
startup.addStartupHook(function () : void {
    $("#butsearch").click(search);
    $("#butnextmatch").click(nextSearchMatch);
    $("#butclearmatch").click(clearSearchMatches);
    $("#matchcommands").hide();
});
