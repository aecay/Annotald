// TODO: use mousetrap

export interface KeyBinding {
    ctrl: boolean;
    shift: boolean;
    keycode: number;
}

export interface KeyMap {
    [i : number] : {
        func : Function;
        args: any[];
    }
}

export var ctrlKeyMap : KeyMap = {};
export var shiftKeyMap : KeyMap = {};
export var regularKeyMap : KeyMap = {};

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
export function addCommand (dict : KeyBinding, fn : Function) : void {
    var commandMap : KeyMap;
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
}
