/*global describe: false, it: false, expect: false, require: false, DOMParser: false*/

/* istanbulify ignore file */

var mdUi = require("../../webapp/js/treedrawing/metadata-ui.ts");

function X (s) {
    return new DOMParser().parseFromString(s, "text/xml").childNodes[0];
}

describe("The metadata UI module", function () {
    describe("parseMetadataTypes", function () {
        var PMT = mdUi.__test__.parseMetadataTypes;
        it("should parse a text key", function () {
            expect(PMT(X("<metadataTypes><foo><metadataType>text</metadataType>" +
                         "</foo></metadataTypes>")).foo).toDeepEqual({
                             type: mdUi.MetadataType.TEXT
                         });
        });
        it("should parse a bool key", function () {
            expect(PMT(X("<metadataTypes><foo><metadataType>boolean</metadataType>" +
                         "</foo></metadataTypes>")).foo).toDeepEqual({
                             type: mdUi.MetadataType.BOOL
                         });
        });
        it("should parse a choice key", function () {
            expect(PMT(X("<metadataTypes><foo><metadataType>choice</metadataType>" +
                         "<metadataChoice>a</metadataChoice><metadataChoice>b</metadataChoice>" +
                         "</foo></metadataTypes>")).foo).toDeepEqual({
                             type: mdUi.MetadataType.CHOICE,
                                   choices: ["a","b"]
                         });
        });
        it("should throw on a choice key without choices", function () {
            expect(function () {
                PMT(X("<metadataTypes><foo><metadataType>choice</metadataType>" +
                      "</foo></metadataTypes>"));
            }).toThrow();
        });
        it("should throw on unknown metadataType", function () {
            expect(function () {
                PMT(X("<metadataTypes><foo><metadataType>bool</metadataType>" +
                      "</foo></metadataTypes>"));
            }).toThrow();
        });
        it("should throw on multiple metadataType", function () {
            expect(function () {
                PMT(X("<metadataTypes><foo><metadataType>boolean</metadataType>" +
                      "<metadataType>text</metadataType></foo></metadataTypes>"));
            }).toThrow();
        });
    });
});
