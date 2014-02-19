///<reference path="./../../../types/all.d.ts" />

import utils = require("./utils");
import globals = require("./global");

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

enum LabelMapActionType {
    Subcategory,
    Metadata
}

interface LabelMapAction {
    type : LabelMapActionType;
    s : string;
}

interface LabelMap {
    defaults : { [key: string] : LabelMapAction };
    byPos : {
        [label: string] : { [key: string] : LabelMapAction }
    };
}

export function setLabelForNode (label : string,
                                 node : Element,
                                 remove? : boolean) : void
{
    pieces = label.split("-");
    var category = pieces[0];
    node.setAttribute("data-category", category);
    var submapping = globals.labelMapping.byPos[category];
    var didSubcategory = false;
    _.map(pieces.slice(1), function (piece : string) : void {
        var action = submapping && submapping[piece];
        if (!action) action = globals.labelMapping.defaults[piece];
        if (!action) return;
        switch (action.type) {
        case LabelMapActionType.Subcategory:
            if (didSubcategory) {
                throw "Found 2 subcategory specifications in mapping!";
            }
            if (remove) {
                node.removeAttribute("data-subcategory");
            } else {
                node.setAttribute("data-subcategory", action.s);
            }
            didSubcategory = true;
            break;
        case LabelMapActionType.Metadata:
            if (remove) {
                utils.removeMetadata(node, s);
            } else {
                utils.setMetadata(node, s, "yes");
            }
        }
    })
}
