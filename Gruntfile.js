/*global module: true, require: false */

var cacheify = require("cacheify"),
    level = require("level"),
    dbr = level("./cache-react"),
    dbt = level("./cache-ts"),
    typescriptify = require("typescriptify"),
    reactify = require("reactify"),
    istanbulify = require("./test/istanbulify");

var reactifyCached = cacheify(reactify, dbr);
var typescriptifyCached = cacheify(typescriptify, dbt);

var annotaldBrowserifyExternal = ["jquery","vex","vex-dialog","react","brace",
                                  "brace/theme/xcode","brace/mode/javascript",
                                  "q","dropbox","lodash"];

module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        browserify: {
            external: {
                src: [
                    'bower_components/jquery/jquery.js'
                    ,'bower_components/vex/js/vex.dialog.js'
                    ,'bower_components/vex/js/vex.js'
                    ,'node_modules/react/react.js'
                    ,'node_modules/brace/index.js'
                    ,'node_modules/brace/theme/xcode.js'
                    ,'node_modules/brace/mode/javascript.js'
                    ,'node_modules/q/q.js'
                    ,'webapp/js/ext/dropbox.js'
                    ,'webapp/js/ext/growl.js'
                    ,'node_modules/lodash/dist/lodash.js'
                ],
                dest: 'webapp/build/ext.js',
                options: {
                    alias: ['bower_components/jquery/jquery.js:jquery',
                            'node_modules/react/react.js:react',
                            'bower_components/vex/js/vex.dialog.js:vex-dialog',
                            'bower_components/vex/js/vex.js:vex',
                            'node_modules/brace/index.js:brace',
                            'node_modules/brace/theme/xcode.js:brace/theme/xcode',
                            'node_modules/brace/mode/javascript.js:brace/mode/javascript',
                            'node_modules/q/q.js:q',
                            'webapp/js/ext/dropbox.js:dropbox',
                            'webapp/js/ext/growl.js:growl',
                            'node_modules/lodash/dist/lodash.js:lodash'
                           ]
                }
            },
            annotald: {
                src: ['webapp/js/main.js'],
                dest: 'webapp/build/web.js',
                options: {
                    debug: true,
                    external: annotaldBrowserifyExternal,
                    transform: [typescriptifyCached, reactifyCached, "browserify-shim"],
                    alias: [
                        'webapp/js/treedrawing/entry-points.ts:treedrawing/entry-points',
                        'webapp/js/treedrawing/bindings.ts:treedrawing/bindings',
                        'webapp/js/treedrawing/contextmenu.ts:treedrawing/contextmenu',
                        'webapp/js/treedrawing/user-style.ts:treedrawing/user-style',
                        'webapp/js/treedrawing/config.ts:treedrawing/config'
                    ]
                }
            },
            test: {
                src: 'test/spec/*.js',
                dest: 'test/build/spec-entry.js',
                options: {
                    debug: true,
                    transform: [typescriptifyCached, reactifyCached,
                                "browserify-shim", istanbulify],
                    external: annotaldBrowserifyExternal
                }
            }
        },
        external_sourcemap: {
            annotald: {
                files: {
                    "webapp/build": ["webapp/build/web.js"]
                }
            }
        },
        jasmine: {
            src: [],
            options: {
                vendor: ["test/ace-polyfill-fix.js",
                         "node_modules/polymer-weakmap/weakmap.js",
                         "node_modules/mutationobservers/MutationObserver.js",
                         "webapp/build/ext.js"],
                specs: "test/build/spec-entry.js",
                template: require("./test/jasmine-istanbul-template/template"),
                templateOptions: {
                    coverage: "test/out/coverage.json",
                    report: "test/out/coverage"
                }
            }
        },
        jshint: {
            files: ["webapp/js/**/*.js",
                    "!webapp/js/ext/**",
                    "!webapp/js/ui/tree-editor-template.js"],
            options: {
                jshintrc: "jshintrc",
                "reporter": "jshint-reporter.js"
            }
        },
        tslint: {
            options: {
                configuration: grunt.file.readJSON("tslintrc")
            },
            all: {
                src: "webapp/js/**/*.ts"
            }
        },
        uglify: {
            annotald: {
                src: "webapp/build/web.js",
                dest: "webapp/build/web.min.js",
                options: {
                    sourceMap: "webapp/build/web.min.js.map",
                    sourceMapIn: "webapp/build/web.js.map",
                    preserveComments: 'some',
                    sourceMappingURL: '/web.min.js.map',
                    sourceMapRoot: '/'
                }
            },
            external: {
                src: "webapp/build/ext.js",
                dest: "webapp/build/ext.min.js",
                options: {
                    preserveComments: 'some'
                }
            }
        },
        cssmin: {
            annotald: {
                src: ["webapp/css/growl.css", "webapp/css/vex.css",
                      "webapp/css/vex-theme-default.css",
                      "webapp/css/main.css", "webapp/css/treedrawing.css"
                     ],
                dest: "webapp/build/min.css"
            }
        },
        watch: {
            annotald: {
                files: ['webapp/js/**/*.js'],
                tasks: ['build-annotald']
            },
            css: {
                files: ['webapp/css/*.css'],
                tasks: ['build-css']
            },
            html: {
                files: ['webapp/html/*.html'],
                tasks: ['build-html']
            },
            options: {
                livereload: true
            }
        },
        copy: {
            main: {
                src: "webapp/html/main.html",
                dest: "webapp/build/main.html"
            },
            oauth_receiver: {
                src: "webapp/html/oauth_receiver.html",
                dest: "webapp/build/oauth_receiver.html"
            }
        },
        clean: {
            build: {
                src: ["webapp/build/ext.js",
                      "webapp/build/web.js",
                      "webapp/build/web.js.map"]
            }
        },
        connect: {
            server: {
                options: {
                    port: 8888,
                    base: 'webapp/build',
                    keepalive: true
                }
            },
            test: {
                options: {
                    port: 8887,
                    base: 'test/build',
                    keepalive: true
                }
            }
        },
        "tpm-install": {
            options: {
                dev: true
            },
            all: {
                src: ["package.json","bower.json"],
                dest: "types/"
            }
        },
        "tpm-index": {
            all: {
                src: "types/**/*.d.ts",
                dest: "types/all.d.ts"
            }
        }
    });

    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-external-sourcemap');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('typescript-tpm');
    grunt.loadNpmTasks('grunt-tslint');

    grunt.registerTask('build-external', ['browserify:external',
                                          'uglify:external'
                                          //, 'clean:build'
                                         ]);
    grunt.registerTask('build-annotald', ['browserify:annotald',
                                          'external_sourcemap:annotald'
                                          // 'uglify:annotald'
                                          //, 'clean:build'
                                         ]);
    grunt.registerTask('build-css', ['cssmin']);
    grunt.registerTask('build-html', ['copy:main','copy:oauth_receiver']);

    grunt.registerTask('build', ['build-external','build-annotald',
                                 'build-css','build-html']);
    grunt.registerTask('test', ['build-annotald','browserify:test','jasmine']);

    grunt.registerTask('default', ['build','connect','watch']);
};
