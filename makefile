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
	curl -s \
	  -d compilation_level=SIMPLE_OPTIMIZATIONS \
	  -d output_format=text \
	  -d output_info=compiled_code \
	  --data-urlencode "js_code@bin/jquery.treeselect.js" \
	  http://closure-compiler.appspot.com/compile \
	  > bin/jquery.treeselect.compressed.js

# Fix the js style on all the files.
fixjsstyle: ${files}
	fixjsstyle $^

# Install the necessary tools.
tools:
	apt-get install python-setuptools
	easy_install http://closure-linter.googlecode.com/files/closure_linter-latest.tar.gz
