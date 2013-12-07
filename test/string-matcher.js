/*global beforeEach: false */

beforeEach(function() {
    var matchers = {
        toEqualString: function toEqualString (expected) {
            this.message = function () {
                return "Expected '" + this.actual + (this.isNot ? "' not " : "' ") +
                    "to be equal to '" + expected + "'";
            };
            if (expected === this.actual) {
                return true;
            }
            var i = 0;
            while (expected.charAt(i) === this.actual.charAt(i)) {
                i++;
            }
            this.message = function () {
                return "Expected '" + this.actual + (this.isNot ? "' not " : "' ") +
                    "to be equal to '" + expected + "'" + "\n" + "Common"
                    + " prefix: '" + expected.substring(0, i) + "'\n" +
                    "Differing portion: '" + expected.substring(i) + "'"
                    + " vs. '" + this.actual.substring(i) + "'";
            };
            return false;
        }
    };
    this.addMatchers(matchers);
});
