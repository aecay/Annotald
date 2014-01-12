/*global require: false, exports: true */

/*jshint browser: true, devel: true */

var $ = require("jquery"),
    globals = require("./global"),
    startnode = globals.startnode,
    endnode = globals.endnode,
    contextmenu = require("./contextmenu"),
    metadataEditor = require("./metadata-editor");

function updateSelection (remote) {
    // update selection display
    $(".snodesel").removeClass("snodesel");

    if (startnode) {
        $(startnode).addClass("snodesel");
    }

    if (endnode) {
        $(endnode).addClass("snodesel");
    }

    metadataEditor.updateMetadataEditor();

    if (!remote) {
        $(document).trigger("set_selection", [startnode, endnode]);
    }
}
exports.updateSelection = updateSelection;

/**
 * Remove any selection of nodes.
 */
function clearSelection () {
    metadataEditor.saveMetadata();
    window.event.preventDefault();
    startnode = endnode = null;
    updateSelection();
    contextmenu.hideContextMenu();
}
exports.clearSelection = clearSelection;

/**
 * Select a node, and update the GUI to reflect that.
 *
 * @param {Node} node the node to be selected
 * @param {Boolean} force if true, force this node to be a secondary
 * selection, even if it wouldn't otherwise be
 * @param {Boolean} remote whether this request was triggered remotely
 */
function selectNode (node, force) {
    if (node) {
        if (!(node instanceof Node)) {
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

        while (!$(node).hasClass("snode") && node !== document) {
            node = node.parentNode;
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
exports.selectNode = selectNode;

/**
 * Scroll the page so that the first selected node is visible.
 */
exports.scrollToShowSel = function scrollToShowSel() {
    function isTopVisible(elem) {
        var docViewTop = $(window).scrollTop();
        var docViewBottom = docViewTop + $(window).height();
        var elemTop = $(elem).offset().top;

        return ((elemTop <= docViewBottom) && (elemTop >= docViewTop));
    }
    if (!isTopVisible(startnode)) {
        window.scroll(0, $(startnode).offset().top - $(window).height() * 0.25);
    }
};
