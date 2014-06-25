///<reference path="./../../../types/all.d.ts" />

/* tslint:disable:quotemark */

import dialog = require("./dialog");
import selection = require("./selection");
import metadata = require("./metadata");
import compat = require("./../compat");
var $ = compat.$;
/* tslint:disable:variable-name */
var React = require("react");
/* tslint:enable:variable-name */
var D = React.DOM;

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
        $(selection.get()).prop("data-metadata",
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
        $(selection.get()).prop("data-metadata", JSON.stringify(oldMetadata));
        updateMetadataEditor();
        dialog.hideDialogBox();
    }
    $("#addMetadata").click(addMetadata);
    dialog.setInputFieldEnter($("#metadataNewName"), addMetadata);
}

// TODO: force update on change of backing
// TODO: proptypes
// TODO: events

export enum MetadataType {
    TEXT,
    BOOL,
    CHOICE
}

export interface MetadataTypeSpec {
    type: MetadataType;
    choices?: string[];
};

export interface MetadataTypeSpecMap {
    [key : string] : any;
}

/* tslint:disable:variable-name */

var MetaChoiceContainer = React.createClass({
    render: function () : void {
        var options = this.props.options.map(
            (v : string) : any => {
                var p : any = {value: v};
                if (this.props.backing.textContent === v) {
                    p.selected = true;
                }
                return React.DOM.option(p, v);
            });
        options.shift({});
        return React.DOM.div({},
                             this.props.name + ": ",
                             React.DOM.select.apply(null, options));
    }
});

var MetaBoolContainer = React.createClass({
    render: function () : void {
         return React.DOM.div({},
                              this.props.name + ": ",
                              "yes ",
                              React.DOM.input({type: "radio", value: "yes"}),
                              "no ",
                              React.DOM.input({type: "radio", value: "no"})
                             );
    }
});

var MetaTextContainer = React.createClass({
    render: function () : void {
         return React.DOM.div({},
                              this.props.name + ": ",
                              React.DOM.input({type: "text",
                                               defaultValue:
                                               this.props.backing.textContent})
                             );
    }
});

function isTerminalMetadataNode(e : Element) : boolean {
    var c = e.childNodes;
    return c.length === 1 && c[0].nodeType === 3;
}

function getMdSpec(spec : MetadataTypeSpecMap, name : string)
: MetadataTypeSpec {
    return (spec && spec[name]) || { type : MetadataType.TEXT };
}

function getContainerClass (type : MetadataType) : any {
    if (type === MetadataType.TEXT) {
        return MetaTextContainer;
    } else if (type === MetadataType.BOOL) {
        return MetaBoolContainer;
    } else if (type === MetadataType.CHOICE) {
        return MetaChoiceContainer;
    } else {
        throw new Error("Unknown MetadataType: " + type);
    }
}

var MetaKeysContainer = React.createClass({
    render: function () : void {
        var that = this;
        var children : any[] = $(this.props.backing).children().map(
            function () : any {
                var name = this.getAttribute("data-tag");
                if (isTerminalMetadataNode(this)) {
                    var spec = getMdSpec(that.props.typeSpec, name);
                    var cls = getContainerClass(spec.type);
                    return cls(
                        { backing: this,
                          name: name
                          // TODO: options
                        }
                    );
                } else {
                    return MetaKeysContainer({ backing: this,
                                               typeSpec:
                                               getMdSpec(that.props.typeSpec, name)
                                             });
                }
        }).get();
        var tag = this.props.backing.getAttribute("data-tag");
        if (tag !== "meta") {
            children.unshift(D.br());
            children.unshift(D.b({}, tag));
        }
        children.unshift({});
        return D.div.apply(null, children);
    }
    // TODO: add, del keys
});

export function updateMetadataEditor() : void {
    var mdnode = document.getElementById("metadata");
    if (selection.cardinality() !== 1) {
        React.unmountComponentAtNode(mdnode);
        return;
    }
    var mnode = $(selection.get()).children(".meta");
    if (mnode.length === 1) {
        React.renderComponent(MetaKeysContainer({ backing: mnode.get(0),
                                                  typeSpec: undefined }),
                              mdnode);
    } else if (mnode.length > 1) {
        throw new Error("Too many meta nodes: " + selection.get().outerHTML);
    }
}
