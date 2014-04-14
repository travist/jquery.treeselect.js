module.exports = function(grunt) {

  var files = [
    'lib/jquery.moreorless.js/jquery.moreorless.js',
    'src/jquery.treeselect.js',
    'src/jquery.chosentree.js'
  ];

  var styles = [
    'lib/jquery.moreorless.js/moreorless.css',
    'css/treeselect.css',
    'css/chosentree.css'
  ];

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      all: ['Gruntfile.js'].concat(files)
    },
    concat: {
      options: {
        separator: '',
      },
      build: {
        files: {
          'bin/jquery.treeselect.js': files,
          'bin/jquery.treeselect.css': styles
        }
      },
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        files: {
          'bin/jquery.treeselect.min.js': files
        }
      }
    },
    jsdoc : {
      dist : {
        src: files,
        options: {
          destination: 'doc'
        }
      }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // Default task(s).
  grunt.registerTask('default', ['jshint', 'concat', 'uglify', 'jsdoc']);
};
