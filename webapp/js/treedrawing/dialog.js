/*global exports: true, require: false */

/*jshint quotmark: false, browser: true */

// TODO: migrate to vex

var $ = require("jquery"),
    events = require("./events");

var dialogShowing = false;

exports.isDialogShowing = function () {
    return dialogShowing;
};

/**
 * Hide the displayed dialog box.
 */
function hideDialogBox () {
    $("#dialogBox").get(0).style.visibility = "hidden";
    $("#dialogBackground").get(0).style.visibility = "hidden";
    document.body.onkeydown = events.handleKeyDown;
    dialogShowing = false;
}
exports.hideDialogBox = hideDialogBox;

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
exports.showDialogBox = function showDialogBox(title, html, returnFn, hideHook) {
    document.body.onkeydown = function (e) {
        if (e.keyCode === 27) { // escape
            if (hideHook) {
                hideHook();
            }
            hideDialogBox();
        } else if (e.keyCode === 13 && returnFn) {
            returnFn();
        }
    };
    html = '<div class="menuTitle">' + title + '</div>' +
        '<div id="dialogContent">' + html + '</div>';
    $("#dialogBox").html(html).get(0).style.visibility = "visible";
    $("#dialogBackground").get(0).style.visibility = "visible";
    dialogShowing = true;
};

// TODO: ideally we would not export this, but there is a caller...
/**
 * Set a handler for the enter key in a text box.
 * @private
 */
exports.setInputFieldEnter = function setInputFieldEnter(field, fn) {
    field.keydown(function (e) {
        if (e.keyCode === 13) {
            fn();
            return false;
        } else {
            return true;
        }
    });
};
