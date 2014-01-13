/*global DOMParser: false, exports: false */

/*jshint browser: true */

function makeWnode (xmlNode) {
    var wnode = document.createElement("span"),
        tn = document.createTextNode(xmlNode.textContent);
    wnode.className = "wnode";
    wnode.appendChild(tn);
    return wnode;
}

function makeSnode (xmlNode) {
    var snode = document.createElement("div"),
        label = xmlNode.getAttribute("label"),
        cn = xmlNode.childNodes,
        atts = xmlNode.attributes,
        c, a, i;
    snode.className = "snode";
    snode.appendChild(document.createTextNode(label + " "));
    for (i = 0; i < cn.length; i++) {
        c = cn[i];
        if (c.nodeType === 3 && c.textContent.trim() !== "") {
            snode.appendChild(makeWnode(c));
        } else if (c.nodeType === 1) {
            snode.appendChild(makeSnode(c));
        }
    }
    for (i = 0; i < atts.length; i++) {
        a = atts[i];
        snode.setAttribute("data-" + a.nodeName, a.nodeValue);
    }
    return snode;
}

exports.parseXmlToHtml = function parseXmlToHtml (xml) {
    var dom = new DOMParser().parseFromString(xml, "text/xml"),
        sn0 = document.createElement("div"),
        rootElement = dom.childNodes[0],
        cn =  rootElement.childNodes,
        c;
    sn0.className = "snode";
    sn0.id = "sn0";
    for (var i = 0; i < cn.length; i++) {
        c = cn[i];
        if (c.nodeType === 1) {
            sn0.appendChild(makeSnode(c));
        }
    }
    // TODO: global attributes
    return sn0;
};

function nodeToXml (doc, node, root) {
    var name, i;
    if (root) {
        name = "sentence";
    } else {
        if (node.nodeType === 1) {
            // Element node
            name = "nonterminal";
        } else {
            // Text node
            name = "terminal";
        }
    }
    var s = doc.createNode(name),
        attrs = node.attributes;
    for (i = 0; i < attrs.length; i++) {
        s.setAttribute(attrs[i].name, attrs[i].value);
    }
    if (node.nodeType === 1) {
        for (i = 0; i < node.childNodes.length; i++) {
            if (node.childNodes[i].nodeType === 1 ||
               node.childNodes[i].nodeType === 3) {
                // Element node or text node
                s.appendChild(nodeToXml(node.childNodes[i]));
            }
        }
    }
    return s;
}

exports.parseHtmlToXml = function parseHtmlToXml (node) {
    var doc = document.implementation.createDocument(null, "corpus", null);
    node.each(function () {
        doc.appendChild(nodeToXml(doc, this, true));
    });
};
