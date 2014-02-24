/*global describe: false, it: false, expect: false, require: false,
  runs: false */

/* istanbulify ignore file */

var cs = require("../../webapp/js/config-store.js"),
    _ = require("lodash"),
    Q = require("q");

describe("async tests", function () {
    it("should pass", function (done) {
        Q.when(true).then(function (r) {
            expect(r).toBeTruthy();
            done();
        });
    });
    it("should fail", function (done) {
        Q.when(false).then(function (r) {
            expect(r).toBeTruthy();
            done();
        });
    });
});

beforeEach(function (done) {
    cs.listConfigs().then(function (configs) {
        Q.all(_.map(configs, function (c) {
            cs.deleteConfig(c);
        })).then(function () {
            done();
        });
    });
});

describe("the config store", function () {
    it("should return an empty object initially", function (done) {
        cs.listConfigs().then(function (result) {
            expect(_.keys(result).length).toBe(0);
            done();
        });
    });
    it("should properly set configs", function (done) {
        cs.setConfig("foo", "bar").then(function () {
            cs.getConfig("foo", function (result) {
                expect(result).toBe("bar");
            });
        }).then(function () {
            cs.listConfigs().then(function (configs) {
                expect(configs.indexOf("foo") >= 0);
            });
        }).then(function () {
            done();
        });
    });
});
