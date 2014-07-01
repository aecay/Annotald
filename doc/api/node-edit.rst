.. default-domain:: js

.. highlight:: javascript

==============
 Node editing
==============

.. data:: nodeEdit

   This module contains functions which are responsible for manipulating
   the structure of trees.

.. function:: nodeEdit.setLabel(labels)

   :param string[] labels: a list of labels

   Given a list of labels, this function will attempt to find the node's
   current label in the list.  If it is successful, it sets the node's
   label to the next label in the list (or the first, if the node's
   current label is the last in the list).  If not, it sets the label to
   the first label in the list.

   .. TODO: is this functionality worth restoring?

      This can also be an object -- if so, the base label (without any dash
      tags) of the target node is looked up as a key, and its corresponding
      value is used as the list.  If there is no value for that key, the
      first value specified in the object is the default.
