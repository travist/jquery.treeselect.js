# To run this makefile, you must have all the necessary tools installed.
#
# To install all the necessary tools, simply run the following...
#
#    sudo make -B tools
#

# Create the list of files
files =	js/jquery.treeselect.js\
	js/jquery.chosentree.js

.DEFAULT_GOAL := all

all: jslint js

# Perform a jsLint on all the files.
jslint: ${files}
	gjslint $^

# Create an aggregated js file and a compressed js file.
js: ${files}
	@echo "Generating aggregated bin/jquery.treeselect.js file"
	@cat > bin/jquery.treeselect.js $^
	@echo "Generating compressed bin/jquery.treeselect.compressed.js file"
	@java -jar tools/compiler.jar --js bin/jquery.treeselect.js --js_output_file bin/jquery.treeselect.compressed.js

# Fix the js style on all the files.
fixjsstyle: ${files}
	fixjsstyle $^

# Install the necessary tools.
tools:
	apt-get install python-setuptools
	apt-get install unzip
	wget http://closure-compiler.googlecode.com/files/compiler-latest.zip -P tools
	unzip tools/compiler-latest.zip -d tools
	rm tools/compiler-latest.zip tools/COPYING tools/README
	easy_install http://closure-linter.googlecode.com/files/closure_linter-latest.tar.gz
