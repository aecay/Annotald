function quitServer(e, force) {
    unAutoIdle();
    if (!force && $("#editpane").html() != lastsavedstate) {
        displayError("Cannot exit, unsaved changes exist.  <a href='#' " +
                    "onclick='quitServer(null, true);return false;'>Force</a>");
    } else {
        $.post("/doExit");
        window.onbeforeunload = undefined;
        setTimeout(function(res) {
                       // I have no idea why this works, but it does
                       window.open('', '_self', '');
                       window.close();
               }, 100);
    }
}
