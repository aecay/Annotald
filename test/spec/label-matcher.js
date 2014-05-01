/*global describe: false, it: false, expect: false, require: false */

/* istanbulify ignore file */

var labelConvert = require("../../webapp/js/treedrawing/label-convert.ts");
var $ = require("jquery");

describe("the object matcher", function () {
    it("should match objects correctly", function () {
        var mo = labelConvert.matchObjects,
            obj = { a: "b", x: { y: "z", q: "w" }};
        expect(mo({ a: "b"}, obj)).toBeTruthy();
        expect(mo({ x: { y: "z" }}, obj)).toBeTruthy();
        expect(mo({ a: "b"}, obj)).toBeTruthy();
        expect(mo({ x: { y: "z" }}, obj)).toBeTruthy();
        expect(mo({ a: "b", x: { y: "z" }}, obj)).toBeTruthy();
        expect(mo({ a: "b", x: { y: "z" }}, obj)).toBeTruthy();
        expect(mo({ a: "c" }, obj)).toBeFalsy();
        expect(mo({ x: { y: "w" }}, obj)).toBeFalsy();
        expect(mo({ x: "y" }, obj)).toBeFalsy();
        expect(mo({ e: "f" }, obj)).toBeFalsy();
        expect(mo({ a: "b", x: { y: "z" }, e: "f" }, obj)).toBeFalsy();
    });
});

describe("The label converter", function () {
    var M = labelConvert.matchMetadataAgainstObject;
    var N = labelConvert.nodeMatchesSpec;
    var mapping = {
        defaults: { PRN: { parenthetical: "yes" }},
        defaultSubcategories: [],
        byLabel : {
            NP: {
                subcategories: ["SBJ","OB1"],
                metadataKeys: {
                    LFD: { key: "left-disloc", value: "yes" },
                    TMP: { key: "semantic", value: { fn: "temporal" }}
                }
            },
            IP: {
                subcategories: ["MAT","SUB"],
                metadataKeys: {
                    TMP: { key: "foo", value: "bar"}
                }
            }
        }
    };
    it("should match simple objects against templates correctly", function () {
        expect(M("x", "y", { x: "y" })).toBeTruthy();
        expect(!M("x", "y", { x: "z" })).toBeTruthy();
        expect(M("x", "y", { x: "y", a: "b" })).toBeTruthy();
        expect(!M("x", "y", {})).toBeTruthy();
        expect(!M("x", "y", { a: "b" })).toBeTruthy();
    });
    it("should match complex nodes correctly", function () {
        expect(M("x", { y : "z" }, { x: { y: "z" }})).toBeTruthy();
        expect(!M("x", { y : "z" }, { x: { y: "a" }})).toBeTruthy();
        expect(!M("x", { y : "z" }, { x: { a: "z" }})).toBeTruthy();
        expect(!M("x", { y : "z" }, { x: "y" })).toBeTruthy();
    });
    it("should match node categories", function () {
        var node = $('<div data-category="X"></div>').get(0);
        expect(N(node, { category: "X" })).toBeTruthy();
        expect(!N(node, { category: "Y" })).toBeTruthy();
    });
    it("should match node subcategories", function () {
        var node = $('<div data-subcategory="X"></div>').get(0);
        expect(N(node, { subcategory: "X" })).toBeTruthy();
        expect(!N(node, { subcategory: "Y" })).toBeTruthy();
    });
    it("should match node categories with subcategories", function () {
        var node = $('<div data-category="X" data-subcategory="Y"></div>').get(0);
        expect(N(node, { category: "X", subcategory: "Y" })).toBeTruthy();
        expect(N(node, { subcategory: "Y" })).toBeTruthy();
        expect(N(node, { category: "X" })).toBeTruthy();
        expect(!N(node, { category: "X", subcategory: "Z" })).toBeTruthy();
        expect(!N(node, { category: "Z", subcategory: "Y" })).toBeTruthy();
    });
    it("should match node metadata", function () {
        var node = $('<div data-category="X" data-subcategory="Y"></div>').get(0);
        node.setAttribute("data-metadata",
                          JSON.stringify({ a: "b", x: { y: "z", q: "w" }}));
        expect(N(node, { category: "X" })).toBeTruthy();
        expect(N(node, { category: "X", subcategory: "Y" })).toBeTruthy();
        expect(N(node, { category: "X", subcategory: "Y", metadata: { a: "b"}})).toBeTruthy();
        expect(N(node, { category: "X", subcategory: "Y", metadata: { x: { y: "z" }}})).toBeTruthy();
        expect(N(node, { metadata: { a: "b"}})).toBeTruthy();
        expect(N(node, { metadata: { x: { y: "z" }}})).toBeTruthy();
        expect(N(node, { metadata: { a: "b", x: { y: "z" }}})).toBeTruthy();

        expect(N(node, { metadata: { a: "c" }})).toBeFalsy();
        expect(N(node, { metadata: { x: { y: "w" }}})).toBeFalsy();
        expect(N(node, { metadata: { x: "y" }})).toBeFalsy();
        expect(N(node, { metadata: { e: "f" }})).toBeFalsy();
        expect(N(node, { metadata: { a: "b", x: { y: "z" }, e: "f" }})).toBeFalsy();
    });
    it("should properly discern valid subcats", function () {
        expect(1);
        // TODO: how to test private function?
    });
    it("should convert labels to match specs properly", function () {
        var LMS = labelConvert.labelToMatchSpec;
        expect(LMS("NP", mapping)).toEqual({ category: "NP" });
        expect(LMS("NP-SBJ", mapping)).toEqual({ category: "NP", subcategory: "SBJ" });
        expect(LMS("NP-SBJ-TMP", mapping)).toEqual({ category: "NP", subcategory: "SBJ",
                                            metadata: { semantic: {
                                                fn: "temporal"
                                            }}});
        expect(LMS("NP-TMP", mapping)).toEqual({ category: "NP",
                                                 metadata: { semantic: {
                                                     fn: "temporal"
                                                 }}});
    });
    it("should properly set labels on nodes", function () {
        var node = $('<div></div>').get(0);
        var SL = labelConvert.setLabelForNode;
        SL("NP-SBJ", node, mapping);
        expect(node).toHaveAttribute("data-category", "NP");
        expect(node).toHaveAttribute("data-subcategory", "SBJ");

        SL("NP-SBJ", node, mapping, true);
        // Cannot remove the category
        expect(node).toHaveAttribute("data-category", "NP");
        expect(node).not.toHaveAttribute("data-subcategory");

        SL("NP-TMP", node, mapping);
        expect(node).toHaveAttribute("data-category", "NP");
        expect(node).not.toHaveAttribute("data-subcategory");
        expect(node).toHaveAttribute("data-metadata", JSON.stringify(
            { semantic: { fn: "temporal" }}
        ));

        SL("NP-TMP", node, mapping, true);

        expect(node).toHaveAttribute("data-category", "NP");
        expect(node).not.toHaveAttribute("data-subcategory");
        expect(node).not.toHaveAttribute("data-metadata");
    });
});
