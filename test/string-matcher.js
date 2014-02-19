/*global beforeEach: false, jasmine: false */

beforeEach(function() {
    var matchers = {
        toEqualString:
        function toEqualStringOuter () {
            return { compare:
                     function toEqualString (actual, expected) {
                         var result = {};
                         result.pass = expected === actual;
                         if (result.pass) {
                             result.message = "'" + actual + "' is equal to '" +
                                 expected + "'";
                         } else {
                             var i = 0;
                             while (expected.charAt(i) === actual.charAt(i)) {
                                 i++;
                             }
                             result.message = "Expected '" + actual +
                                 "' to be equal to '" + expected + "'" + "\n" +
                                 "Common prefix: '" + expected.substring(0, i)
                                 + "'\n" + "Differing portion: '" +
                                 expected.substring(i) + "'" + " vs. '" +
                                 actual.substring(i) + "'";
                         }
                         return result;
                     }
                   };
        },
        toHaveAttribute:
        function toHaveAttributeOuter () {
            return { compare:
                     function toHaveAttribute (actual, attribute, value) {
                         var result = {};
                         if (! actual instanceof Element) {
                             result.pass = false;
                             result.message = "Expected a non-Element to have" +
                                 "an attribute.";
                         } else {
                             if (typeof value !== "undefined") {
                                 result.pass = actual.hasAttribute(attribute) &&
                                     actual.getAttribute(attribute) === value;
                                 if (result.pass) {
                                     result.message = "Expected attribute '" +
                                         attribute + "' was '" + value + "'";
                                 } else {
                                     result.message = "Expected attribute '" +
                                         attribute + "' was '" +
                                         actual.getAttribute(attribute) + "'" +
                                         " instead of '" + value + "'";
                                 }
                             } else {
                                 result.pass = actual.hasAttribute(attribute);
                                 result.message = "Expected attribute '" +
                                     attribute + "' was " + (result.pass ? "" :
                                                           "not ") + "found";
                             }
                         }
                         return result;
                   }};
        }
    };

    jasmine.addMatchers(matchers);
});
