///<reference path="./../../../types/all.d.ts" />

/* tslint:disable:quotemark */

import dialog = require("./dialog");
import selection = require("./selection");
import metadata = require("./metadata");
import startup = require("./startup");
import globals = require("./global");
import compat = require("./../compat");
import _ = require("lodash");
var $ = compat.$;
/* tslint:disable:variable-name */
var React = require("react");
/* tslint:enable:variable-name */
var D = React.DOM;

// TODO: force update on change of backing
// TODO: proptypes

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

var RemovableContainerMixin = {
    doRemove: function () : void {
        dialog.confirm("Delete the key " + this.props.name + "?",
                       () : void => {
                           $(this.props.backing).remove();
                           this.props.parent.forceUpdate();
                       });
    },
    handleNameClick: function (e : MouseEvent) : void {
        if (e.button === 2) {
            this.doRemove();
        }
    }
};

var MetaChoiceContainer = React.createClass({
    mixins: [RemovableContainerMixin],
    doUpdate: function () : void {
        $(this.props.backing).text($(this.refs.select.getDOMNode()).val());
    },
    render: function () : void {
        var options = this.props.options.map(
            (v : string) : any => {
                return React.DOM.option({value: v, key: v}, v);
            });
        return D.div({},
                     D.span({ onMouseUp: this.handleNameClick }, this.props.name),
                     ": ",
                     React.DOM.select({ ref: "select",
                                        onChange: this.doUpdate,
                                        defaultValue:
                                        this.props.backing.textContent,
                                        id: this.props.parent.getName() + "-" +
                                        this.props.name
                                      },
                                      options));
    }
});

var MetaBoolContainer = React.createClass({
    mixins: [RemovableContainerMixin],
    doUpdate: function () : void {
        $(this.props.backing).text(
            $(this.refs.input.getDOMNode()).prop("checked") ? "yes" : "no");
    },
    render: function () : void {
        return D.div({},
                     D.span({ onMouseUp: this.handleNameClick }, this.props.name),
                     ": ",
                     React.DOM.input({
                         type: "checkbox",
                         ref: "input",
                         defaultChecked:
                         $(this.props.backing).text() === "yes",
                         onChange: this.doUpdate,
                         id: this.props.parent.getName() + "-" + this.props.name})
                    );
    }
});

var MetaTextContainer = React.createClass({
    mixins: [RemovableContainerMixin],
    doUpdate: function () : void {
        $(this.props.backing).text($(this.refs.input.getDOMNode()).val());
    },
    render: function () : void {
        return D.div({},
                     D.span({ onMouseUp: this.handleNameClick }, this.props.name),
                     ": ",
                     React.DOM.input({ type: "text",
                                       ref: "input",
                                       onChange: this.doUpdate,
                                       defaultValue:
                                       this.props.backing.textContent,
                                       id: this.props.parent.getName() + "-" +
                                       this.props.name })
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

var visibilityMap : any = {};

var MetaKeysContainer = React.createClass({
    mixins: [RemovableContainerMixin],
    getInitialState : function () : any {
        var tag = this.props.backing.getAttribute("data-tag");
        return {
            visible: tag === "meta" || this.props.vm[this.props.name]
        };
    },
    toggleVisible: function () : void {
        this.props.vm[this.props.name] = !this.props.vm[this.props.name];
        this.setState({ visible: this.props.vm[this.props.name] });
    },
    doAddKey: function () : void {
        // TODO: make it possible to add nested metadata
        dialog.prompt("Name of key to add").then((key : string) : void => {
            window.setTimeout(() : void => {
                dialog.prompt("Value for key " + key).then((val: string) : void => {
                                  $(this.props.backing).append(
                                      '<div class="meta" data-tag="' + key + '">' +
                                          val + '</div>');
                                  this.forceUpdate();
                              });
            }, 100);
        });
    },
    getName: function () : string {
        if (this.props.parent) {
            return this.props.parent.getName() + "-" + this.name;
        } else {
            return this.props.name;
        }
    },
    render: function () : void {
        var that = this;
        var children : any[] = [];
        if (this.state.visible) {
            children = $(this.props.backing).children().filter(
                function () : boolean {
                    return ["index", "idxtype"].indexOf(
                        this.getAttribute("data-tag")) === -1;
                }
            ).map(
                function () : any {
                    var name = this.getAttribute("data-tag");
                    if (isTerminalMetadataNode(this)) {
                        var spec = getMdSpec(that.props.typeSpec, name);
                        var cls = getContainerClass(spec.type);
                        var p : { backing: Element;
                                  name: string;
                                  options?: string[];
                                  parent: any;
                                  key: string; } = {
                                      backing: this,
                                      name: name,
                                      parent: that,
                                      key: name
                        };
                        if (spec.type === MetadataType.CHOICE) {
                            p.options = spec.choices;
                        }
                        return cls(p);
                    } else {
                        var vm = that.props.vm[that.props.name];
                        if (_.isUndefined(vm)) {
                            vm = that.props.vm[that.props.name] = {};
                        }
                        return MetaKeysContainer({ backing: this,
                                                   typeSpec:
                                                   getMdSpec(that.props.typeSpec,
                                                             name),
                                                   vm: vm,
                                                   name: name,
                                                   parent: that
                                                 });
                    }
                }).get().sort(function (val1 : any, val2 : any) : number {
                    return val1.props.name < val2.props.name ? -1 : 1;
                });
            children.push(D.div({ onClick: this.doAddKey }, "+"));
        }
        var tag = this.props.backing.getAttribute("data-tag");
        var props : any = {};
        if (tag !== "meta") {
            children = [
                D.span({ onClick: this.toggleVisible, marginRight: 4 },
                       this.state.visible ? "\u25BC" : "\u25B6"),
                D.b({ onMouseUp: this.handleNameClick }, tag),
                D.br()
            ].concat(children);
            props.style = {
                border: "1px solid #2E2E2E",
                padding: 4,
                margin: 2
            };
        }
        return D.div(props, children);
    }
    // TODO: add, del keys
});

export function updateMetadataEditor () : void {
    var mdnode = document.getElementById("metadata");
    if (selection.cardinality() !== 1) {
        React.unmountComponentAtNode(mdnode);
        return;
    }
    var mnode = $(selection.get()).children(".meta");
    if (mnode.length === 0) {
        mnode = $('<div class="meta" data-tag="meta" />');
        $(selection.get()).append(mnode);
    }
    if (mnode.length === 1) {
        React.renderComponent(MetaKeysContainer({ backing: mnode.get(0),
                                                  typeSpec: metadataTypeSpec,
                                                  vm: visibilityMap,
                                                  name: "meta" }),
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
