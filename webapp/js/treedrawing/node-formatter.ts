///<reference path="./../../../types/all.d" />

// IE continues to strike: https://typescript.codeplex.com/workitem/1598
// Ugh.
interface MutationObserver {
    observe(target : Node, options : MutationObserverInit) : void;
    takeRecords() : MutationRecord[];
    disconnect() : void;
}
declare var MutationObserver : {
    prototype : MutationObserver;
    new (callback: (arr : MutationRecord[],
                    observer : MutationObserver) => any) : MutationObserver;
};

import $ = require("jquery");
import _ = require("lodash");
import startup = require("./startup");
import metadata = require("./metadata");

function formatSnode (snode : Element) : void {
    if (snode.getAttribute("data-freezeWatch")) {
        return;
    }
    var textNode = snode.childNodes[0];
    if (!textNode || textNode.nodeType !== 3) {
        var newTN = document.createTextNode("");
        snode.insertBefore(newTN, textNode);
        textNode = newTN;
    }
    if (snode.nodeType !== 1) {
        throw "Tried to format a non-snode.";
    }
    var snodeElement = <Element>snode;
    var tv = snodeElement.getAttribute("data-category");
    if (snodeElement.getAttribute("data-subcategory")) {
        tv += "-" + snodeElement.getAttribute("data-subcategory");
    }
    if (snodeElement.getAttribute("data-index")) {
        tv += snodeElement.getAttribute("data-idxtype") === "gap" ? "=" : "-";
        tv += snodeElement.getAttribute("data-index");
    }
    tv += " ";
    textNode.nodeValue = tv;

    // Lemma
    var wnode = $(snode).children(".wnode");
    var nodeType = snode.getAttribute("data-nodetype");
    if (nodeType && _.contains(["trace", "ec", "comment"], nodeType)) {
        if (wnode.length === 0) {
            wnode = $(document.createElement("span"));
            wnode.addClass("wnode");
            wnode.addClass("autoWnode");
            $(snode).append(wnode);
            if (nodeType === "trace") {
                wnode.text("*" + snode.getAttribute("data-tracetype") + "*");
            } else if (nodeType === "ec") {
                wnode.text("*" + snode.getAttribute("data-ectype") + "*");
            }
            // TODO: how to manage the text here?
            // else if (nodeType === "comment") {
            //     wnode.text("{" + snode.getAttribute("data-comtype") +
            //                snode.getAttribute("data-ectype") + "}");
            // }
        }
    }
    /* tslint:disable:no-string-literal */
    var lemma = metadata.getMetadata(snode)["lemma"];
    /* tslint:enable:no-string-literal */
    if (wnode.length > 0 && lemma) {
        $(snode).find(".lemma").remove();
        wnode.append($("<span class='lemma'>-" + lemma + "</span>"));
    }
}

function snodeChange (records : MutationRecord[],
                      observer : MutationObserver) : void
{
    _.each(records, function (record : MutationRecord) : void {
        formatSnode(<Element>record.target);
    });
}
var snodeMO = new MutationObserver(snodeChange);

function snode0Addition (records : MutationRecord[],
                         observer : MutationObserver) : void
{
    _.each(records, function (record : MutationRecord) : void {
        _.each(record.addedNodes, function (node : Node) : void {
            if (node instanceof HTMLElement &&
                (<HTMLElement>node).classList.contains("snode")) {
                formatSnode(<Element>node);
                observeSnode(<Element>node);
            }
        });
    });
}
var snode0MO = new MutationObserver(snode0Addition);

startup.addStartupHook(function () : void {
    $(".snode").each(function () : void {
        if (this.id === "sn0" || this.getAttribute("data-freezeWatch")) {
            return;
        }
        formatSnode(this);
        observeSnode(this);
    });
    snode0MO.observe(document.getElementById("sn0"),
                     { childList: true, subtree: true });
});

export function observeSnode (snode : Element) : void {
    snodeMO.observe(snode, { attributes: true });
}
