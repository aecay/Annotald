///<reference path="./../../../types/all.d.ts" />

import $ = require("jquery");
import contextmenu = require("./contextmenu");
import metadataEditor = require("./metadata-editor");
import globals = require("./global");

/**
 * This variable holds the selected node, or "start" node if multiple
 * selection is in effect.  Otherwise undefined.
 *
 * @type Node
 */
var startnode : Element = null;
/**
 * This variable holds the "end" node if multiple selection is in effect.
 * Otherwise undefined.
 *
 * @type Node
 */
var endnode : Element = null;

export function updateSelection (suppressRemote? : boolean) : void {
    // update selection display
    $(".snodesel").removeClass("snodesel");

    if (startnode) {
        $(startnode).addClass("snodesel");
    }

    if (endnode) {
        $(endnode).addClass("snodesel");
    }

    metadataEditor.updateMetadataEditor();

    if (!suppressRemote) {
        $(document).trigger("set_selection", [startnode, endnode]);
    }
}

/**
 * Remove any selection of nodes.
 */
export function clearSelection () : void {
    metadataEditor.saveMetadata();
    window.event.preventDefault();
    startnode = endnode = null;
    updateSelection();
    contextmenu.hideContextMenu();
}

/**
 * Select a node, and update the GUI to reflect that.
 *
 * @param {Node} node the node to be selected
 * @param {Boolean} force if true, force this node to be a secondary
 * selection, even if it wouldn't otherwise be
 * @param {Boolean} remote whether this request was triggered remotely
 */
export function selectNode (node : Element, force? : boolean) : void {
    if (node) {
        if (!(node instanceof Element)) {
            try {
                throw Error("foo");
            } catch (e) {
                console.log("selecting a non-node: " + e.stack);
            }
        }
        if (node === document.getElementById("sn0")) {
            clearSelection();
            return;
        }

        while (node && !$(node).hasClass("snode")) {
            node = <Element>node.parentNode;
            if (node.nodeType !== 1) {
                node = undefined;
            }
        }

        if (node === startnode) {
            startnode = null;
            if (endnode) {
                startnode = endnode;
                endnode = null;
            }
        } else if (startnode === null) {
            startnode = node;
        } else {
            if (startnode && (globals.lastEventWasMouse || force)) {
                if (node === endnode) {
                    endnode = null;
                } else {
                    endnode = node;
                }
            } else {
                endnode = null;
                startnode = node;
            }
        }
        updateSelection();
    } else {
        try {
            throw Error("foo");
        } catch (e) {
            console.log("tried to select something falsey: " + e.stack);
        }
    }
}

/**
 * Scroll the page so that the first selected node is visible.
 */
export function scrollToShowSel () : void {
    function isTopVisible (elem : Node) : boolean {
        var docViewTop = $(window).scrollTop();
        var docViewBottom = docViewTop + $(window).height();
        var elemTop = $(elem).offset().top;

        return ((elemTop <= docViewBottom) && (elemTop >= docViewTop));
    }
    if (!isTopVisible(startnode)) {
        window.scroll(0, $(startnode).offset().top - $(window).height() * 0.25);
    }
};

export function get (second? : boolean) : Element {
    if (second) {
        return endnode;
    }
    return startnode;
}

export function set (node: Element, second? : boolean) : void {
    if (second) {
        endnode = node;
    } else {
        startnode = node;
    }
}

export function cardinality () : number {
    if (startnode && endnode) {
        return 2;
    } else if (startnode) {
        return 1;
    } else {
        return 0;
    }
}

export function clear (second? : boolean) : void {
    if (second) {
        endnode = undefined;
    } else {
        startnode = undefined;
    }
}
