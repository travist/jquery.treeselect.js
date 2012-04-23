(function($) {

  // The tree select control.
  $.fn.treeselect = function(params) {

    // Setup the default parameters for the tree select control.
    params = $.extend({
      colwidth: 18,           /** The width of the columns. */
      selected: null,         /** Callback when an item is selected. */
      load: null,             /** Callback to load new tree's */
      deepLoad: false         /** Performs a deep load */
    }, params);

    /**
     * Constructor.
     */
    var TreeNode = function(nodeparams) {
      nodeparams.title = nodeparams.title || 'anonymous';
      $.extend(this, {
        id: 0,                /** The ID of this node. */
        value: 0,             /** The input value for this node. */
        title: '',            /** The title of this node. */
        has_children: false,  /** Boolean if this node has children. */
        children: [],         /** Array of children. */
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
    };

    /**
     * Set the busy cursor for this node.
     */
    TreeNode.prototype.setBusy = function(state) {
      if (state != this.busy) {
        this.busy = state;
        if (state) {

          // Create the busy cursor.
          var busy = $(document.createElement('div')).addClass('treebusy');
          busy.text('loading...');

          // If the list exists, then add it before that, otherwise append it
          // to the display.
          var list = $('ul', this.display);
          if (list.length == 0) {
            this.display.append(busy);
          }
          else {
            list.prepend(busy);
          }
        }
        else {

          // Remove the busy cursor.
          $('div.treebusy', this.display).remove();
        }
      }
    };

    /**
     * Determines if this node is already loaded.
     */
    TreeNode.prototype.isLoaded = function() {
      return !(this.has_children && this.children.length === 0);
    };

    /**
     * Loads the current node.
     *
     * @param {function} callback - The callback when the node is loaded.
     */
    TreeNode.prototype.loadNode = function(callback) {

      // Only load if we have not loaded yet.
      if (params.load && (!this.id || !this.isLoaded())) {

        // Make this node busy.
        this.setBusy(true);

        // Call the load function.
        params.load(this, function(node) {

          // Build the node.
          node.build();

          // Callback that we are loaded.
          if (callback) {
            callback(node);
          }

          // Say we are not busy.
          node.setBusy(false);
        });
      }
      else if (callback) {

        // Just callback since we are already loaded.
        callback(this);
      }
    };

    /**
     * Recursively loads and builds all nodes beneath this node.
     */
    TreeNode.prototype.loadAll = function(callback) {

      // Make sure we are loaded first.
      this.loadNode(function(node) {

        // Get our children count.
        var i = node.children.length, count = i;

        // If no children, then just call the callback immediately.
        if (!i) {
          callback(node);
          return;
        }

        // Make this node busy.
        node.setBusy(true);

        // Iterate through each child.
        while (i--) {

          // Load this childs children...
          node.children[i].loadAll(function() {

            // Decrement the child count.
            count--;

            // If all children are done loading, call the callback.
            if (callback && !count) {

              // Callback that we are done loading this tree.
              callback(node);

              // Make this node busy.
              node.setBusy(false);
            }
          });
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
      else {
        this.link.removeClass('expanded').addClass('collapsed');
        this.span.removeClass('expanded').addClass('collapsed');
        this.childlist.hide('fast');
      }

      // If the state is expand, but the children have not been loaded.
      if (state && this.children.length == 0 && this.has_children) {

        // If there are no children, then we need to load them.
        this.loadNode(function(node) {
          node.expand(true);
        });
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

      // Now recursively select the children.
      var i = this.children.length;
      while (i--) {
        this.children[i].select(state, true);
      }

      // Trigger an event that this node was selected.
      if (params.selected) {
        params.selected(this, !child);
      }
    }

    /**
     * Build the list element.
     */
    TreeNode.prototype.build_list = function() {
      var list = $();
      if (this.id) {
        list = $(document.createElement('li'));
        list.addClass(this.odd ? 'odd' : 'even');
      }
      return list;
    };

    /**
     * Build the input and return.
     */
    TreeNode.prototype.build_input = function(left) {
      if (this.id) {
        this.input = $(document.createElement('input'));
        this.input.attr({
          'type': 'checkbox',
          'value': this.value || this.id,
          'name': 'treeselect-' + this.id,
          'checked': this.checked
        });
        this.input.css('left', left + 'px');
        this.input.bind('click', (function(node) {
          return function(event) {

            // Determine if the input is checked.
            var checked = $(event.target).is(':checked');

            // Expand if checked.
            if (checked) {
              node.expand(true);
            }

            // If they wish to deep load then do that here.
            if (checked && params.deepLoad) {

              // Load all nodes underneath this node.
              node.loadAll(function() {

                // Select this node when it is done loading.
                node.select(checked);
              });
            }
            else {

              // Call the select method.
              node.select(checked);
            }
          };
        })(this));
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
      if (this.id && ((this.children.length > 0) || this.has_children)) {
        this.span = this.build_link($(document.createElement('span')));
        this.span.css('left', left + 'px');
      }
      return this.span;
    };

    /**
     * Build the title link.
     */
    TreeNode.prototype.build_title = function(left) {
      if (this.id && this.title) {
        this.link = this.build_link($(document.createElement('a')));
        this.link.css('marginLeft', left + 'px').text(this.title);
      }
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

      // If this is the root node, then load the children.
      if (!this.id && this.children.length === 0) {

        // Load this node.
        this.loadNode(function(node) {
          node.expand(true);
        });
      }
      else {

        // Keep track of the left margin for each element.
        var left = 0;

        // Create the list display.
        if (this.display.length == 0) {
          this.display = this.build_list();
        }

        // Now append the input.
        if (this.input.length == 0) {
          this.display.append(this.build_input(left));
        }

        // Now create the +/- sign if needed.
        if (this.span.length == 0) {
          left += params.colwidth;
          this.display.append(this.build_span(left));
        }

        // Now append the node title.
        if (this.link.length == 0) {
          left += params.colwidth;
          this.display.append(this.build_title(left));
        }

        // Append the children.
        if (this.childlist.length == 0) {
          this.display.append(this.build_children());
        }

        // Check if selected.
        if (this.checked) {
          this.select(this.checked);
        }
      }

      // Return the display.
      return this.display;
    };

    // Iterate through each instance.
    return $(this).each(function() {

      // Create a new tree node.
      new TreeNode($.extend(params, {display: $(this)})).build();

    });
  };
})(jQuery);
