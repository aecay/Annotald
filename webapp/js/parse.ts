///<reference path="./../../types/all.d.ts" />

import $ = require("jquery");

function makeWnode (xmlNode : Node) : Node {
    var wnode = document.createElement("span");
    var tn = document.createTextNode(xmlNode.textContent);
    wnode.className = "wnode";
    wnode.appendChild(tn);
    return wnode;
}

function makeSnode (xmlNode : Node) : Node {
    var snode = document.createElement("div");
    var cn = xmlNode.childNodes;
    var atts = xmlNode.attributes;
    var c, a, i;
    snode.className = "snode";
    for (i = 0; i < cn.length; i++) {
        c = cn[i];
        if (c.nodeType === 3 && c.textContent.trim() !== "") {
            snode.appendChild(makeWnode(c));
            snode.setAttribute("data-nodetype", xmlNode.nodeName);
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

export function parseXmlToHtml (xml : string) : Node {
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

function terminalNodeToString (node : HTMLElement) : string {
    var wnode;
    for (var i = 0; i < node.children.length; i++) {
        if (node.children[i].nodeType === 1 &&
            (<HTMLElement>node.children[i]).classList.contains("wnode")) {
            wnode = node.children[i];
            break;
        }
    }
    return wnode.textContent;
}

function nodeToXml (doc : Document, node : HTMLElement, root? : boolean) : Node {
    var name, i, recurse = true;
    if (root) {
        name = "sentence";
    } else {
        if (node.children.length === 1 &&
            (<HTMLElement>node.children[0]).classList.contains("wnode")) {
            // Terminal
            name = node.attributes["data-nodetype"].value;
            recurse = false;
        } else {
            // Text node
            name = "nonterminal";
        }
    }
    var s = doc.createElement(name),
        attrs = node.attributes;
    for (i = 0; i < attrs.length; i++) {
        var attr = attrs[i];
        if (attr.name === "data-metadata") {
            // TODO: handle metadata
        } else if (attr.name === "data-nodetype") {
            // do nothing
        } else if (/^data-/.test(attr.name)) {
            s.setAttribute(attrs[i].name.replace(/^data-/, ""),
                           attrs[i].value);
        }
    }
    if (recurse) {
        for (i = 0; i < node.childNodes.length; i++) {
            if (node.childNodes[i].nodeType === 1) {
                // Element node
                s.appendChild(nodeToXml(doc, <HTMLElement>node.childNodes[i]));
            }
        }
    } else {
        var tn = doc.createTextNode(terminalNodeToString(<HTMLElement>node));
        s.appendChild(tn);
    }
    return s;
}

export function parseHtmlToXml (node : Node) : string {
    var doc = document.implementation.createDocument("foo", "", null);
    var corpus = document.createElementNS("foo", "corpus");
    doc.appendChild(corpus);
    $(node).children().each(function () : void {
        corpus.appendChild(nodeToXml(doc, this, true));
    });
    return (new XMLSerializer).serializeToString(doc).replace(/ xmlns="foo"/, "");
};
