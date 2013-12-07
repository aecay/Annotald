/*global require: false, DOMParser: false, exports: false*/

function makeWnode (xmlNode) {
    var wnode = document.createElement("span")
    , tn = document.createTextNode(xmlNode.textContent);
    wnode.appendChild(tn);
    return wnode;
}

function makeSnode (xmlNode) {
    var snode = document.createElement("div")
    , label = xmlNode.getAttribute("label")
    , cn = xmlNode.childNodes
    , atts = xmlNode.attributes
    , c, a, i;
    snode.className = "snode";
    for (i = 0; i < cn.length; i++) {
        c = cn[i];
        if (c.nodeType == 3) {
            snode.appendChild(makeWnode(c));
        } else if (c.nodeType == 1) {
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
    var dom = new DOMParser().parseFromString(xml, "text/xml")
    , sn0 = document.createElement("div")
    , rootElement = dom.childNodes[0]
    , cn =  rootElement.childNodes
    , c;
    sn0.className = "snode";
    sn0.id = "sn0";
    for (var i = 0; i < cn.length; i++) {
        c = cn[i];
        if (c.nodeType == 1) {
            sn0.appendChild(makeSnode(c));
        }
    }
    // TODO: global attributes
    return sn0;
};
