// Copyright (c) 2011, 2012, 2014 Anton Karl Ingason, Aaron Ecay

// This file is part of the Annotald program for annotating
// phrase-structure treebanks in the Penn Treebank style.

// This file is distributed under the terms of the GNU General
// Public License as published by the Free Software Foundation, either
// version 3 of the License, or (at your option) any later version.

// This program is distributed in the hope that it will be useful, but
// WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Lesser
// General Public License for more details.

// You should have received a copy of the GNU Lesser General Public
// License along with this program.  If not, see
// <http://www.gnu.org/licenses/>.

/*global require: false */

var e = require("treedrawing/entry-points"),
    b = e.bindings,
    cm = e.contextmenu,
    us = e.userStyle,
    c = e.config,
    cmds = e.commands,
    A = b.applyArgs;


/*
 * Whether to include detailed information on key and mouse actions in the
 * event log
 */
// TODO: add to user manual
c.logDetail = true;

/*
 * Displays a context menu for setting case extensions according to
 * the IcePaHC annotation scheme.
 *
 * caseTags indicates which tags bear case indicators; casePhrases indicates
 * which phrasal categories case pertains to (though they themselves are not
 * marked)
 */
// TODO: enable
c.displayCaseMenu = false; // This feature is inoperative, pending modularization
// TODO: convert these into sensible defaults, e.g. NS should be N+some metadata
c.caseCategories = ["N","NS","NPR","NPRS",
                    "PRO","D","NUM",
                    "ADJ","ADJR","ADJS",
                    "Q","QR","QS"];
c.casePhrases = ["NP","QP","ADJP"];
c.caseMarkers = ["N", "A", "D", "$"];
/*
 * Which labels are barriers to recursive case assignment.
 */
c.caseBarriers = ["IP","CP","NP"];

/*
 * These two functions should return true if the string argument is a valid
 * label for a branching (-Phrase-) and non-branching (-Leaf-) label, and
 * false otherwise.  The utility function basesAndDashes is provided.  It
 * takes two arguments, a list of base tags and a list of dash tags.  It
 * returns a function suitable for assigning to one of these variables. The
 * recommended way to accomplish this, however, is to use the waxeye parser
 * generator.  Samples and documentation for this method have yet to be
 * written.
 */
// TODO: replacement in new system? just the label -> metadata code plus error
// callback?
var testValidPhraseLabel = undefined;
var testValidLeafLabel   = undefined;

/*
 * Extensions are treated as not part of the label for various purposes, they
 * are all binary, and they show up in the toggle extension menu.  There are 3
 * classes of extensions: those that apply to leaf nodes, those that apply to
 * clausal nodes (IP and CP), and those that apply to non-leaf, non-clause
 * nodes.
 */
// TODO: remove for new format
c.extensions        = ["SBJ","RSP","LFD","PRN","SPE","XXX"];
c.clauseExtensions = ["RSP","LFD","SBJ","PRN","SPE","XXX"];
c.leafExtensions   = [];

/*
 * Phrase labels in this list (including the same ones with indices and
 * extensions) get a different background color so that the annotator can
 * see the "floor" of the current clause
 */
// TODO: new format
c.ipnodes = ["IP-SUB","IP-MAT","IP-IMP","IP-INF","IP-PPL","RRC"];

// Types of comments.
// Comments are nodes of the form (CODE {XXX:words_words_words})
// If "XXX" is in the following list, then when editing the contents of the
// comment with one of the editing functions (TODO: list), a dialog box will
// appear allowing the comment to be edited as text.
c.commentTypes = ["COM", "TODO", "MAN"];

/*
 * Keycode is from onKeyDown event.
 * This can for example be tested here:
 * http://www.asquare.net/javascript/tests/KeyCode.html
 */
b.keyBindings = {
    a: cmds.leafAfter,
    b: cmds.leafBefore,
    e: A(cmds.setLabel, ["CP-ADV","CP-CMP"]),
    x: A(cmds.makeNode, "XP"),
    "shift+x": A(cmds.setLabel, "XP"),
    c: cmds.coIndex,
    "shift+c": cmds.toggleCollapsed,
    r: A(cmds.setLabel, ["CP-REL","CP-FRL","CP-CAR", "CP-CLF"]),
    s: A(cmds.setLabel, ["IP-SUB","IP-MAT","IP-IMP"]),
    v: A(cmds.setLabel, ["IP-SMC","IP-INF", "IP-INF-PRP"]),
    t: A(cmds.setLabel, ["CP-THT","CP-THT-PRN","CP-DEG", "CP-QUE"]),
    g: A(cmds.setLabel, ["ADJP","ADJP-SPR","NP-MSR", "QP"]),
    f: A(cmds.setLabel, ["PP","ADVP","ADVP-TMP","ADVP-LOC", "ADVP-DIR"]),
    "2": A(cmds.setLabel, ["NP","NP-PRN","NP-POS", "NP-COM"]),
    // TODO: replace with toggleMetadata
    "4": A(cmds.toggleExtension, "PRN"),
    "5": A(cmds.toggleExtension, "SPE"),
    q: A(cmds.setLabel, ["CONJP","ALSO","FP"]),
    w: A(cmds.setLabel, ["NP-SBJ","NP-OB1","NP-OB2", "NP-PRD"]),
    d: cmds.pruneNode,
    z: cmds.undo,
    l: cmds.editNode,
    "space": cmds.clearSelection,
    "`": cmds.toggleLemmata,
    "/": cmds.search,
    "@": cmds.splitWord
};

/*
 * Default phrase label suggestions in context menu
 */
c.defaultConMenuGroup = ["VBPI","VBPS","VBDI","VBDS","VBI","VAN","VBN","VB"];

/*
 * Phrase labels that are suggested in context menu when one of the other ones
 * is set
 */
cm.addConMenuGroup( ["IP-SUB","IP-MAT","IP-INF","IP-IMP","CP-QUE","QTP","FRAG"] );
cm.addConMenuGroup( ["ADJP","ADJX","NP-MSR","QP","NP","ADVP","IP-PPL"] );
cm.addConMenuGroup( ["NP-SBJ","NP-OB1","NP-OB2","NP-PRD","NP-POS","NP-PRN",
                     "NP","NX","NP-MSR","NP-TMP","NP-ADV","NP-COM","NP-CMP",
                     "NP-DIR","NP-ADT","NP-VOC","QP"] );
cm.addConMenuGroup( ["PP","ADVP","ADVP-TMP","ADVP-LOC","ADVP-DIR","NP-MSR","NP-ADV"] );
cm.addConMenuGroup( ["VBPI","VBPS","VBDI","VBDS","VBI","VAN","VBN","VB","HV"] );
cm.addConMenuGroup( ["HVPI","HVPS","HVDI","HVDS","HVI","HV"] );
cm.addConMenuGroup( ["RP","P","ADV","ADVR","ADVS","ADJ","ADJR","ADJS","C","CONJ","ALSO"] );
cm.addConMenuGroup( ["WADVP","WNP","WPP","WQP","WADJP"] );
cm.addConMenuGroup( ["CP-THT","CP-QUE","CP-REL","CP-DEG","CP-ADV","CP-CMP"] );


/*
 * Context menu items for "leaf before" shortcuts
 */
cm.addConLeafBefore("NP-SBJ" , "*con*"     );
cm.addConLeafBefore("NP-SBJ" , "*pro*"     );
cm.addConLeafBefore("C"      , "0"         );
cm.addConLeafBefore("CODE"   , "{COM:XXX}" );


// An example of a CSS rule for coloring a syntactic tag.  The styleTag
// function takes care of setting up a (somewhat complex) CSS rule that
// applies the given style to any node that has the given label.  Dash tags
// are accounted for, i.e. NP also matches NP-FOO (but not NPR).  The
// lower-level addStyle() function adds its argument as CSS code to the
// document.
// styleTag("NP", "color: red");

// An example of a CSS rule for coloring a dash tag.  Similarly to the
// styleTag function, styleDashTag takes as an argument the name of a dash tag
// and CSS rule(s) to apply to it.

us.styleDashTag("FLAG", "color: red");

// TODO: set properly
e.globals.labelMapping = {
    defaults: {
        SPE: { directSpeech: "yes"},
        PRN: { parenthetical: "yes" }
    },
    defaultSubcategories: [],
    byLabel: {
        IP: {
            subcategories: ["MAT", "SUB"]
        },
        NP: {
            subcategories: ["SBJ","OB1","OB2"],
            metadataKeys: {
                LFD: { leftDislocated: "yes" },
                RSP: { resumptive: "yes" }
            }
        }
    }
};
