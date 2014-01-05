/*global module: true */

module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        browserify: {
            external: {
                src: [
                    // We might wish for jquery to be handled through NPM,
                    // since it's available there.  However, it is a
                    // dependency of vex, and is not properly handled unless
                    // we also include it here.
                    'bower_components/jquery/jquery.js'
                    ,'bower_components/vex/js/vex.dialog.js'
                    ,'bower_components/vex/js/vex.js'
                    ,'node_modules/react/react.js'
                    ,'node_modules/brace/index.js'
                ],
                dest: 'webapp/js/build/ext.js',
                options: {
                    alias: ['bower_components/jquery/jquery.js:jquery',
                            'node_modules/react/react.js:react',
                            'bower_components/vex/js/vex.dialog.js:vex-dialog',
                            'bower_components/vex/js/vex.js:vex',
                            'node_modules/brace/index.js:brace']
                }
            },
            dist: {
                src: ['webapp/js/main.js'],
                dest: 'webapp/js/build/web.js',
                options: {
                    debug: true,
                    standalone: "annotald",
                    external: ["jquery","vex","vex-dialog","react","brace"],
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
        jasmine: {
            src: "webapp/js/build/web-bundle.js",
            options: {
                specs: "test/build/spec-entry.js"
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

    grunt.registerTask('build', ['browserify']);
    grunt.registerTask('test', ['build', 'jasmine']);
};
