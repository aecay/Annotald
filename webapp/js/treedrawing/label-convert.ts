///<reference path="./../../../types/all.d.ts" />

import utils = require("./utils");
import globals = require("./global");
import _ = require("lodash");

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

export function matchMetadataAgainstObject (key : string, value : any,
                                            object : { [key : string] : any }) {
    if (!object[key]) {
        return false;
    }
    if (object[key] instanceof String) {
        return object[key] === value;
    }
    return _.all(_.forOwn(object[key],
                          function (v : any, k : string) : boolean {
                              if (!value[k]) return false;
                              return matchMetadataAgainstObject(k, value[k], v);
                          }));
}

export function nodeMatchesSpec (node : Element, spec : MatchSpec) : boolean {
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
        var res = _.all(_.forOwn(spec.metadata, function (value : any,
                                                          key : string)
                                 : boolean {
                                     return matchMetadataAgainstObject(
                                         key, value, md);
                                 }));
    }
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
        _.each(pieces, function (v : string) {
            var x = submap[v] || mapping.defaults[v];
            if (x) {
                r.metadata[x.key] = x.value;
            }
        });
    }
    return r;
}


/*
idea:
match spec looks like:
{ category: "foo", subcategory: "bar", metadata: { morpho : { case : "acc" } } }

a function transforms strings into match specs

then we toggle through match specs by:
given list as arg to old setLabel
find the first arg that matches
calculate the diff with the next list element
apply those changes

use the deep-diff package

make setlabel take two lists: one for nonterminals and one for terminals
  */



export function setLabelForNode (label : string,
                                 node : Element,
                                 remove? : boolean,
                                 mapping : LabelMap = globals.labelMapping) : void
{
    var pieces = label.split("-");
    var category = pieces.shift();
    node.setAttribute("data-category", category);
    if (pieces.length > 1 && isValidSubcategoryForCategory(pieces[0],
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
        var submapping = mapping.byLabel[category] || {};
        _.map(pieces, function (piece : string) : void {
            var action = submapping[piece] || mapping.defaults[piece];
            if (!action) return;
            if (remove) {
                utils.removeMetadata(node, action.key);
            } else {
                utils.setMetadata(node, action.key, action.value);
            }
        });
    }
}
