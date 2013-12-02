function annotaldCollabSelectionSend (event, sn, en) {
    var elementFinder = TogetherJS.require("elementFinder");
    var sn_loc = sn && elementFinder.elementLocation(sn);
    var en_loc = en && elementFinder.elementLocation(en);
    TogetherJS.send({
        type: "set_selection",
        sn: sn_loc,
        en: en_loc
    });
}

function annotaldCollabSelectionReceive (msg) {
    var elementFinder = TogetherJS.require("elementFinder");
    try {
        startnode = msg.sn && elementFinder.findElement(msg.sn);
        endnode = msg.en && elementFinder.findElement(msg.en);
    } catch (e) {
        displayError("Problems with the collaboration engine: can't find node");
    }
    updateSelection(true);
}

function annotaldCollabSelectionSync (msg) {
    if (msg.sameUrl) {
        annotaldCollabSelectionSend(null, startnode, endnode);
    }
}

var TogetherJSConfig_toolName = "Collaboration",
    TogetherJSConfig_suppressJoinConfirmation = true,
    TogetherJSConfig_findRoom = TJSroom,
    TogetherJSConfig_on_ready = function annotaldCollabReady () {
        $(document).on("set_selection", annotaldCollabSelectionSend);
        TogetherJS.hub.on("set_selection", annotaldCollabSelectionReceive);
        TogetherJS.hub.on("togetherjs.hello", annotaldCollabSelectionSync);
        // TODO: the below should be automatic...
        $("#butcollaborate").text("Uncollaborate");
    },
    TogetherJSConfig_on_close = function annotaldCollabClose () {
        $(document).off("set_selection", annotaldCollabSelectionSend);
        // TODO: the below should be automatic...
        $("#butcollaborate").text("Collaborate");
    };
