///<reference path="./../../../types/all.d.ts" />

// TODO: migrate to vex

import $ = require("jquery");

import events = require("./events");
import bindings = require("./bindings");

var dialogShowing : boolean = false;

export function isDialogShowing () : boolean {
    return dialogShowing;
};

/**
 * Hide the displayed dialog box.
 */
export function hideDialogBox () : void {
    $("#dialogBox").get(0).style.visibility = "hidden";
    $("#dialogBackground").get(0).style.visibility = "hidden";
    bindings.uninhibit();
    dialogShowing = false;
}

/**
 * Show a dialog box.
 *
 * This function creates keybindings for the escape (to close dialog box) and
 * return (caller-specified behavior) keys.
 *
 * @param {String} title the title of the dialog box
 * @param {String} html the html to display in the dialog box
 * @param {Function} returnFn a function to call when return is pressed
 * @param {Function} hideHook a function to run when hiding the dialog box
 */
export function showDialogBox(title : string,
                              html : string,
                              returnFn? : () => void,
                              hideHook? : () => void) : void {
    document.body.onkeydown = function (e : KeyboardEvent)  : void {
        if (e.keyCode === 27) { // escape
            if (hideHook) {
                hideHook();
            }
            hideDialogBox();
        } else if (e.keyCode === 13 && returnFn) {
            returnFn();
        }
    };
    html = "<div class=\"menuTitle\">" + title + "</div>" +
        "<div id=\"dialogContent\">" + html + "</div>";
    $("#dialogBox").html(html).get(0).style.visibility = "visible";
    $("#dialogBackground").get(0).style.visibility = "visible";
    dialogShowing = true;
}

// TODO: ideally we would not export this, but there is a caller...
/**
 * Set a handler for the enter key in a text box.
 * @private
 */
export function setInputFieldEnter(field : JQuery,
                                   fn : () => void) : void {
    field.keydown(function (e : KeyboardEvent) : boolean {
        if (e.keyCode === 13) {
            fn();
            return false;
        } else {
            return true;
        }
    });
}
