/*global module: true */

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
                    ,'webapp/js/dropbox.js'
                    ,'webapp/js/growl.js'
                ],
                dest: 'webapp/js/build/ext.js',
                options: {
                    alias: ['bower_components/jquery/jquery.js:jquery',
                            'node_modules/react/react.js:react',
                            'bower_components/vex/js/vex.dialog.js:vex-dialog',
                            'bower_components/vex/js/vex.js:vex',
                            'node_modules/brace/index.js:brace',
                            'node_modules/brace/theme/xcode.js:brace/theme/xcode',
                            'node_modules/brace/mode/javascript.js:brace/mode/javascript',
                            'node_modules/q/q.js:q',
                            'webapp/js/dropbox.js:dropbox',
                            'webapp/js/growl.js:growl'
                           ]
                }
            },
            dist: {
                src: ['webapp/js/main.js'],
                dest: 'webapp/js/build/web.js',
                options: {
                    debug: true,
                    standalone: "annotald",
                    external: ["jquery","vex","vex-dialog","react","brace",
                               "brace/theme/xcode","brace/mode/javascript",
                               "q","dropbox"],
                    transform:["reactify"]
                }
            },
            test: {
                src: 'test/spec/*.js',
                dest: 'test/build/spec-entry.js',
                options: {
                    external: 'webapp/js/**/*.js'
                }
            }
        },
        external_sourcemap: {
            build: {
                files: {
                "webapp/js/build": ["webapp/js/build/ext.js",
                                    "webapp/js/build/web.js"]
                }
            }
        },
        jasmine: {
            src: "webapp/js/build/web-bundle.js",
            options: {
                specs: "test/build/spec-entry.js"
            }
        },
        jshint: {
            files: ["webapp/js/**/*.js",
                    "!webapp/js/build/**",
                    "!webapp/js/ext/**"],
            options: {
                jshintrc: "jshintrc"
            }
        },
        watch: {
            dist: {
                files: ['webapp/js/*.js'],
                tasks: ['browserify:dist'],
                options: {
                    livereload: true
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-external-sourcemap');
    grunt.loadNpmTasks('grunt-contrib-jshint');

    grunt.registerTask('build', ['browserify']);
    grunt.registerTask('test', ['build', 'jasmine']);
};
