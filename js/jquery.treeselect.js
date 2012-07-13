(function($) {

  // The tree select control.
  $.fn.treeselect = function(params) {

    // Setup the default parameters for the tree select control.
    params = $.extend({
      colwidth: 18,               /** The width of the columns. */
      default_value: {},          /** An array of default values. */
      selected: null,             /** Callback when an item is selected. */
      treeloaded: null,           /** Called when the tree is loaded. */
      load: null,                 /** Callback to load new tree's */
      deepLoad: false,            /** Performs a deep load */
      onbuild: null,              /** Called when each node is building. */
      postbuild: null,            /** Called when the node is done building. */
      inputName: 'treeselect',    /** The input name. */
      selectAll: false,           /** If we wish to see a select all. */
      selectAllText: 'Select All' /** The select all text. */
    }, params);

    /** Keep track of all loaded nodes */
    var loadedNodes = {};

    /**
     * Constructor.
     */
    var TreeNode = function(nodeparams, root) {

      // Determine if this is a root item.
      this.root = !!root;

      // Setup the parameters.
      nodeparams.title = nodeparams.title || 'anonymous';
      $.extend(this, {
        id: 0,                /** The ID of this node. */
        nodeloaded: false,    /** Flag to see if this node is loaded. */
        allLoaded: false,     /** Flag to see if we have loaded all nodes. */
        value: 0,             /** The input value for this node. */
        title: '',            /** The title of this node. */
        url: '',              /** The URL to this node. */
        has_children: true,   /** Boolean if this node has children. */
        children: [],         /** Array of children. */
        data: {},             /** Additional data to attach to the node. */
        level: 0,             /** The level of this node. */
        odd: false,           /** The odd/even state of this row. */
        checked: false,       /** If this node is checked. */
        busy: false,          /** If this node is busy. */
        display: $(),         /** The display of this node. */
        input: $(),           /** The input display. */
        link: $(),            /** The link display. */
        span: $(),            /** The span display. */
        childlist: $()        /** The childlist display. */
      }, nodeparams);

      // Say that we are a TreeNode.
      this.isTreeNode = true;
    };

    /**
     * Set the busy cursor for this node.
     */
    TreeNode.prototype.setBusy = function(state) {
      if (state != this.span.hasClass('treebusy')) {
        this.busy = state;
        if (state) {
          this.span.addClass('treebusy');
        }
        else {
          this.span.removeClass('treebusy');
        }
      }
    };

    /**
     * Determines if this node is already loaded.
     */
    TreeNode.prototype.isLoaded = function() {
      var loaded = this.nodeloaded;
      loaded |= loadedNodes.hasOwnProperty(this.id);
      loaded |= !this.has_children;
      loaded |= (this.has_children && this.children.length > 0);
      return loaded;
    };

    /**
     * Loads the current node.
     *
     * @param {function} callback - The callback when the node is loaded.
     */
    TreeNode.prototype.loadNode = function(callback, hideBusy) {

      // Only load if we have not loaded yet.
      if (params.load && !this.isLoaded()) {

        // Make this node busy.
        if (!hideBusy) {
          this.setBusy(true);
        }

        // Call the load function.
        params.load(this, function(node) {

          // Say this node is loaded.
          node.nodeloaded = true;

          // Add to the loaded nodes array.
          loadedNodes[node.id] = node.id;

          // Build the node.
          node.build();

          // Callback that we are loaded.
          if (callback) {
            callback(node);
          }

          // Say we are not busy.
          if (!hideBusy) {
            node.setBusy(false);
          }
        });
      }
      else if (callback) {

        // Just callback since we are already loaded.
        callback(this);
      }
    };

    /**
     * Recursively loads and builds all nodes beneath this node.
     *
     * @param {function} callback Called when the tree has loaded.
     * @param {function} operation Allow someone to perform an operation.
     */
    TreeNode.prototype.loadAll = function(callback, operation, hideBusy) {

      // Make sure we are loaded first.
      this.loadNode(function(node) {

        // See if an operation needs to be performed.
        if (operation) {
          operation(node);
        }

        // Get our children count.
        var i = node.children.length, count = i;

        // If no children, then just call the callback immediately.
        if (!i) {
          if (callback) {
            callback(node);
          }
          return;
        }

        // Make this node busy.
        if (!hideBusy) {
          node.setBusy(true);
        }

        // Iterate through each child.
        while (i--) {

          // Load this childs children...
          node.children[i].loadAll(function() {

            // Decrement the child count.
            count--;

            // If all children are done loading, call the callback.
            if (!count) {

              // Callback that we are done loading this tree.
              if (callback) {
                callback(node);
              }

              // Make this node busy.
              if (!hideBusy) {
                node.setBusy(false);
              }
            }
          }, operation, hideBusy);
        }
      });
    };

    /**
     * Expands the node.
     */
    TreeNode.prototype.expand = function(state) {
      this.checked = this.input.is(':checked');
      if (state) {
        this.link.removeClass('collapsed').addClass('expanded');
        this.span.removeClass('collapsed').addClass('expanded');
        this.childlist.show('fast');
      }
      // We don't wan't to collapse if they can't open it back up.
      else if (this.span.length > 0) {
        this.link.removeClass('expanded').addClass('collapsed');
        this.span.removeClass('expanded').addClass('collapsed');
        this.childlist.hide('fast');
      }

      // If the state is expand, but the children have not been loaded.
      if (state && !this.isLoaded()) {

        // If there are no children, then we need to load them.
        this.loadNode(function(node) {
          if (node.checked) {
            node.select(node.checked);
          }
          node.expand(true);
        });
      }
    };

    /**
     * Selects all children of this node.
     */
    TreeNode.prototype.selectChildren = function(state) {
      var i = this.children.length;
      while (i--) {
        this.children[i].select(state, true);
      }
    };

    /**
     * Check this node.
     */
    TreeNode.prototype.check = function(state) {

      // Set the checked state.
      this.checked = state;

      // Make sure the input is checked accordingly.
      this.input.attr('checked', state);

      // Select this node.
      if (params.selected) {
        params.selected(this, true);
      }
    };

    /**
     * Selects a node.
     */
    TreeNode.prototype.select = function(state, child) {

      // Set the checked state.
      this.checked = state;

      // Make sure the input is checked accordingly.
      this.input.attr('checked', state);

      // If they wish to deep load then do that here.
      if (this.checked && params.deepLoad) {

        // Load all nodes underneath this node.
        this.loadAll(function(node) {

          // Now select the children.
          node.selectChildren(state);
          if (params.selected) {
            params.selected(node, !child);
          }
        });
      }
      else {

        // Now select the children.
        this.selectChildren(state);
        if (params.selected) {
          params.selected(this, !child);
        }
      }
    }

    /**
     * Build the list element.
     */
    TreeNode.prototype.build_list = function() {
      var list = $();
      list = $(document.createElement('li'));
      list.addClass(this.odd ? 'odd' : 'even');
      return list;
    };

    /**
     * Build the input and return.
     */
    TreeNode.prototype.build_input = function(left) {

      // Only add an input if the input name is defined.
      if (params.inputName) {

        // Create the input element.
        this.input = $(document.createElement('input'));

        // Get the value for this input item.
        var value = this.value || this.id;

        // Create the attributes for this input item.
        this.input.attr({
          'type': 'checkbox',
          'value': value,
          'name': params.inputName + '-' + value,
          'checked': this.checked
        });
        this.input.css('left', left + 'px');
        this.input.bind('click', (function(node) {
          return function(event) {

            // Determine if the input is checked.
            var checked = $(event.target).is(':checked');

            // Expand if checked.
            node.expand(checked);

            // Call the select method.
            node.select(checked);
          };
        })(this));

        // If this is a root item, then just hide the input.
        if (this.root) {
          this.input.hide();
        }
      }
      return this.input;
    };

    /**
     * Creates a node link.
     */
    TreeNode.prototype.build_link = function(element) {
      element.css('cursor', 'pointer').addClass('collapsed');
      element.bind('click', {node: this}, function(event) {
        event.preventDefault();
        event.data.node.expand($(event.target).hasClass('collapsed'));
      });
      return element;
    }

    /**
     * Build the span +/- symbol.
     */
    TreeNode.prototype.build_span = function(left) {

      // If we are not root, and we have children, show a +/- symbol.
      if (!this.root && this.has_children) {
        this.span = this.build_link($(document.createElement('span')).attr({
          'class': 'treeselect-expand'
        }));
        this.span.css('left', left + 'px');
      }
      return this.span;
    };

    /**
     * Build the title link.
     */
    TreeNode.prototype.build_title = function(left) {

      // If there is a title, then build it.
      if (!this.root && this.title) {

        // Create a node link.
        this.nodeLink = $(document.createElement('a')).attr({
          'class': 'treeselect-title',
          'href': this.url,
          'target': '_blank'
        }).css('marginLeft', left + 'px').text(this.title);

        // If this node has children, then it should be a link.
        if (this.has_children) {
          this.link = this.build_link(this.nodeLink.clone());
        }
        else {
          this.link = $(document.createElement('div')).attr({
            'class': 'treeselect-title'
          }).css('marginLeft', left + 'px').text(this.title);
        }
      }

      // Return the link.
      return this.link;
    };

    /**
     * Build the children.
     */
    TreeNode.prototype.build_children = function() {

      // Create the childlist element.
      this.childlist = $();

      // If this node has children.
      if (this.children.length > 0) {

        // Create the child list.
        this.childlist = $(document.createElement('ul'));

        // Set the odd state.
        var odd = this.odd;

        // Now if there are children, iterate and build them.
        for (var i in this.children) {

          // Make sure the child is a valid object in the list.
          if (this.children.hasOwnProperty(i)) {

            // Alternate the odd state.
            odd = !odd;

            // Create a new TreeNode for this child.
            this.children[i] = new TreeNode($.extend(this.children[i], {
              level: this.level + 1,
              odd: odd,
              checked: this.checked
            }));

            // Now append the built children to this list.
            this.childlist.append(this.children[i].build());
          }
        }
      }

      // Return the childlist.
      return this.childlist;
    };

    /**
     * Builds the DOM and the tree for this node.
     */
    TreeNode.prototype.build = function() {

      // Keep track of the left margin for each element.
      var left = 5, elem = null;

      // Create the list display.
      if (this.display.length == 0) {
        this.display = this.build_list();
      }

      // Now append the input.
      if ((this.input.length == 0) &&
          (elem = this.build_input(left)) &&
          (elem.length > 0)) {

        // Add the input to the display.
        this.display.append(elem);
        left += params.colwidth;
      }

      // Now create the +/- sign if needed.
      if (this.span.length == 0) {
        this.display.append(this.build_span(left));
        left += params.colwidth;
      }

      // Now append the node title.
      if (this.link.length == 0) {
        this.display.append(this.build_title(left));
      }

      // Append the children.
      if (this.childlist.length == 0) {
        this.display.append(this.build_children());
      }

      // See if they wish to alter the build.
      if (params.onbuild) {
        params.onbuild(this);
      }

      // Create a search item.
      this.searchItem = this.display.clone();
      $('.treeselect-expand', this.searchItem).remove();

      // If the search title is not a link, then make it one...
      var searchTitle = $('div.treeselect-title', this.searchItem);
      if (searchTitle.length > 0) {
        searchTitle.replaceWith(this.nodeLink);
      }

      // See if they wish to hook into the postbuild process.
      if (params.postbuild) {
        params.postbuild(this);
      }

      // Return the display.
      return this.display;
    };

    /**
     * Returns the selectAll text if that applies to this node.
     */
    TreeNode.prototype.getSelectAll = function() {
      if (this.root && this.selectAll) {
        return this.selectAllText;
      }
      return false;
    };

    /**
     * Sets the defaults for this node.
     *
     * @param {function} callback Called all defaults are set.
     */
    TreeNode.prototype.setDefault = function(defaults, callback) {

      // Make sure the defaults is set.
      if (!jQuery.isEmptyObject(defaults)) {

        // Load all nodes and apply a default to them.
        this.loadAll(function(node) {
          if (callback) {
            callback(node);
          }
        }, function(node) {
          if (defaults.hasOwnProperty(node.value) ||
              defaults.hasOwnProperty(node.id)) {
            node.check(true);
          }
        });
      }
      else if (callback) {
        callback(this);
      }
    };

    /**
     * Search this node for matching text.
     *
     * @param {string} text The text to search for.
     * @param {function} callback Called with the results of this search.
     */
    TreeNode.prototype.search = function(text, callback) {
      // If no text was provided, then just return the root children.
      if (!text) {
        if (callback) {
          callback(this.children, false);
        }
      }
      else {

        // Initialize our results.
        var results = {};

        // Convert the text to lowercase.
        text = text.toLowerCase();

        // Load all nodes.
        this.loadAll(function(node) {

          // Callback with the results of this search.
          if (callback) {
            callback(results, true);
          }
        }, function(node) {

          // If we are not the root node, and the text matches the title.
          if (!node.root && node.title.toLowerCase().search(text) !== -1) {

            // Add this to our search results.
            results[node.id] = node;
          }
        }, true);
      }
    };

    // Iterate through each instance.
    return $(this).each(function() {

      // Get the tree node parameters.
      var treeParams = $.extend(params, {display: $(this)});

      // Create a root tree node and load it.
      var root = this.treenode = new TreeNode(treeParams, true);

      // Add a select all link.
      var selectAll = root.getSelectAll();
      if (selectAll !== false) {

        // Create an input that will select all children if selected.
        root.display.append($(document.createElement('input')).attr({
          'type': 'checkbox'
        }).bind('click', (function(node) {
          return function(event) {
            node.selectChildren($(event.target).is(':checked'));
            if (params.selected) {
              params.selected(node, true);
            }
          };
        })(root)));

        // If they provided select all text, add it here.
        if (selectAll) {
          var span = $(document.createElement('span')).html(selectAll);
          root.display.append(span);
        }
      }

      // Load the node.
      root.loadNode(function(node) {

        if (node.children.length == 0) {

          // If the root node does not have any children, then hide.
          node.display.hide();
        }

        // If this node is checked, then check it.
        if (node.checked) {
          node.select(node.checked);
        }

        // Expand this root node.
        node.expand(true);

        // Now set the defaults.
        node.setDefault(params.default_value, function(node) {
          if (params.treeloaded) {
            params.treeloaded(node);
          }
        });
      });
    });
  };
})(jQuery);
