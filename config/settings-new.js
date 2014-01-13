// Copyright (c) 2011, 2012 Anton Karl Ingason, Aaron Ecay

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
    b = require("treedrawing/bindings"),
    cm = require("treedrawing/contextmenu"),
    us = require("treedrawing/user-style"),
    c = require("treedrawing/config");


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
c.displayCaseMenu = false; // This feature is inoperative, pending modularization
c.caseTags = ["N","NS","NPR","NPRS",
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
var testValidPhraseLabel = undefined;
var testValidLeafLabel   = undefined;

/*
 * Extensions are treated as not part of the label for various purposes, they
 * are all binary, and they show up in the toggle extension menu.  There are 3
 * classes of extensions: those that apply to leaf nodes, those that apply to
 * clausal nodes (IP and CP), and those that apply to non-leaf, non-clause
 * nodes.
 */
c.extensions        = ["SBJ","RSP","LFD","PRN","SPE","XXX"];
c.clauseExtensions = ["RSP","LFD","SBJ","PRN","SPE","XXX"];
c.leafExtensions   = [];

/*
 * Phrase labels in this list (including the same ones with indices and
 * extensions) get a different background color so that the annotator can
 * see the "floor" of the current clause
 */
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
b.addCommand({ keycode: 65 }, e.leafAfter ); // a
b.addCommand({ keycode: 66 }, e.leafBefore); // b
b.addCommand({ keycode: 69 }, e.setLabel, ["CP-ADV","CP-CMP"]); //e
b.addCommand({ keycode: 88 }, e.makeNode, "XP"); // x
b.addCommand({ keycode: 88, shift: true }, e.setLabel, ["XP"]);
b.addCommand({ keycode: 67 }, e.coIndex); // c
b.addCommand({ keycode: 67, shift: true }, e.toggleCollapsed); // shift + c
b.addCommand({ keycode: 82 }, e.setLabel, ["CP-REL","CP-FRL","CP-CAR",
                                         "CP-CLF"]); // r
b.addCommand({ keycode: 83 }, e.setLabel, ["IP-SUB","IP-MAT","IP-IMP"]); // s
b.addCommand({ keycode: 86 }, e.setLabel, ["IP-SMC","IP-INF",
                                         "IP-INF-PRP"]); // v
b.addCommand({ keycode: 84 }, e.setLabel, ["CP-THT","CP-THT-PRN","CP-DEG",
                                         "CP-QUE"]); // t
b.addCommand({ keycode: 71 }, e.setLabel, ["ADJP","ADJP-SPR","NP-MSR",
                                         "QP"]); // g
b.addCommand({ keycode: 70 }, e.setLabel, ["PP","ADVP","ADVP-TMP","ADVP-LOC",
                                         "ADVP-DIR"]); // f
b.addCommand({ keycode: 50 }, e.setLabel, ["NP","NP-PRN","NP-POS",
                                         "NP-COM"]); // 2
// b.addCommand({ keycode: 50, shift: true }, splitWord); // 2
b.addCommand({ keycode: 52 }, e.toggleExtension, "PRN"); // 4
b.addCommand({ keycode: 53 }, e.toggleExtension, "SPE"); // 5
b.addCommand({ keycode: 81 }, e.setLabel, ["CONJP","ALSO","FP"]); // q
b.addCommand({ keycode: 87 }, e.setLabel, ["NP-SBJ","NP-OB1","NP-OB2",
                                         "NP-PRD"]); // w
b.addCommand({ keycode: 68 }, e.pruneNode); // d
b.addCommand({ keycode: 90 }, e.undo); // z
b.addCommand({ keycode: 76 }, e.editNode); // l
b.addCommand({ keycode: 32 }, e.clearSelection); // spacebar
b.addCommand({ keycode: 192 }, e.toggleLemmata); // `
b.addCommand({ keycode: 76, ctrl: true }, e.displayRename); // ctrl + l

b.addCommand({ keycode: 191 }, e.search); // forward slash





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
