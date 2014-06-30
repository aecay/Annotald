.. Copyright 2014 Aaron Ecay

.. This work is licensed under a Creative Commons
   Attribution-NonCommercial-NoDerivs 3.0 Unported License
   http://creativecommons.org/licenses/by-nc-nd/3.0/deed.en_US

   License to be changed to something less restrictive once this is
   release-ready (either CC-BY-SA or CC-BY-SA-NC)

.. TODO: document context menu groups better

.. default-domain:: js

.. highlight:: javascript

=======================
 Annotald User’s Guide
=======================

Introduction
------------

This manual is designed to teach users how to use the Annotald program
for annotating parsed corpora according to (a version of) the Penn
treebank standards.  This version of the manual accompanies version
|version| of Annotald.

.. TODO: our labgroup docs/updates (incorp. latter into this doc?)

.. TODO(post-1.0): this paragraph isn’t really applicable yet.

   In that vein, it consists of both documentation relating to the
   configuration and use of Annotald, as well as instruction on the
   application of the Penn treebank standards to corpus data.  For
   simplicity, the annotation examples in this guide will be based on
   modern English.  The principles illustrated should be applicable to
   annotation in all languages, however.

Annotald was originally written as part of the `Icelandic Parsed
Historical Corpus
<http://www.linguist.is/icelandic_treebank/Icelandic_Parsed_Historical_Corpus_%28IcePaHC%29>`_
(IcePaHC) project.  Development of the program has been funded by:

- The Icelandic Research Fund (RANNÍS)
- The US’s National Science Foundation
- The University of Iceland Research Fund
- Research funds at the University of Pennsylvania

Annotald is under active development.  If you would like to be on a
mailing list to receive announcements of new releases, please contact
`Aaron Ecay <mailto:ecay@sas.upenn.edu>`_.

.. eventually: availability of annotation seminars etc.

Getting started
---------------

Annotald is developed and tested using Google’s Chrome browser; it
is not guaranteed to work with other browsers.  In order to use
Annotald, download and install `the latest stable version of chrome
<https://www.google.com/intl/en/chrome/browser/?hl=en&lr=all>`_.

Then you may navigate to `<http://annotald.com/go/>`_ to begin using
Annotald.

Annotald UI and Philosophy
--------------------------

The Annotald user interface (UI) is shown in the following
screenshot:[#ui-scrot]_

.. image:: images/annotald-hello.png
   :alt: The Annotald UI at startup
   :align: center

On the left-hand side of the screen, the following are present, from top
to bottom:

- The control panel.  This contains buttons for functions such as
  saving, undo/redo, and clocking in/out from a timelog file.
- The tools panel.  Empty in this screenshot, this contains advanced
  functionality when enabled, such as external validation.
- The messages pane.  This area displays messages from the
  program to the user.

Various Annotald functions involve showing a dialog box to the user.
For example, the following image demonstrates the message history dialog
(accessed by clicking “Messages” above the message area).  To dismiss a
dialog, press the escape key.  (Different dialogs may also display
buttons allowing you to close them).

.. image:: images/annotald-dialog.png
   :alt: An example of a dialog box in Annotald
   :align: center

The right-hand portion of the screen is devoted to showing the contents
of the file being edited.  The tree structure of the annotation is
represented as a series of concentric boxes.  Clauses are highlighted in
dark pink, in order to make them more salient, and provide an additional visual
reference to the structure of the sentences being edited.  The box which
represents the file itself is dark brown.

Annotald aims to make common tasks in annotation nearly effortless.
Thus, complex behaviors can be executed with a single keystroke – often
without using modifier keys.  Conversely, Annotald tries to prevent
users from doing things that would be deleterious to the project of
efficiently annotating a corpus.  Thus, it is impossible to change the
text of the file itself in Annotald.  It is also difficult to edit
POS tags directly in Annotald’s interface.  Annotald is optimized for
editing a corpus which already contains mostly-accurate POS
annotation and at least some syntactic structure.  Users with corpora
that need extensive POS correction may be better served (at present) by
another tool.

There are three ways of interacting with Annotald’s user

Mouse
~~~~~

It is recommended that Annotald users have a full-sized mouse with at least
two buttons.  Because of Annotald’s heavy reliance on mousing, neither a
laptop trackpad nor a single-button mouse will prove satisfactory from an
ergonomic point of view.

The mouse serves to select nodes in the UI.  Click anywhere in the box
corresponding to a node in order to select it.  The horizontal mouse
motion necessary can be reduced by clicking on the left edge of the
node; the left side of each node’s box is padded in order to facilitate
this.  An example of a selected node is shown here, notice that the
selected node has been highlighted in blue:

.. image:: images/annotald-select.png
   :alt: Selection in the Annotald UI
   :align: center

Up to two nodes may be selected at a time.  If a node is selected,
clicking another node will also highlight that node:

.. image:: images/annotald-select2.png
   :alt: Dual selection in the Annotald UI
   :align: center

Further clicks after two nodes are selected will de-highlight the
previous second selection, and highlight the clicked node.  To clear any
selection in effect, use the space bar.

Selected nodes form the basis for many :ref:`keyboard commands <keycmds>`.
Node selection is also the basis of movement commands, of a certain type.
The mouse is used for movement commands that edit the structure of the
tree.  In order to annotate movement in the sense of linguistic movement
(wh-movement, etc.), see the :func:`leafAfter` and :func:`leafBefore`
functions.

In order to move a selected node, right click on the desired
destination.  Movements must satisfy certain structural conditions
(e.g. a node cannot be moved into its own daughter) as well as extrinsic
conditions (no movement operation may change the text of the sentence,
e.g. by reordering two words).  Assuming these conditions are met, the
movement operation will take place.  Right clicking with two selected
nodes will move those nodes, as well as any intervening material, to the
desired destination.  The two selected nodes must be sisters of each
other.

.. note::

   Moving an empty category (for example a trace) behaves interestingly,
   since it is not treated as part of the file’s text by Annotald.  This
   allows some interesting and confusing movement possibilities.  Thus,
   moving empty categories (traces beginning with ``*``, empty nodes which
   are ``0``, and ``CODE`` nodes) by default is not allowed.  However,
   moving a non-terminal dominating only such a node(s) is.  So if you
   need to move an empty node in a pinch, just create an XP dominating it,
   do your movement operation, and delete the XP.  Do not be upset though
   if this procedure results in interesting behavior (you can always use
   undo to get back to a sensible structure).

Control-clicking on a node will create and select a new XP dominating
that node.

.. TODO(post-1.0) mouse wheel...document, or remove the code

Context menu
~~~~~~~~~~~~

Right-clicking a node when no selection is present will summon the
context menu, which is illustrated here:

.. image:: images/annotald-context.png
   :alt: The Annotald context menu
   :align: center

The context menu has three columns.  The first has suggested label
changes for the node; clicking any of these will change the node’s label
to the chosen option.  The second contains options for adding a sister
before the node; clicking any of these will insert a node with the given
label and text.  The third column contains options for toggling certain
dash tags.

.. TODO(post-1.0) split context menu dash tags from all dash tags in config file

The context menu can be dismissed by left-clicking outside of it.

Keyboard
~~~~~~~~

Annotald operations other than movement are controlled by the keyboard.
Annotald users should keep their right hand on the mouse at all times;
thus, only keys on the left hand side of the keyboard are used as key
shortcuts (with a small number of exceptions for commands which require
full keyboard use). [#kbd]_

Generally speaking, Annotald key commands perform annotation operations
related to a single goal.  One key, for example, toggles between the
tags for different kinds of argument NPs.  For more on :ref:`the default
keybindings <keycmds>`, including their organizing principles, or on
:ref:`customizing the key commands to fit your annotation needs
<customkeys>`, see the linked sections.

Customization
-------------

Settings files
~~~~~~~~~~~~~~

The Annotald settings file is written in Javascript, and contains the
bulk of Annotald’s user interface settings.  A basic version of this
files is included in Annotald by default.

.. TODO document config editor

.. TODO document corpus spec file

.. _jssettings:

Javascript customization options
++++++++++++++++++++++++++++++++

In this section, the options in the settings file will be discussed.
All the options are accessed by properties of a ``config`` object,
which is a property of the global ``entryPoints`` object.

..
   TODO discussion assumes familiarity with penn treebank conventions,
   include note to read intro to annotation section first if reader is
   not familiar

..
   TODO bring back
   .. _logdetail:
   ``logDetail``
       This variable should be a Boolean value (``true`` or ``false``).  It
       controls the operation of the <<timelog,time logging function>>.

.. attribute:: config.displayCaseMenu

   Whether or not to display options for changing the case of items in the
   context menu.  See the discussion of this feature :ref:`below <casemenu>`.

.. attribute:: config.caseTags

   A list of the labels which can receive a tag indicating their case.
   Generally speaking, these will be leaf nodes.  Although an entire NP
   (for example) might be said to have case, the only surface reflexes
   of case are the marking of individual words.  Furthermore, within a
   single NP it is possible for some constituents to not express the
   phrase’s features. [#casetags]_

   Therefore, the minimal annotation that captures the linguistic facts
   places case on the leaf nodes; phrasal case can be calculated based on
   that information.

   ..
      TODO(post-1.0): this broader philosophical point needs to be explicated
      elsewhere, like in an annotation philosophy section.

   However, Annotald provides functions to make this less tedious – to
   allow the annotator to mark a whole NP for case, and have that
   information updated on all the relevant subconstituents of that NP.

.. attribute:: config.casePhrases

   A list of phrasal categories that bear case.  These will provide an
   option in the context menu to set their case (which actually sets
   the case of their subconstituents).

.. attribute:: config.caseMarkers

   A list of case markers.  Each of these is a dash tag (given in the
   Javascript file without surrounding dashes) that may be attachedto a
   member of ``caseTags`` to indicate its case.

.. attribute:: config.caseBarriers

   A list of phrases which should form barriers to recursive case
   assignment.  When case is assigned to an NP, Annotald looks
   (recursively) for all its daughters which are case-marker-bearing,
   and changes their case.  But, this process should not recurse into
   e.g. a relative clause, or a genitive possessor.  Thus, any node in
   this list will block further case-setting traversal.

   .. note::

      The variables ``caseTags``, ``casePhrases``, and ``caseBarriers``
      cannot contain dashes; they must be genuine top-level category
      labels.

..
   TODO
   ``testValidPhraseLabel`` / ``testValidLeafLabel``
      See the discussion of these options <<tagset-validate,below>>

.. attribute:: config.extensions

   Specify the list and order of dash tags available in the corpus.
   There are three variants of this variable:

   - ``leaf_extensions``: Dash tags applicable to leaf (terminal) nodes
   - ``clause_extensions``: Dash tags applicable to clausal nodes (of
     category CP or IP)
   - ``extensions``: Dash tags applicable to non-clausal non-leaf nodes

   Not every dash tag needs to appear in this list, only those which
   need to be toggled on and off in a binary fashion.  Thus, for
   example, the dash tag ``OB1`` (for direct objects) is never toggled
   in a binary fashion, but rather as part of a cycle that includes
   setting the category to ``NP`` and moving through ``NP-SBJ``,
   ``NP-OB2``, etc.  Thus, it need not appear in this list.  However,
   the ``SPE`` dash tag (for reported speech) is toggled on and off –
   changing an ``IP-XXX`` to ``IP-XXX-SPE``, and potentially back to
   ``IP-XXX``.

   ..
      TODO(post-1.0): this is a bad explanation.  Maybe require to list
      all dash tags?  but that gets tedious.

.. attribute:: config.ipnodes

   A list of categories which are clauses.  These are highlighted (with
   a tan shade) to make it clear where the “floor” of a clause is, for
   the purpose of rearranging nodes in the user interface.

.. attribute:: config.commentTypes

   Types of comments.  Comments are nodes of the form ``(CODE
   {XXX:words_words_words})`` For every value of “XXX” is in this list,
   when editing the contents of the comment with :func:`the editing
   function <editNode>`, a dialog box will appear allowing the comment
   to be edited as text, instead of the default editing interface.

.. attribute:: config.customCommands

   A Javascript function containing code to configure
   the keybindings.  This should be a series of calls to
   :func:`addCommand`.

.. attribute:: config.defaultConMenuGroup

   The label suggestions to display in the context (right-click) menu,
   when no suggestion can be deduced from the already-present label.

.. attribute:: config.customConMenuGroups

   A Javascript function to configure the context menu suggestions.
   This should be a series of calls to :func:`addConMenuGroup`.

.. attribute:: config.customConLeafBefore

   A Javascript function to configure the new node options in the context
   menu.  This should be a series of calls to :func:`addConLeafBefore`.

Color schemes
`````````````

In the javascript settings file, you may also place calls to
:func:`styleTag` and :func:`styleDashTag`.  These allow you to specify
alternate colors for certain nodes in the corpus.  As their names
suggest, ``styleTag`` operates on category-level tags, whereas
``styleDashTag`` operates on dash tags.  The first argument of the
function is the tag to apply a style to.  The second is a sequence of
`CSS rules
<https://developer.mozilla.org/en-US/docs/CSS/CSS_Reference>`_.

A full explanation of CSS is beyond the scope of the present document.
Suffice it to say that CSS consists of a sequence of rules of the form
``key: value;``.  Two keys relevant for present purposes are ``color``
and ``background-color``, which set the text and backgroudn color,
respectively.  The ``value`` for the color can be a color name from
`this list <https://developer.mozilla.org/en-US/docs/CSS/color_value>`_,
or a specification of the form ``#RRGGBB``.  ``RR`` here represents a
2-digit hexadecimal (i.e. base 16) number giving the intensity of the
red component of the color; ``GG`` and ``BB`` give green and blue
intensities respectively.  The following Javascript will, when placed in
the Javascript settings file, give all verbal tags a green background,
and make all ``-SBJ`` elements appear in red text:

..
   TODO: make sure this is accurate to the new style

::

    styleDashTag("SBJ", "color:red;");

    _.each(["BE","DO","HV","VB"], function (tag) {
        styleTag(tag,       "background-color:green;");
        styleTag(tag + "D", "background-color:green;");
        styleTag(tag + "P", "background-color:green;");
    })

Note the use of a looping construct to decrease the amount of
boilerplate needed when styling all the forms of the verbal tag.  The
results of inserting this snippet in a settings file are shown here:

.. image:: images/annotald-colors.png
   :alt: A custom stylesheet in Annotald
   :align: center

..
    TODO: How to get this in the new system

    Users who know how to write their own CSS rules may do so using the
    <<colorcss,`colorCSS`>> functionality.  Annotald maintains the label of
    a node as part of the CSS class attribute.  You will probably need to
    write fairly complex selectors for this; see the source for the
    ``style(Dash)Tag`` functions for inspiration.

.. _keycmds:

Default keybindings
+++++++++++++++++++

The Annotald keybindings provided by default are adapted from those
used by the IcePaHC project.  It is highly recommended that users edit
these defaults to fit the needs of their corpus.  The procedure to do
so is described in the following section.  The default keybindings are
as follows (from left to right and top to bottom of a US keyboard
layout):[#bindings]_

Backquote (`)
    Toggle the display of lemmata on or off

1
    Unbound

2
    Cycle between tags for non-argument NPs

@ (Shift-2)
    :ref:`split a word <splitWord>`

3
    Unbound

4
    Toggle the ``-PRN`` dash tag (parentheticals)

5
    Toggle the ``-SPE`` dash tag (direct speech)

Q
    Cycle between tags for miscellaneous phrase types

W
    Cycle between tags for argumental NPs

E
    Cycle between tags for miscellaneous CPs

R
    Cycle between tags for relative clauses

T
    Cycle between tags for that-clauses and other types of CP

A
    Add a leaf after the selected node

S
    Cycle between tags for different types of sentential IP

D
    Delete a node

F
    Cycle between tags for PPs and ADVPs

G
    Cycle between tags for ADJPs and QPs

Z
    Undo

X
    Create a new node (labeled XP)

C
    Coindex nodes

Shift + C
    Toggle :ref:`collapsing <collapsing-nodes>` of a node

V
    Cycle between tags for non-sentential IPs

Spacebar
    Clear the selection

L
    Edit the Label and/or text of a node

Shift + L
    The same (included as an example of a keybinding with modifier)

Forward slash (/)
    :ref:`Search <searching>`


.. _customkeys:

Custom keybindings
++++++++++++++++++

It is virtually certain that users will want to adapt the default key
bindings, to adapt the tags used and the most common use patterns of the
annotators.  It is possible to merely change the specific tags used
while maintaining the default conceptual categories (argumental NP,
non-sentential IP, etc.); it is also possible to come up with an
entirely new scheme.  The default bindings do not use the shift or
control modifiers, which opens up a large space of additional keys for
user customization.

..
   TODO: no longer accurate!

The keybindings of Annotald are customized by placing calls to the
``addCommand`` function inside the ``customCommands`` block.  This
function has 2 required arguments; any further arguments are determined
by the command being bound.  The first argument to the function should
be a Javascript dictionary (also known as an object).  This has the
format ``{key: value, key2: value2}``.  The following keys are recognized:

- ``keycode`` the numeric Javascript keycode of the key you wish to
  bind.  You can navigate to FOO to determine interactively the code for
  any key on your keyboard.  Be sure to use the “keypress” code, not the
  “keydown” or “keyup” ones.
- ``ctrl`` the value ``true`` if this binding is for a shortcut with
  the control key pressed.  Ergonomically, it is much easier to actuate
  such shortcuts if you remap the “Caps Lock” key on your keyboard to
  control, so that it can be pressed with the pinky without needing to
  reach very far.  A panoply of methods to do so are presented at `this
  website <http://emacswiki.org/emacs/MovingTheCtrlKey>`_.
- ``shift`` the value true if this binding is for a shortcut with the
  shift key pressed.

The ``ctrl`` and ``shift`` options are mutually exclusive.

The second argument to the ``addCommand`` function is the name of the
function which the key will be bound to.  Any further arguments will be
passed to the function given.  A list of functions provided by Annotald
follows:

.. function:: clearSelection()

   Remove any selected node(s).  No arguments.

.. function:: coIndex()

   Various effects related to the numeric suffixes that
   indicate movement/coreference/etc. chains:

   - If called with only one node selected: remove this node’s numeric
     index.
   - If called with two nodes selected, only one of which has an index:
     add an index matching the indexed node to the non-indexed node.
   - If called with two nodes selected, neither of which has an index: add
     matching indices to both nodes.
   - If called with two nodes selected whose indices match: cycle through
     different index types.  The cycle is: regular indices (both indices
     appended with `-`) -> gapping (first index appended with `=`) ->
     backwards gaping (second index appended with `=`) -> double gapping
     (both indices appended with `=`) -> remove indices.

   No arguments.

.. function:: editNode()

   Edit the text of the currently selected node.  If this is a
   non-terminal, edit its label.  If this is a terminal, allow editing
   its label, lemma (if present) and text (iff the text is an “empty
   element” – trace, comment, etc.)  This function handles :data:`comment
   nodes <commentTypes>` specially, as shown below.

   No arguments.

   .. image:: images/annotald-comment-editor.png
      :alt: The Annotald comment editor
      :align: center

.. function:: leafAfter()

   Create a leaf node after the (first-)selected node.  A heuristic
   is used to determine the type of node to create.  If only one node
   is selected, the default is to create an empty conjoined subject
   (i.e. ``(NP-SBJ *con*)``) If there are two nodes selected, the
   second-selected node determines the type of leaf to make.  If this
   node is:

   - a wh-phrase (label begins with ``W``), a wh-trace (``*T*``) is created
   - a clitic (label contains the dash tag ``CL``), a clitic trace
     (``*CL*``) is created
   - otherwise, an extraposition trace (``*ICH*``) is created

   The label of the created node in these cases is determined by the label
   of the second-selected node.  Generally, the label of that node is
   copied, except:

   - in the case of a wh-trace, the leading ``W`` is stripped (so the trace
     of a ``WNP`` is an ``NP``, etc.)
   - in the case of a clitic trace, the ``CL`` dash tag is stripped and ``PRO``
     is transformed to ``NP`` (so the trace of ``PRO-CL`` is an ``NP``, and the trace
     of ``ADVP-CL`` is ``ADVP``).

   Additionally, the trace and its antecedent (the second-selected node)
   are coindexed.

   No arguments.

.. function:: leafBefore()

   Functions like ``leafAfter`` described above, with the difference
   that the new node is created before rather than after the selection.

.. function:: makeNode()

   Create a new node dominating the selected node, or the span between
   the two selected nodes (inclusive).  This function takes an optional
   argument specifying the label of the node to create; if not present,
   the label of the new node will be “XP”.  One optional argument.

.. function:: pruneNode()

   Delete the selected node.  If a non-terminal node is selected, the
   operation always succeeds, and the daughters of the deleted node
   become daughters of the deleted node’s parent.  If a terminal node is
   selected, the operation can succeed only if the node is :ref:`empty
   of textual content <emptyelements>`.

   No arguments.

.. function:: setLabel(labels)

   Set the label of the selected node.  The argument must be a list of
   labels.  If the node’s current label is not present in the list, it is
   set to the first entry in the list.  Otherwise, it is set to the node
   immediately following its current label in the list (wrapping around
   at the end of the list).  To illustrate, if the “f” key is bound to
   ``setLabel`` with an argument of ``["FOO","BAR"]``, selecting a node
   with label “QUUX” and pressing the “f” key sequentially will yield:

   1. the label being set to ``FOO`` (since “QUUX” is not in the provided
      list)
   2. the label being set to ``BAR`` (since “BAR” follows “FOO” in the
      list)
   3. the label being set to ``FOO`` (since “BAR” is at the end of the
      list, wrap to the beginning)
   4. etc.

   One argument.

.. _splitWord:
.. function:: splitWord()

   Split a word (for example, to break up a contraction).  Annotald will
   display a dialog box with the text of the selected leaf.  You should
   enter an “@” (at-sign) at the location where the words should be
   split.  Annotald will then create two leaves, one containing the text
   to the left of the “@” and one the text to the right.  Annotald adds
   ``@`` to the beginning or end of the resulting leaves, to indicate
   that a splitting operation has taken place.

.. function:: toggleExtension()

   Toggle a dash tag on the selected node.  If the (first) argument
   exists as a dash tag on the node, remove it.  Otherwise, add it.
   The optional second argument gives a list of extensions in the
   order they should appear from the base category out; if not given,
   it is filled from one of :attr:`the extensions-family variables
   <config.extensions>` based on a heuristic as to the type of node
   which is selected.  One mandatory and one optional argument.

.. function:: toggleLemmata()

   Toggle whether lemmata are shown or hidden in the UI.  No arguments.

.. function:: undo()

   Undo the most recent editing operations.  No arguments.

.. function:: redo()

   Redo after undoing something.  No arguments.

Additional features
-------------------

This section addresses Annotald features that, while not necessary for
annotation, can be convenient in certain circumstances.  Generally
speaking, the features in this section do not require any programming
in order to be useful.  Features which do require programming are
discussed in the :ref:`next section <advanced-features>`.

..
   .. _limiteddisplay:

   Limited display
   ~~~~~~~~~~~~~~~
   Annotald supports showing only a limited number of trees at a time in
   the browser interface.  Some people find that annotating in this manner
   feels more natural.  In order to activate this feature, pass the ``-n``
   command line option to Annotald, followed by a number indicating how
   many trees to show at a time.  As a shortcut for ``-n 1``, you can also
   use ``-1`` (in both cases, the last character is the numeral one).

   When this mode is active, Annotald will have a “previous tree,” “next
   tree,” and “goto tree” button; the latter of which operates based on the
   index shown in the left-hand menu.  This appears as in the following
   screenshot:footnote:[The screenshot is somewhat cramped, owing to the
   artificially small size of the window.  When working with the interface
   at full-screen size, the interface will be less crowded.]

   image::images/annotald-one-tree.png["One-tree mode in Annotald",align="center"]

..
   [[timelog]]
   === Event log

   Annotald supports keeping a log of actions that you take in the program.
   This log is stored in a non-user-readable file called
   `annotaldLog.shelve` in the directory from which Annotald is
   invoked.footnote:[This file is in the format used by the `shelve` Python
   library.  Interested users may consult
   http://docs.python.org/library/shelve.html[the module’s documentation]
   and Annotald’s source code if they desire to create custom code to
   analyze the log.]  There are three levels of logging possible:

   // TODO(post-1.0): ideally this table would be centered, but adoc ->
   // docbook doesn’t center things

   [options="header",cols="s,2*1^"]
   |====
   | Type                   | <<cmdline-q,Command line flag>> | <<logdetail,`logDetail`>>
   | no logging             | `-q`                            | N/A
   | major event logging    | none                            | `false`
   | full logging           | none                            | `true`
   |====

   The “major event logging” setting records when the program is opened and
   closed, as well as when the file is validated or saved.  That is, it
   records events visible to the Annotald server.  It does not record any
   actions taken in the browser.  Full logging, on the other hand, records
   clicks.

   Each event has associated with it a timestamp, which is recorded as
   seconds since the https://en.wikipedia.org/wiki/Unix_time[Unix epoch].
   Currently, the only way to analyze this data is by <<csv-log,converting
   it to CSV format>> and importing it into another analysis program such
   as http://www.r-project.org/[R].  In the future, Annotald will offer
   built-in ways of generating reports from this data, such as how much
   annotation time has been spent on each file, or (with full logging
   enabled) which keys are most often pressed.

.. _casemenu:

Case menu
~~~~~~~~~

Annotald includes support for manipulating case marking information in
corpora which store that information in a supported format.  In order to
be supported, the case must:[#case-differences]_

- be stored as dash tags,
- at the word level,
- without any unmarked default categories.

Then, :attr:`some options <config.displayCaseMenu>` need to be set in the configuration
file.  Once this is done, the context menu will contain options for
setting case:

.. image:: images/case-menu.png
   :alt: Annotald context menu with case-setting options
   :align: center

Invoking the context menu on an individual case-bearing node (one of
:attr:`config.caseTags`) will allow that node’s case to be changed
individually.  Invoking it on a case-bearing phrase (one of
:attr:`config.casePhrases`) will change the case of all that node’s
case-bearing daughters, without recursing too deeply.

.. _searching:

Searching
~~~~~~~~~

Annotald has a structural search engine built in.  While it cannot
replicate the flexibility or (perhaps especially) speed of a dedicated
search program such as `CorpusSearch
<http://corpussearch.sourceforge.net/>`_, it is useful to be able to
search within the Annotald interface itself.  The search dialog is
accessed by clicking the “Search” button in the Tools menu, or by
pressing the forward slash (``/``) key.  Within the dialog box, you will
construct a visual representation of your query, similar to the
representation of trees in the Annotald interface.

The simplest query tree contains only one leaf node.  The leaf has a
text box, into which the search string can be entered.  The string is
interpreted as a case-insensitive Javascript regular expression.  The
Javascript regular expression format is very similar to that used by
many programming languages.  A full description of the format is outside
the scope of this document, but is available via `this reference manual
<https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/RegExp>`_.
The leaf also has a drop-down box, which indicates whether the search
string is to match against the node labels, the text of the corpus, or
the lemmata.  The search string is additionally left-anchored – that is,
the beginning of the regular expression is constrained to match the
beginning of a node label or word.  Pressing the “Search” button will
execute the search.  Matches will be highlighted with a yellow box, and
the document will be scrolled to display the next match.  A very simple
query and its result is illustrated in the following screenshots:

.. image:: images/annotald-search-simple.png
   :alt: A simple Annotald search
   :align: center

.. image:: images/annotald-search-simple-result.png
   :alt: Results of a simple Annotald search
   :align: center

Once the search has completed, two buttons will appear below the “Search”
button.  The first of these scrolls the document down to display the next
match.  The second removes the highlighting from search matches.

In addition to the search node where text can be entered, there is a
node consisting only of a plus sign (“+”).  Clicking this node adds a
sister to the search node.  Search nodes which are sisters are
interpreted as the (unordered) sisterhood relation.  An example of such
a search is given in the following two screenshots:

.. image:: images/annotald-search-sister.png
   :alt: A sisterhood Annotald search
   :align: center

.. image:: images/annotald-search-sister-result.png
   :alt: Results of a sisterhood Annotald search
   :align: center

Each search node has some buttons in the upper-right hand corner.  From
left to right, these are:

..
   TODO: add screen shot examples to all of these

Or (vertical bar)
    This creates an “OR” node as the parent of the node from which it is
    clicked.  The daughters of an “OR” node are interpreted disjunctively,
    instead of conjunctively (the default).  An example of such a search
    is shown in the following screenshots:[#search-or]_

    .. image:: images/annotald-search-or.png
       :alt: A disjunctive Annotald search
       :align: center

    .. image:: images/annotald-search-or-result.png
       :alt: Results of a disjunctive Annotald search
       :align: center

Deep (“D”)
    This creates a deep search node as a daughter of the node from
    which it is clicked.  By default, child search nodes require direct
    daughterhood.  The children of deep nodes, in contrast, can match
    at any depth.

Precedes (“>”)
    This creates a precedes node as a sister of the node from which it
    is clicked.  By default, as mentioned above (and illustrated in
    the screenshots), the sisterhood relation among search nodes in
    interpreted without regard to directionality.  Precedes nodes, on
    the other hand, impose a precedence relation on their daughter
    (which is not in fact interpreted as a daughter, but rather as a
    sister, of the original node.)

Remove (“-”)
    This removes the node from which it is clicked.  Any daughters of
    this node are promoted to the node’s parent; if the node has no
    daughters it simply disappears.

Add daughter (“+”)
    This adds a daughter search node to the node from which it is
    clicked.  The defaultinterpretation is direct daughterhood, which
    can be changed by using a deep node, as already mentioned.

..
   TODO(dev): allow drag and drop of nodes?  or buttons to move them?

.. _collapsing-nodes:

Collapsing nodes
~~~~~~~~~~~~~~~~

The hierarchy of a node may be collapsed, for example to facilitate the
editing of the clause-level structure in the presence of large amounts
of structure inside NPs.  When collapsed, a node’s text (including
traces and empty categories) is displayed in the node, separated by
spaces.  The syntactic labels inside the node are not displayed.  The
usual blue and grey colors of the node’s border are replaced by purple,
to indicate that collapsing is in effect.

..
   TODO: screenshot

.. _advanced-features:

Advanced features
-----------------

In this section, some advanced features of Annotald are described.
These are not required to use Annotald (and in fact are deactivated by
default).  However, for proficient users, their use may make possible
grater annotation efficiency and accuracy.  Generally speaking, all
features in this section require some faculty with programming, in the
broad sense of using an abstract language to give instructions to a
computer.

..
   [[tagset-validate]]
   === Tagset validation

   // TODO(dev): make sure that annotald uses this info everywhere it can.

   By default, Annotald does not contain a mechanism to ensure that tags
   created through editing conform to any sort of schema.  At the same
   time, there are various parts of Annotald’s code that would benefit from
   knowing whether a node corresponds to a leaf or not, which is not always
   a purely structural decision (for example, a node of the form =(NP-SBJ
   \*pro*)= is structurally a leaf, but in fact corresponds to a phrasal
   node, an NP).  Supplying this information to Annotald improves its
   functioning, as well as preventing nonsense tags from being added to the
   corpus during editing.

   You can do this however you like – the only requirement that Annotald
   imposes is that you assign to the configuration variables `testValidLeafLabel`
   and `testValidPhraseLabel` Javascript functions that return true iff its
   argument is a valid label for a leaf node or phrase node
   (respectively).  One useful way of doing this is described below.

   It is possible to write a grammar to validate tags.  Just as the grammar
   of a natrual language accepts only those sentences which are well-formed
   in that language, this grammar should accept only the tags which are
   valid in a particular corpus.  In particular, this manual will describe
   how to use the http://waxeye.org/[Waxeye Parser Generator] to do so.  In
   addition to being Free Software, this program uses a relatively
   intuitive notation for its grammars.  Additionally, it can generate
   grammars not only in Javascript, but also in Python and several other
   computer languages.  This allows the same grammar specification to be
   used in Annotald as well as in a validation script for the corpus.

   Grammars written in waxeys consist of a series of rules.  The first rule
   in the file constitutes the grammar – it must match.  A rule has the
   form `name <- content`.  The name of a rule can consist of letters,
   numbers, and underscores.  The content of the rule can be as follows:

   - `'string'` matches string in the input, literally
   - the name of another rule forces that rule to match
   - `(...)` is a grouping construct
   - `A B` matches A followed by B
   - `A | B` matches either A or B
   - `?A` matches maybe A – that is, if A matches, the parser’s input
     advances over it, but if A does not match, the parser does not fail.
   - `*A` matches 0 or more A
   - `+A` matches 1 or more A

   Comments are enclosed in `/* ... */`.

   Using these rules, it is possible to build up a grammar.  As an
   illustration, here is a grammar that matches
   http://www.ling.upenn.edu/histcorpora/annotation/labels.htm#pos_tags[the
   tagset from the PPCEME] (without, for simplicity, the numbered word splitting).

   // TODO: test this

   ----------
   word_tag <-
   /* <1> */
    ( verbal | nominal | punct | other_word | fn_cat )

   nominal <-
   /*       <2>      <3> */
    ('NUM' ?'$') | ('N' ?'PR' ?'S' ?'$') | ('ADJ' ?('R' | 'S')) | 'D' |
    ('PRO' ?'$') | ('Q' ?('R' | 'S' | '$'))

   verbal <-
    verb | verb_modifier

   verb <-
   /* <4> */
    (('DO' | 'BE' | 'HV' | 'VB') ?('D' | 'P' | 'N' | 'I')) |
    (('D' | 'B' | 'H' | 'V') 'A' ('G' | 'N')) |
    ('MD' ?'0')

   verb_modifier <-
    ('ADV' ?('R' | 'S')) | 'NEG'

   punct <-
   /* <5> */
    '\'' | '"' |',' | '.' | '`'

   fn_cat <-
    'C' | 'CONJ' | 'P' | ('W' ('ADV' | 'D' | ('PRO' ?'$'))) |
    'INTJ' | 'ALSO' | 'ELSE' | 'EX' | 'FP' | 'RP' | 'LB' | 'LS' |
    'MAN' | 'ONE' | ('OTHER' ?'S' ?'$') | 'SUCH' | 'TO' | 'WARD'

   other_word <-
    'CODE' | 'FW' | 'X' | 'FP' | 'META'
   ----------

   <1> For simplicity, the first rule is divided into a disjunction of
   different sub-rules.

   <2> This is a very simple example of a rule – the =NUM= tag may be
   followed by an optional =$=, indicating that it is possessive

   <3> A more complicated rule.  A noun =N= may be proper =PR=, plural =S=,
   and/or possessive =$=.  Any subest of these modifiers may appear.

   <4> The most complicated rule in this grammar.  A verbal tag consists of
   an indicator of the verb’s lexical identity (_do_, _be_, _have_, or
   other), followed by an indicator of its form.  Present =P=, past =D=,
   past participle =N=, and imperative =I= follow a two-letter verb code,
   giving rise to forms like =DOD=, =BEP=, etc.  Present participle =G= and
   passive participle =N= follow a one-letter code followed by =A=, giving
   rise to =VAN=, =HAG=, etc.

   <5> Because `'` is the quote character, to obtain a literal quote
   character it must be backslash-escaped.

   // TODO: num before n
   // TODO: matching dashes in phrasal rules

   [[externalvalidation]]
   === External validation

   Annotald includes a feature that allows the user to interactively submit
   the contents of a file to a separate program, and receive feedback from
   that program.  This system is (intentionally) very powerful – the
   external program can be any Python function,footnote:[Which in turn may
   invoke any program on the user’s computer] and the feedback comes in the
   form of that function modifying the file contents; these modified file
   contents replace the original file in the Annotald interface.  It is
   hoped that this flexibility will facilitate a wide variety of automated
   workflows.

   NOTE: This feature presently causes all undo history to be erased when
   the file is sent for validation.
   // TODO(dev): we could instead record the validation as a single undo
   // step.  Drawback: undoing past the validate will erase the validation
   // also.  Which is worse?

   One conventionalized way of using this facility is to perform
   _validation queries_ on the file – queries that will find anomalous
   structures, and flag them for annotator attnetion.footnote:[This idea
   stems from discussions with Beatrice Santorini about how her parsing
   methodology.]  In this section, we will discuss setting up such a
   system, using CorpusSearch queries.

   The specification of validation queries involves customizing the Python
   settings file.  An annotated example of such a file is given immediately
   below.

   [source,python]
   ----------
   import os.path
   current_dir = os.path.dirname(os.path.abspath(__file__)) # <1>

   from collections import OrderedDict # <2>

   validators = OrderedDict([
       ("Example 1", corpusSearchValidate(current_dir + "/example1.q")), # <3>
       ("Example 2", corpusSearchValidate(current_dir + "/example2.q"))
   ])
   ----------

   <1> An easy way to find in Python other necessary files (in this case,
   CorpusSearch queries) is by locating them with relation to the Python
   file itself.  This line assigns the directory where the script is
   located (as a string) to the variable `current_dir`.  Thus, this code
   assumes that in the same directory as the `settings.py` file, there are
   two files named `example1.q` and `example2.q` containing relevant
   CorpusSearch queries.
   // TODO(dev): could we simplify things, by using a decorator to add a
   // name to fns, and then just using a list of fns?
   <2> The format of the `validators` variable is a dictionary – a data
   structure that associates keys (in this case, human-readable names of
   validators) with values (validation functions).  The default dictionary
   implementation in Python does not preserve the order of the key-value
   pairs it stores.  This line allows us to use an alternative
   implementation that does preserve this order.  This means that the order
   which we specify validators in this file will be the order that they
   appear in Annotald’s dropdown menu.
   <3> We create an `OrderedDict` object, and assign it to the `validators`
   variable.  Each entry in the dictionary is given as a pair of `(key,
   value)`.

   The `corpusSearchValidate` function takes one argument, giving the path
   to a CorpusSearch query file.  It then arranges to run this query on the
   file, and return the modified output.  The CorpusSearch program is
   distributed with Annotald; however, this facility relies on a Java
   executable being installed on your machine.  You can test this by
   opening a command prompt and typing `java` followed by a carriage
   return.  You should see a usage message from the java program; if you
   instead receive an error message the java program is not installed
   and/or accessible.

   By convention, the validator should add the =-FLAG= dash tag to
   trees which are anomalous.  The “Next Error” button in the Annotald
   interface will allow you to jump to the next flagged tree in the
   file.  You can also attach a keybinding to the `nextValidationError`
   function, if you would like to use the keyboard for this purpose.
   The program removes any =-FLAG=s when the file is saved and when
   submitting it to the validator.

   When validators are specified, the Annotald interface shows the
   “Validate” and “Next Error” buttons as well as the validator selection
   menu in the “Tools” section of the left-hand column, as shown in the
   below image:

   image::images/annotald-validate.png["Validation interface in Annotald",align="center"]

   The example given above assumes that two CorpusSearch query functions
   are present in the same directory as the Python file.  For more
   information about writing CorpusSearch queries, consult the
   http://corpussearch.sourceforge.net/CS-manual/Contents.html[user’s
   guide], esepcially (for present purposes) the
   http://corpussearch.sourceforge.net/CS-manual/Revise.html[section on
   automated corpus revision] which tells how to make changes to the
   input.  As an example, the following CorpusSearch revision query adds a
   =-FLAG= to all NPs:

   ----------
   node: $ROOT

   query: {1}NP* exists

   append_label{1}: -FLAG
   ----------

   If run in the Annotald interface, it produces this result:

   image::images/annotald-validate-results.png["Validation results in the Annotald interface",align="center"]

.. _customjs:

Custom Javascript
~~~~~~~~~~~~~~~~~

..
   TODO: need require update

Because the Javascript settings file is interpreted as unrestricted
Javascript in the Annotald UI, it can be the vehicle for powerful
customizations.  Annotald includes the `jQuery <http://jquery.com/>`_
and `LoDash <http://http://lodash.com>`_ libraries, meaning that you
can use functions from either of these libraries in customization
code.  The details of these libraries are beyond the scope of the
current document.  As an overview, Annotald maps nodes in a parsed
file to nodes in the DOM.  Using jQuery’s DOM manipulation functions
(which are what Annotald itself uses internally), it is possible to
create custom functions that are powerful and mnemonic.

What follows is an annotated example of a custom function.  It forms a
``CONJP`` semi-automatically.  Specifically:

- if two nodes are selected, create a word-level conjunction spanning
  the selection; give it the label of the first selected node
- if one node is selected, look for a ``CONJ`` daughter of the selected
  node.  The nodes before the ``CONJ`` and after it are wrapped in an
  extra layer of structure; a ``CONJP`` is inserted dominating the ``CONJ``
  and the second conjunct

..
   TODO: test me

::

    function autoConjoin() {
       if (selection.cardinality() === 0) return; // <1>
       if (selection.cardinality() === 1) { // <2>
           var savestartnode = selection.get();
           var selnode = $(savestartnode); // <3>
           var label = getLabel(selnode);
           if (!label.startsWith("IP") &&
               !label.startsWith("CP")) { // <4>
               label = label.split("-")[0];
           }
           var conjnode = selnode.children(".CONJ").first(); // <5>
           if (conjnode) {
               selection.set(selnode.children().first().get(0)); // <6>
               selection.set(conjnode.prev().get(0), true);
               makeNode(label);
               selection.set(conjnode.get(0));
               selection.set(selnode.children().last().get(0), true);
               makeNode("CONJP");
               var conjpnode = $(selection.get());
               selection.set(conjpnode.children().get(1));
               selection.set(conjpnode.children().last().get(0));
               makeNode(label);
               selection.clear();
               selection.set(savestartnode); // <7>
               updateSelection();
           }
       } else { // <8>
           var s = $(startnode);
           var l = getLabel(s);
           if (s.nextUntil(endnode).filter(".CONJ").size() > 0 && // <9>
               s.end().children().filter(function () {
                   return !guessLeafNode($(this));
               }).size() == 0) {
               makeNode(l);
           }
       }

1. Exit the function if nothing is selected.
2. If there is only one thing selected...
3. The :func:`selection.get` function returns “native” nodes.  The
   ``$()`` function “wraps” them in the jQuery library, allowing jQuery
   functions to be used.
4. IP and CP nodes should keep their dash tags when embedded inside
   conjunction.  Thus we have (e.g. in the PPCEME) ``(NP-SBJ (NP ...)
   (CONJP (NP ...)))`` but ``(IP-INF (IP-INF ...) (CONJP (IP-INF ...)))``.
5. jQuery syntax is very intuitive; this line gets the first child of
   the ``selnode`` (selected node).
6. Appending ``.get(0)`` to a jQuery object “unwraps” it, transforming it
   back to a native type appropriate for passing to :func:`selection.set`.
7. Restore the user’s selection before exiting the function.
8. This is the branch that will be taken if two nodes are selected.
9. For word level conjunction, the selection must span over a ``CONJ``
   node, and each member of the selection must be a leaf node.

..
   Things to talk about:
   - annotation philosophy (useful annotation vs. correct annotation, some
     of beatrices ideas, etc)
   - the annotation itself (building up from nps to pps to verbs to
     sentences/clauses)
   - extensions (morpho/semantic information, lemmatization, ...)
   - tagset design etc.

..
   corpus formats – old, dash, and deep

..
   what else???

.. rubric:: Footnotes

.. [#ui-scrot] You may notice subtle differences in some screenshots, reflecting
   ways in which the Annotald UI has evolved over its development.  It is
   hoped that these will not detract from the points being explicated.

.. [#kbd] Left handed users may wish to use the left hand for mousing and
   the right hand for the keyboard, but the principle of using one hand
   exclusively for each operation remains the same.  Additionally, the
   default configuration will have to be adjusted for users of non-English
   keyboard layouts.

.. [#casetags] For a classic discussion of this phenomenon in Spanish and
   Portugese of Latin America, consult Guy, Gregory. 1981. “Parallel
   variability in American dialects of Spanish and Portuguese.”
   *Variation omnibus*, ed. by David Sankoff and Henrietta Cedergren,
   85-95. Alberta: Carbondale and Edmonton.

.. [#bindings] To see an exact listing of the tags included in each category
   described below, you should consult the configuration file itself.

.. [#case-differences] The YCOE does not follow these guidelines.
   Case is marked on phrasal nodes with dash tags (as a substitute for
   grammatical role marking: ``SBJ`` etc.), and on words with a caret:
   ``^N`` for nominative etc.  The Penn parsed corpora of Middle English
   and later time periods indicate genitive with a ``$`` which is
   directly concatenated with a leaf’s label, but this is not the kind
   of case-marking that this Annotald feature addresses.  The IcePaHC
   corpus does obey these conditions (unsurprisingly, since Annotald
   comes from that project), as does the Penn Parsed Corpus of
   Historical Greek.

..
   TODO add POMIC

.. [#search-or] Note that the results are the same as the previously illustrated
   sisterhood search, though the queries are distinct.
