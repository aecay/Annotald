///<reference path="./../../../types/all.d.ts" />

/* tslint:disable:quotemark */

import dialog = require("./dialog");
import selection = require("./selection");
import metadata = require("./metadata");
import startup = require("./startup");
import globals = require("./global");
import compat = require("./../compat");
var $ = compat.$;
/* tslint:disable:variable-name */
var React = require("react");
/* tslint:enable:variable-name */
var D = React.DOM;

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

export function parseMetadataTypes (node : Element) : MetadataTypeSpecMap {
    var $node = $(node);
    var r : MetadataTypeSpecMap = {
        lemma: { type: MetadataType.TEXT },
        "has_continuation": { type: MetadataType.BOOL }
    };
    $node.children().map(function () : any {
        var c = $(this).children("metadataType");
        if (c.length === 1) {
            var type = c.text();
            if (type === "text") {
                r[this.tagName] = { type: MetadataType.TEXT };
            } else if (type === "boolean") {
                r[this.tagName] = { type: MetadataType.BOOL };
            } else if (type === "choice") {
                var cs = $(this).children("metadataChoice");
                if (cs.length === 0) {
                    throw new Error("Choice metadataType without any choices");
                }
                var cs2 = cs.map(
                    function () : string {
                        return this.textContent;
                    }).get();
                r[this.tagName] = { type: MetadataType.CHOICE,
                                    choices: cs2};
            } else {
                throw new Error("Unknown metadataType: " + type);
            }
        } else if (c.length > 1) {
            throw new Error("Malformed metadataType");
        } else {
            r[this.tagName] = parseMetadataTypes(this);
        }
    });
    return r;
}

var metadataTypeSpec : MetadataTypeSpecMap;

startup.addStartupHook(() : void => {
    var mt = $(globals.format).children("metadataTypes");
    if (mt.length === 1) {
        metadataTypeSpec = parseMetadataTypes(mt.get(0));
    }
});

/* tslint:disable:variable-name */

var MetaChoiceContainer = React.createClass({
    doUpdate: function () : void {
        $(this.props.backing).text($(this.refs.select.getDOMNode()).val());
    },
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
                             React.DOM.select.apply({ ref: "select",
                                                      onChange: this.doUpdate },
                                                    options));
    }
});

var MetaBoolContainer = React.createClass({
    doUpdate: function () : void {
        $(this.props.backing).text(
            $(this.refs.input.getDOMNode()).prop("checked") ? "yes" : "no");
    },
    render: function () : void {
         return React.DOM.div({},
                              this.props.name + ": ",
                              React.DOM.input({
                                  type: "checkbox",
                                  ref: "input",
                                  defaultChecked:
                                  $(this.props.backing).text() === "yes",
                                  onChange: this.doUpdate })
                             );
    }
});

var MetaTextContainer = React.createClass({
    doUpdate: function () : void {
        $(this.props.backing).text($(this.refs.input.getDOMNode()).val());
    },
    render: function () : void {
         return React.DOM.div({},
                              this.props.name + ": ",
                              React.DOM.input({ type: "text",
                                                ref: "input",
                                                onChange: this.doUpdate,
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
                                                  typeSpec: metadataTypeSpec }),
                              mdnode);
    } else if (mnode.length > 1) {
        throw new Error("Too many meta nodes: " + selection.get().outerHTML);
    }
}

export var __test__ : any = {};

if (process.env.ENV === "test") {
    __test__ = {
        parseMetadataTypes: parseMetadataTypes
    };
}
