///<reference path="./../../../types/all.d" />

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
    tv += " "
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
