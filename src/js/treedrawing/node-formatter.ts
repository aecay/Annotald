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
import lc = require("./label-convert");

// TODO: should be private; figure out how to observe metadata
export function formatSnode (snode : HTMLElement) : void {
    if (snode.getAttribute("data-freezeWatch") ||
        snode.getAttribute("id") === "sn0" ||
        snode.classList.contains("sentnode")) {
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
    var label = lc.getLabelForNode(snode);
    label += " ";
    textNode.nodeValue = label;

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
                var ecType = snode.getAttribute("data-ectype");
                if (ecType === "zero") {
                    wnode.text("0");
                } else if (ecType === "star") {
                    wnode.text("*");
                } else {
                    wnode.text("*" + ecType + "*");
                }
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
        if (record.type === "attributes") {
            if (record.target.nodeType === 1) {
                formatSnode(<HTMLElement>record.target);
            }
        } else if (record.type === "childList") {
            // If a meta node is removed wholesale, it won't trigger as a subtree
            // modification in snode0Addition; thus we must take care of that
            // case here.
            _.each(record.removedNodes, function (node : Node) : void {
                if (node instanceof HTMLElement) {
                    if ((<HTMLElement>node).classList.contains("meta") &&
                        (<HTMLElement>node).getAttribute("data-tag") === "meta") {
                        formatSnode(<HTMLElement>record.target);
                    }
                }
            });
        }
    });
}
var snodeMO = new MutationObserver(snodeChange);

function metaNodeChange (records : MutationRecord[],
                      observer : MutationObserver) : void
{
    _.each(records, function (record : MutationRecord) : void {
        if (record.target.nodeType === 1) {
            var p = $(<HTMLElement>record.target).parents(".snode").get(0);
            if (p) {
                formatSnode(p);
            }
        }
    });
}
var metaNodeMO = new MutationObserver(metaNodeChange);

function observeMetaNode (node : HTMLElement) : void {
    metaNodeMO.observe(node, { childList: true, subtree: true });
}

function snode0Addition (records : MutationRecord[],
                         observer : MutationObserver) : void
{
    _.each(records, function (record : MutationRecord) : void {
        _.each(record.addedNodes, function (node : Node) : void {
            if (node instanceof HTMLElement) {
                if ((<HTMLElement>node).classList.contains("snode")) {
                    formatSnode(<HTMLElement>node);
                    observeSnode(<Element>node);
                } else if ((<HTMLElement>node).classList.contains("meta") &&
                           (<HTMLElement>node).getAttribute("data-tag") === "meta") {
                    observeMetaNode(<HTMLElement>node);
                    var p = $(<HTMLElement>node).parents(".snode").get(0);
                    if (p) {
                        formatSnode(p);
                    }
                }
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
    $(".meta").filter(function () : boolean {
        return this.getAttribute("data-tag") === "meta";
    }).each(function () : void {
        observeMetaNode(this);
    });
    snode0MO.observe(document.getElementById("sn0"),
                     { childList: true, subtree: true });
});

export function observeSnode (snode : Element) : void {
    // TODO: We also need the metadata to be observed; for now we handle it in
    // the event handler
    snodeMO.observe(snode, { attributes: true, childList: true, subtree: true });
}
