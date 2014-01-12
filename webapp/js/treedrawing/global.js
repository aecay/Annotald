/*global exports: true */

/**
 * This variable holds the selected node, or "start" node if multiple
 * selection is in effect.  Otherwise undefined.
 *
 * @type Node
 */
exports.startnode = null;
/**
 * This variable holds the "end" node if multiple selection is in effect.
 * Otherwise undefined.
 *
 * @type Node
 */
exports.endnode = null;

exports.lastEventWasMouse = false;
exports.lastSavedState = "";
