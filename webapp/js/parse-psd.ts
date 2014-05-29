///<reference path="./../../types/all.d.ts" />

import peg = require("pegjs");
var fs = require("fs");
import lc = require("./treedrawing/label-convert");
import _ = require("lodash");
import md = require("./treedrawing/metadata");

var grammar = fs.readFileSync(__dirname + "/psd-grammars/main.txt", "utf8");

var icelandicText = fs.readFileSync(__dirname + "/psd-grammars/icelandic-text.txt",
                                    "utf8");

var icelandicLeaf = fs.readFileSync(__dirname + "/psd-grammars/icelandic-leaf.txt",
                                    "utf8");

// TODO: case as part of the return value

export function parseCorpus (corpus : string) : any {
    var parser = peg.buildParser(grammar + icelandicText + icelandicLeaf);
    var res = parser.parse(corpus);
    return res;
}

export function jsToXml (root : any, spec : lc.LabelMap) : string {
    var doc = document.implementation.createDocument("foo", "", null);
    var corpus = document.createElementNS("foo", "corpus");
    doc.appendChild(corpus);
    _.forEach(root, function (tree : any) : void {
        corpus.appendChild(jsToXmlInnerTop(tree, doc, spec));
    });
    return (new XMLSerializer).serializeToString(doc).replace(/ xmlns="foo"/, "");
}

function jsToXmlInnerTop (obj : any, doc : Document, spec : lc.LabelMap) : Element {
    var s = doc.createElementNS("foo", "sentence");
    if (obj.id) {
        s.setAttribute("id", obj.id);
    }
    s.appendChild(jsToXmlInner(obj.tree, doc, spec));
    return s;
}

function jsToXmlInner (obj : any, doc : Document, spec : lc.LabelMap) : Element {
    if (!obj.label) {
        throw new Error("jsToXmlInner: missing label: " + JSON.stringify(obj));
    }
    if (obj.type) {
        var t;
        if (obj.type === "text") {
            t = doc.createElementNS("foo", "text");
            t.appendChild(doc.createTextNode(obj.text));
            lc.setLabelForNode(obj.label, t, spec, false, true);
            if (obj.lemma) {
                md.setMetadataXml(t, "lemma", obj.lemma);
            }
            if (obj.index) {
                t.setAttribute("index", obj.index.index);
                t.setAttribute("idxtype", obj.index.idxtype);
            }
        } else if (obj.type === "trace") {
            t = doc.createElementNS("foo", "trace");
            lc.setLabelForNode(obj.label, t, spec, false, true);
            t.setAttribute("index", obj.index.index);
            t.setAttribute("idxtype", obj.index.idxtype);
            t.setAttribute("tracetype", obj.tracetype);
        } else if (obj.type === "ec") {
            t = doc.createElementNS("foo", "ec");
            lc.setLabelForNode(obj.label, t, spec, false, true);
            if (obj.index) {
                t.setAttribute("index", obj.index.index);
                t.setAttribute("idxtype", obj.index.idxtype);
            }
            t.setAttribute("ectype", obj.ectype);
        } else if (obj.type === "comment") {
            t = doc.createElementNS("foo", "comment");
            t.setAttribute("category", "CODE");
            t.setAttribute("comtype", obj.comtype || "COM");
            t.appendChild(doc.createTextNode(obj.text));
        } else {
            throw new Error("jsToXmlInner: unknown type: " + obj.type);
        }
        return t;

    } else {
        var nt = doc.createElementNS("foo", "nonterminal");
        lc.setLabelForNode(obj.label, nt, spec, false, true);
        if (obj.index) {
            nt.setAttribute("index", obj.index.index);
            nt.setAttribute("idxtype", obj.index.idxtype);
        }
        _.forEach(obj.desc, (x : any) : any =>
                  nt.appendChild(jsToXmlInner(x, doc, spec)));
        return nt;
    }
}
