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
        }
    };

    jasmine.addMatchers(matchers);
});
