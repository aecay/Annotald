///<reference path="./../../../types/all.d.ts" />

import _ = require("lodash");

import globals = require("./global");
import metadata = require("./metadata");

import compat = require("./../compat");
var $ = compat.$;

export interface MatchSpec {
    category?: string;
    subcategory?: string;
    // TODO: proper type
    metadata?: { [key : string ] : any };
}

export interface LabelMapAction {
    [key: string] : any
}

export interface LabelMap {
    defaults : { [dashTag: string] : LabelMapAction };
    defaultSubcategories: string[];
    byLabel : {
        [label: string] : {
            subcategories: string[];
            metadataKeys: { [dashTag: string] : LabelMapAction }
        }
    };
}

function getSubcatsForCat (mapping : LabelMap, cat : string) : string[] {
    var x = mapping.byLabel[cat];
    if (x) {
        return x.subcategories;
    } else {
        return [];
    }
}

function getMetadataOpsForCat (mapping : LabelMap, cat : string) : any {
    var x = mapping.byLabel[cat];
    if (x) {
        return x.metadataKeys;
    } else {
        return {};
    }
}

function isValidSubcategoryForCategory (subcat : string,
                                        cat : string,
                                        mapping : LabelMap)
: boolean {
    return (mapping.defaultSubcategories.indexOf(subcat) >= 0 ||
            getSubcatsForCat(mapping, cat).indexOf(subcat) >= 0);
}

function matchObjects(o1 : { [key : string] : any },
                      o2 : { [key : string] : any })
: boolean {
    var ret = true;
    _.forOwn(o1, function (value : any, key : string) : boolean {
        if (!_.has(o2, key)) {
            ret = false;
            return false;
        } else if (_.isObject(value)) {
            if (!matchObjects(value, o2[key])) {
                ret = false;
                return false;
            }
        } else if (!_.isEqual(value, o2[key])) {
            ret = false;
            return false;
        }
        return true;
    });
    return ret;
}

export function nodeMatchesSpec (node : Element, spec : MatchSpec) : boolean {
    var res = true;
    if (spec.category) {
        if (node.getAttribute("data-category") !== spec.category) {
            return false;
        }
    }
    if (spec.subcategory) {
        if (node.getAttribute("data-subcategory") !== spec.subcategory) {
            return false;
        }
    }
    if (spec.metadata) {
        var md = JSON.parse(node.getAttribute("data-metadata"));
        res = _.all(_.map(spec.metadata, function (value : any,
                                                   key : string)
                          : boolean {
                              return matchObjects(spec.metadata, md);
                          }));
    }
    return res;
}

export function nodeMatchesLabel(n : Element,
                                 l : string,
                                 mapping : LabelMap = globals.labelMapping)
: boolean {
    return nodeMatchesSpec(n, labelToMatchSpec(l, mapping));
}

export function labelToMatchSpec (label : string, mapping : LabelMap)
: MatchSpec {
    var pieces = label.split("-");
    var r : MatchSpec = {};
    r.category = pieces.shift();
    var submap = getMetadataOpsForCat(mapping, r.category);
    if (pieces.length > 0 && isValidSubcategoryForCategory(pieces[0],
                                                           r.category,
                                                           mapping)) {
        r.subcategory = pieces.shift();
    }
    if (pieces.length > 0) {
        r.metadata = {};
        _.each(pieces, function (v : string) : void {
            var x = submap[v] || mapping.defaults[v];
            if (x) {
                _.forOwn(x, (val : any, key : string) : void =>
                         r.metadata[key] = val);
            }
        });
    }
    return r;
}

/*
  use the deep-diff package

  make setlabel take two lists: one for nonterminals and one for terminals
*/

export function setLabelForNode (label : string,
                                 node : Element,
                                 mapping : LabelMap = globals.labelMapping,
                                 remove? : boolean,
                                 xml: boolean = false) : void
{
    var pieces = label.split("-");
    var category = pieces.shift();
    var attrPfx = xml ? "" : "data-";
    var mdSet = xml ? metadata.setMetadataXml : metadata.setMetadata;
    var mdRm = xml ? metadata.removeMetadataXml : metadata.removeMetadata;
    node.setAttribute(attrPfx + "category", category);
    if (pieces.length > 0 && isValidSubcategoryForCategory(pieces[0],
                                                           category,
                                                           mapping)) {
        if (remove) {
            node.removeAttribute(attrPfx + "subcategory");
        } else {
            node.setAttribute(attrPfx + "subcategory", pieces[0]);
        }
        pieces.shift();
    }
    if (pieces.length > 0) {
        var submapping = getMetadataOpsForCat(mapping, category);
        _.map(pieces, function (piece : string) : void {
            var action : LabelMapAction = submapping[piece] ||
                mapping.defaults[piece];
            if (!action) {
                action = {};
                action[piece] = "yes";
            }
            if (!action) {
                return;
            }
            if (remove) {
                _.forOwn(action, (val : any, key : string) : void =>
                         mdRm(node, key, val));
            } else {
                _.forOwn(action, (val : any, key : string) : void =>
                         mdSet(node, key, val));
            }
        });
    }
}

export function getLabelForNode (node : Element,
                                 mapping : LabelMap = globals.labelMapping)
: string {
    // Build the label
    var cat = node.getAttribute("data-category");
    // Category
    var label = cat;
    if (node.getAttribute("data-subcategory")) {
        // Subcategory if applicable
        label += "-" + node.getAttribute("data-subcategory");
    }

    // Dash tags pertaining to this category, in order specified in XML
    var m = metadata.getMetadata(node);
    var x = mapping.byLabel[cat];
    if (x && x.metadataKeys) {
        _.each(x.metadataKeys, (v : any, k : string) : void => {
            if (matchObjects(v, m)) {
                label += "-" + k;
            }
        });
    }
    // Global dash tags, in order specified in XML
    if (mapping.defaults) {
        _.each(mapping.defaults, (v : any, k : string) : void => {
            if (matchObjects(v, m)) {
                label += "-" + k;
            }
        });
    }

    // THe index, if any
    var md : any = metadata.getMetadata(node);
    if (!_.isUndefined(md.index)) {
        label += md.idxtype === "gap" ? "=" : "-";
        label += md.index;
    }

    return label;
}

export function hasExtension (node : Element,
                              extension : string,
                              mapping : LabelMap = globals.labelMapping)
: boolean {
    return matchObjects(getActionForDashTag(extension, getCategory(node), mapping),
                        metadata.getMetadata(node));
}

export function toggleExtensionForNode (extension : string,
                                        node : Element,
                                        mapping : LabelMap = globals.labelMapping)
: void {
    var action = getActionForDashTag(extension, getCategory(node), mapping);
    if (hasExtension(node, extension, mapping)) {
        _.forOwn(action, (val : any, key : string) : void => {
            metadata.removeMetadata(node, key, val);
        });
    } else {
        _.forOwn(action, (val : any, key : string) : void => {
            metadata.setMetadata(node, key, val);
        });
    }
}

function getCategory (node : Element) : string {
    return node.getAttribute("data-category");
}

function getActionForDashTag (tag : string,
                              category : string,
                              mapping : LabelMap = globals.labelMapping)
: LabelMapAction {
    var def : { [x : string] : any } = {};
    def[category] = "yes";
    return mapping.byLabel[category].metadataKeys[tag] ||
        mapping.defaults[tag] ||
        def;
}

function nodeToAction (n : JQuery) : any {
    var r = {};
    if (n.children().length === 0) {
        r[n.prop("tagName").toLowerCase()] = n.text();
    } else {
        var m = n.children().map(function () : any {
            return nodeToAction($(this));
        }).get();
        m.unshift({});
        r[n.prop("tagName").toLowerCase()] = _.merge.apply(null, m);
    }
    return r;

}

export function parseFormatSpec (root : Element) : LabelMap {
    var r : LabelMap = {
        defaults: {},
        defaultSubcategories: [],
        byLabel: {}
    };
    var $root = $(root);
    $root.children("dashTags").first().children().each(function () : void {
        var y = $(this);
        var dashTagName = y.prop("tagName");
        var metadata = y.children().first();
        r.defaults[dashTagName] = nodeToAction(metadata);
    });
    $root.children("subcategories").first().children().each(function () : void {
        r.defaultSubcategories.push(this.tagName);
    });
    $root.children("byLabel").first().children().each(function () : void {
        var x = parseFormatSpec(this);
        // TODO: the mismatch here is ugly...
        r.byLabel[this.tagName] = {
            subcategories: x.defaultSubcategories,
            metadataKeys: x.defaults
        };
    });
    return r;
}

/* tslint:disable:variable-name */
export var __test__ : any = {};
/* tslint:enable:variable-name */

if (process.env.ENV === "test") {
    __test__ = {
        nodeToAction: nodeToAction,
        matchObjects: matchObjects
    };
}
