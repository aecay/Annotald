/*global module: true */

module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        browserify: {
            external: {
                src: ['bower_components/jquery/jquery.js'
                      ,'bower_components/vex/js/vex.combined.min.js'],
                dest: 'webapp/js/build/ext.js',
                options: {
                    alias: ['bower_components/jquery/jquery.js:jquery',
                            'bower_components/vex/js/vex.combined.min.js:vex']
                }
            },
            dist: {
                src: ['webapp/js/main.js'],
                dest: 'webapp/js/build/web.js',
                options: {
                    debug: true,
                    standalone: "annotald",
                    external: ["jquery","vex"]
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
