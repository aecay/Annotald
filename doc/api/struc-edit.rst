.. default-domain:: js

.. highlight:: javascript

===================
 Structure editing
===================

.. data:: strucEdit

   This module contains functions which are responsible for manipulating
   the structure of trees.

.. function:: strucEdit.coIndex()

   Coindex nodes.

   Coindex the two selected nodes.  If they are already coindexed, toggle
   types of coindexation (normal -> gapping -> backwards gapping -> double
   gapping -> no indices).  If only one node is selected, remove its
   index.

.. function:: strucEdit.moveNode(parent)

   :param HTMLElement parent: the node to move the selected node to.
   :rtype boolean:
   :returns: whether the movement was successful.

    Move the selected node(s) to a new position.

    The movement operation must not change the text of the token.
    Empty categories are not allowed to be moved as a leaf.  However,
    a non-terminal containing only empty categories can be moved.

.. function:: strucEdit.moveNode(parent)

   :param HTMLElement parent: the node to move the selected node to.
   :rtype boolean:
   :returns: whether the movement was successful.

   Move several nodes.

   The two selected nodes must be sisters, and they and all intervening
   sisters will be moved as a unit.  Calls :func:`~strucEdit.moveNode`
   to do the heavy lifting.

.. function:: strucEdit.pruneNode()

   Delete a node.

   The node can only be deleted if doing so does not affect the text,
   i.e. it directly dominates no non-empty terminals.

.. function:: strucEdit.makeLeaf(before, [label, word, target])

   :param boolean before: whether to place the created node before or
                          after the selection.
   :param string label: the label to give the new node
   :param string word: the text to give the new node
   :param Element target: where to put the new node (default: selected
                          node)

   Create a leaf node adjacent to the selection, or a given target.

.. function:: strucEdit.leafBefore()

   A convenience wrapper around :func:`~strucEdit.makeLeaf`.

   Uses heuristic to determine whether the new leaf is to be a trace,
   empty subject, etc.

.. function:: strucEdit.leafAfter()

   A convenience wrapper around :func:`~strucEdit.makeLeaf`.

   Uses heuristic to determine whether the new leaf is to be a trace,
   empty subject, etc.

.. function:: strucEdit.makeNode([label])

   :param string label: the label to give the new node (default: XP)

   Create a phrasal node.

   The node will dominate the selected node or (if two sisters are
   selected) the selection and all intervening sisters.

.. function:: strucEdit.toggleExtension(extension)

   :param string extension: the extension to toggle

   Add a dash tag to the node, or remove it if it already exists.

   The precise manipulations this function does are looked up in the
   current label mapping.

   .. TODO: link to label mapping
