///<reference path="./../../../types/all.d.ts" />

/* tslint:disable:quotemark */

import $ = require("jquery");
import globals = require("./global");
import utils = require("./utils");
import dialog = require("./dialog");

var startnode : Node = globals.startnode;
var endnode : Node = globals.endnode;

/**
 * Convert a JS disctionary to an HTML form.
 *
 * For the metadata editing code.
 * @private
 */
function dictionaryToForm (dict : Object, level? : number) : string {
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
                        4 * level + 'px;"></span>' + k +
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
function formToDictionary (form : JQuery) : Object {
    var d = {},
        dstack = [],
        curlevel = 0,
        namestack = [];
    form.find("tr").each(function () : void {
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

export function saveMetadata () : void {
    if ($("#metadata").html() !== "") {
        $(startnode).prop("data-metadata",
                          JSON.stringify(formToDictionary(
                              $("#metadata"))));
    }
}

function metadataKeyClick(e : Event) : boolean {
    var keyNode = e.target;
    var html = 'Name: <input type="text" ' +
            'id="metadataNewName" value="' + $(keyNode).text() +
            '" /><div id="dialogButtons"><input type="button" value="Save" ' +
        'id="metadataKeySave" /><input type="button" value="Delete" ' +
        'id="metadataKeyDelete" /></div>';
    dialog.showDialogBox("Edit Metadata", html);
    // TODO: make focus go to end, or select whole thing?
    $("#metadataNewName").focus();
    function saveMetadataInner () : void {
        $(keyNode).text($("#metadataNewName").val());
        dialog.hideDialogBox();
        saveMetadata();
    }
    function deleteMetadata() : void {
        $(keyNode).parent().remove();
        dialog.hideDialogBox();
        saveMetadata();
    }
    $("#metadataKeySave").click(saveMetadataInner);
    dialog.setInputFieldEnter($("#metadataNewName"), saveMetadataInner);
    $("#metadataKeyDelete").click(deleteMetadata);
    return false;
}

function addMetadataDialog() : void {
    // TODO: allow specifying value too in initial dialog?
    var html = 'New Name: <input type="text" id="metadataNewName" value="NEW" />' +
            '<div id="dialogButtons"><input type="button" id="addMetadata" ' +
            'value="Add" /></div>';
    dialog.showDialogBox("Add Metatata", html);
    function addMetadata () : void {
        var oldMetadata = formToDictionary($("#metadata"));
        oldMetadata[$("#metadataNewName").val()] = "NEW";
        $(startnode).prop("data-metadata", JSON.stringify(oldMetadata));
        updateMetadataEditor();
        dialog.hideDialogBox();
    }
    $("#addMetadata").click(addMetadata);
    dialog.setInputFieldEnter($("#metadataNewName"), addMetadata);
}

export function updateMetadataEditor() : void {
    if (!startnode || endnode) {
        $("#metadata").html("");
        return;
    }
    var addButtonHtml = '<input type="button" id="addMetadataButton" ' +
            'value="Add" />';
    $("#metadata").html(dictionaryToForm(utils.getMetadata($(startnode))) +
                        addButtonHtml);
    $("#metadata").find(".metadataField").change(saveMetadata).
        focusout(saveMetadata).keydown(function (e : KeyboardEvent) : void {
            if (e.keyCode === 13) {
                $(e.target).blur();
            }
            e.stopPropagation();
            return true;
        });
    $("#metadata").find(".key").click(metadataKeyClick);
    $("#addMetadataButton").click(addMetadataDialog);
}
