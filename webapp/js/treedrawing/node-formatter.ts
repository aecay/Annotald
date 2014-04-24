///<reference path="./../../../types/all.d" />

// IE continues to strike: https://typescript.codeplex.com/workitem/1598
// Ugh.
interface MutationObserver {
    observe(target : Node, options : MutationObserverInit) : void;
    takeRecords() : MutationRecord[];
    disconnect() : void;
}
declare var MutationObserver: {
    prototype : MutationObserver;
    new (callback: (arr : MutationRecord[],
                    observer : MutationObserver) => any) : MutationObserver;
};

import $ = require("jquery");
import _ = require("lodash");
import startup = require("./startup");

function formatSnode (snode : Node) : void {
    var textNode = snode.childNodes[0];
    if (textNode.nodeType !== 3) {
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
}

function snodeChange (records : MutationRecord[],
                      observer : MutationObserver) : void
{
    _.each(records, function (record : MutationRecord) : void {
        formatSnode(record.target);
    });
}

var snodeMO = new MutationObserver(snodeChange);

startup.addStartupHook(function () : void {
    $(".snode").each(function () : void {
        if (this.id === "sn0") {
            return;
        }
        formatSnode(this);
        observeSnode(this);
    });
});

export function observeSnode (snode : Element) : void {
    snodeMO.observe(snode, { attributes: true });
}
