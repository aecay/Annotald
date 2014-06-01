var bulk = require("bulk-require");
bulk(__dirname + "/../webapp/js/", ["**/*.ts", "!**/flymake_*"]);
