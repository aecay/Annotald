var bulk = require("bulk-require");
bulk(__dirname + "/../src/js/", ["**/*.ts", "!**/flymake_*"]);
