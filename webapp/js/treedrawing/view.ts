///<reference path="./../../../types/all.d.ts" />

import globals = require("./global");
import startup = require("./startup");

var startnode = globals.startnode;
var endnode = globals.endnode;

/**
 * Toggle collapsing of a node.
 *
 * When a node is collapsed, its contents are displayed as continuous text,
 * without labels.  The node itself still functions normally with respect to
 * movement operations etc., but its contents are inaccessible.
 */
export function toggleCollapsed () : boolean {
    if (!startnode || endnode) {
        return false;
    }
    $(startnode).toggleClass("collapsed");
    return true;
}

var lemmataStyleNode : HTMLElement;
var lemmataHidden : boolean = true;

startup.addStartupHook(function () : void {
    lemmataStyleNode = document.createElement("style");
    lemmataStyleNode.setAttribute("type", "text/css");
    document.getElementsByTagName("head")[0].appendChild(lemmataStyleNode);
    lemmataStyleNode.innerHTML = ".lemma { display: none; }";
});

startup.addShutdownHook(function () : void {
    lemmataStyleNode.parentNode.removeChild(lemmataStyleNode);
});

/**
 * Toggle display of lemmata.
 */
export function toggleLemmata () : void {
    if (lemmataHidden) {
        lemmataStyleNode.innerHTML = "";
    } else {
        lemmataStyleNode.innerHTML = ".lemma { display: none; }";
    }
    lemmataHidden = !lemmataHidden;
}
