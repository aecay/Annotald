/*global module: true */

module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        browserify: {
            dist: {
                src: ['webapp/js/main.js'],
                dest: 'webapp/js/build/web-bundle.js',
                options: {
                    debug: true,
                    standalone: "annotald"
                }
            }
        }
    });

grunt.loadNpmTasks('grunt-browserify');
};
