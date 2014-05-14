///<reference path="./../../../types/all.d.ts" />

import _ = require("lodash");

import globals = require("./global");
import metadata = require("./metadata");

export interface MatchSpec {
    category?: string;
    subcategory?: string;
    // TODO: proper type
    metadata?: { [key : string ] : any };
}

export interface LabelMapAction {
    key : string;
    // TODO: proper type
    value : any;
}

export interface LabelMap {
    defaults : { [key: string] : LabelMapAction };
    defaultSubcategories: string[];
    byLabel : {
        [label: string] : {
            subcategories: string[];
            metadataKeys: { [key: string] : LabelMapAction }
        }
    };
}

function isValidSubcategoryForCategory (subcat : string,
                                        cat : string,
                                        mapping : LabelMap)
: boolean {
    return (mapping.defaultSubcategories.indexOf(subcat) >= 0 ||
            mapping.byLabel[cat].subcategories.indexOf(subcat) >= 0);
}

function matchObjects(o1 : { [key : string] : any },
                             o2 : { [key : string] : any }) : boolean
{
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
    var submap = mapping.byLabel[r.category].metadataKeys;
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
                r.metadata[x.key] = x.value;
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
                                 remove? : boolean) : void
{
    var pieces = label.split("-");
    var category = pieces.shift();
    node.setAttribute("data-category", category);
    if (pieces.length > 0 && isValidSubcategoryForCategory(pieces[0],
                                                           category,
                                                           mapping)) {
        if (remove) {
            node.removeAttribute("data-subcategory");
        } else {
            node.setAttribute("data-subcategory", pieces[0]);
        }
        pieces.shift();
    }
    if (pieces.length > 0) {
        var submapping = mapping.byLabel[category].metadataKeys || {};
        _.map(pieces, function (piece : string) : void {
            var action : LabelMapAction = submapping[piece] ||
                mapping.defaults[piece] ||
                { key : piece, value: "yes" };
            if (!action) {
                return;
            }
            if (remove) {
                metadata.removeMetadata(node, action.key, action.value);
            } else {
                metadata.setMetadata(node, action.key, action.value);
            }
        });
    }
}
