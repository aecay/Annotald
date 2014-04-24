var M = require("br-mousetrap");

import _ = require("lodash");

import startup = require("./startup");
import globals = require("./global");
import undo = require("./undo");

// TODO: doc
export var keyBindings : { [key: string] : (e : KeyboardEvent) => void };

export interface KeydownHook {
    (combo : string,
     fn : Function) : void;
}

var keyDownHooks : KeydownHook[] = [];

export function addKeyDownHook(fn : KeydownHook) : void {
    keyDownHooks.push(fn);
};

export function applyArgs (fn : (...args : any[]) => void, ...args : any[])
: (e : KeyboardEvent) => void {
    return function (e : KeyboardEvent) : void {
        fn.apply(undefined, args);
    };
}

function wrapBinding (fn : (e : KeyboardEvent) => void)
: (e : KeyboardEvent, combo : string) => void {
    return function (e : KeyboardEvent, combo : string) : boolean {
        if ($(e.target).parents(".togetherjs,.togetherjs-modal").length > 0) {
            // Don't interfere with TogetherJS UI elements
            return true;
        }
        globals.lastEventWasMouse = false;
        e.preventDefault();
        _.each(keyDownHooks, function (hook : KeydownHook) : void {
            hook(combo, fn);
        });

        fn(e);
        /* tslint:disable:no-string-literal */
        if (!fn["async"]) {
        /* tslint:enable:no-string-literal */
            undo.undoBarrier();
        }
        return false;
    };
}

var bindingsInhibited = false;

M.stopCallback = function stopCallabck(e : KeyboardEvent,
                                       element : HTMLElement,
                                       combo : string)
: boolean {
    // if some other part of the program has turned off the bindings
    if (bindingsInhibited) {
        return true;
    }

    // if the element has the class "mousetrap" then no need to stop
    if (element.classList.contains('mousetrap')) {
        return false;
    }

    // stop for input, select, and textarea
    return element.tagName === 'INPUT' ||
        element.tagName === 'SELECT' ||
        element.tagName === 'TEXTAREA' ||
        (element.contentEditable && element.contentEditable === 'true');
};

export function inhibit () : void {
    bindingsInhibited = true;
}

export function uninhibit () : void {
    bindingsInhibited = false;
}

startup.addStartupHook(function () : void {
    _.each(keyBindings, function (v : (e : KeyboardEvent) => void,
                                  k : string) : void {
        M.bind(k, wrapBinding(v));
    });
});
