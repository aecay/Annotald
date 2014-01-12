/*global require: false, exports: true */

/*jshint quotmark: false */

var $ = require("jquery"),
    globals = require("./global"),
    startnode = globals.startnode,
    endnode = globals.endnode,
    utils = require("./utils"),
    dialog = require("./dialog");

/**
 * Convert a JS disctionary to an HTML form.
 *
 * For the metadata editing code.
 * @private
 */
function dictionaryToForm(dict, level) {
    if (!level) {
        level = 0;
    }
    var res = "";
    if (dict) {
        res = '<table class="metadataTable"><thead><tr><td>Key</td>' +
            '<td>Value</td></tr></thead>';
        for (var k in dict) {
            if (dict.hasOwnProperty(k)) {
                if (typeof dict[k] === "string") {
                    res += '<tr class="strval" data-level="' + level +
                        '"><td class="key">' + '<span style="width:"' +
                        4*level + 'px;"></span>' + k +
                        '</td><td class="val"><input class="metadataField" ' +
                        'type="text" name="' + k + '" value="' + dict[k] +
                        '" /></td></tr>';
                } else if (typeof dict[k] === "object") {
                    res += '<tr class="tabhead"><td colspan=2>' + k +
                        '</td></tr>';
                    res += dictionaryToForm(dict[k], level + 1);
                }
            }
        }
        res += '</table>';
    }
    return res;
}

/**
 * Convert an HTML form into a JS dictionary
 *
 * For the metadata editing code
 * @private
 */
function formToDictionary(form) {
    var d = {},
        dstack = [],
        curlevel = 0,
        namestack = [];
    form.find("tr").each(function() {
        if ($(this).hasClass("strval")) {
            var key = $(this).children(".key").text();
            var val = $(this).find(".val>.metadataField").val();
            d[key] = val;
            if ($(this).prop("data-level") < curlevel) {
                var newDict = dstack.pop();
                var nextName = namestack.pop();
                newDict[nextName] = d;
                d = newDict;
            }
        } else if ($(this).hasClass("tabhead")) {
            namestack.push($(this).text());
            curlevel = $(this).prop("data-level");
            dstack.push(d);
            d = {};
        }
    });
    if (dstack.length > 0) {
        var len = dstack.length;
        for (var i = 0; i < len; i++) {
            var newDict = dstack.pop();
            var nextName = namestack.pop();
            newDict[nextName] = d;
            d = newDict;
        }
    }
    return d;
}

function saveMetadata() {
    if ($("#metadata").html() !== "") {
        $(startnode).prop("data-metadata",
                          JSON.stringify(formToDictionary(
                              $("#metadata"))));
    }
}
exports.saveMetadata = saveMetadata;

function metadataKeyClick(e) {
    var keyNode = e.target;
    var html = 'Name: <input type="text" ' +
            'id="metadataNewName" value="' + $(keyNode).text() +
            '" /><div id="dialogButtons"><input type="button" value="Save" ' +
        'id="metadataKeySave" /><input type="button" value="Delete" ' +
        'id="metadataKeyDelete" /></div>';
    dialog.showDialogBox("Edit Metadata", html);
    // TODO: make focus go to end, or select whole thing?
    $("#metadataNewName").focus();
    function saveMetadataInner() {
        $(keyNode).text($("#metadataNewName").val());
        dialog.hideDialogBox();
        saveMetadata();
    }
    function deleteMetadata() {
        $(keyNode).parent().remove();
        dialog.hideDialogBox();
        saveMetadata();
    }
    $("#metadataKeySave").click(saveMetadataInner);
    dialog.setInputFieldEnter($("#metadataNewName"), saveMetadataInner);
    $("#metadataKeyDelete").click(deleteMetadata);
}

function addMetadataDialog() {
    // TODO: allow specifying value too in initial dialog?
    var html = 'New Name: <input type="text" id="metadataNewName" value="NEW" />' +
            '<div id="dialogButtons"><input type="button" id="addMetadata" ' +
            'value="Add" /></div>';
    dialog.showDialogBox("Add Metatata", html);
    function addMetadata() {
        var oldMetadata = formToDictionary($("#metadata"));
        oldMetadata[$("#metadataNewName").val()] = "NEW";
        $(startnode).prop("data-metadata", JSON.stringify(oldMetadata));
        updateMetadataEditor();
        dialog.hideDialogBox();
    }
    $("#addMetadata").click(addMetadata);
    dialog.setInputFieldEnter($("#metadataNewName"), addMetadata);
}

function updateMetadataEditor() {
    if (!startnode || endnode) {
        $("#metadata").html("");
        return;
    }
    var addButtonHtml = '<input type="button" id="addMetadataButton" ' +
            'value="Add" />';
    $("#metadata").html(dictionaryToForm(utils.getMetadata($(startnode))) +
                        addButtonHtml);
    $("#metadata").find(".metadataField").change(saveMetadata).
        focusout(saveMetadata).keydown(function (e) {
            if (e.keyCode === 13) {
                $(e.target).blur();
            }
            e.stopPropagation();
            return true;
        });
    $("#metadata").find(".key").click(metadataKeyClick);
    $("#addMetadataButton").click(addMetadataDialog);
}
exports.updateMetadateEditor = updateMetadataEditor;
