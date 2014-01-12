/*global exports: true */

var ctrlKeyMap = {};
var shiftKeyMap = {};
var regularKeyMap = {};

// ** Key bindings

/**
 * Add a keybinding command.
 *
 * Calls to this function should be in the `settings.js` file, grouped in a
 * function called `customCommands`
 *
 * @param {Object} dict a mapping of properties of the keybinding.  Can
 * contain:
 *
 * - `keycode`: the numeric keycode for the binding (mandatory)
 * - `shift`: true if this is a binding with shift pressed (optional)
 * - `ctrl`: true if this is a binding with control pressed (optional)
 *
 * @param {Function} fn the function to associate with the keybinding.  Any
 * further arguments to the `addCommand` function are passed to `fn` on each
 * invocation.
 */
exports.addCommand = function addCommand(dict, fn) {
    var commandMap;
    if (dict.ctrl) {
        commandMap = ctrlKeyMap;
    } else if (dict.shift) {
        commandMap = shiftKeyMap;
    } else {
        commandMap = regularKeyMap;
    }
    commandMap[dict.keycode] = {
        func: fn,
        args: Array.prototype.slice.call(arguments, 2)
    };
};
