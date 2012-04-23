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

          // Say we are not busy.
          node.setBusy(false);

          // Callback that we are loaded.
          if (callback) {
            callback(node);
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

              // Make this node busy.
              node.setBusy(false);

              // Callback that we are done loading this tree.
              callback(node);
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
(function($) {

  /**
   * This adds a Chosen style selector for the tree select widget.
   *
   * This widget requires chosen.css.
   */
  $.fn.chosentree = function(params) {

    // Setup the default parameters.
    params = $.extend({
      inputId: 'chosentree-select',  /** The input element ID and NAME. */
      width: 450,                    /** The width of this widget. */
      title: '',                     /** The title to add to the input. */
      description: '',               /** The description to add to the input. */
      default_text: 'Select Item',   /** The default text within the input. */
      loaded: null,                  /** Called when all items are loaded. */
      collapsed: true                /** If the tree should be collapsed. */
    }, params);

    // Iterate through each instance.
    return $(this).each(function() {

      // Keep track of the treeselect.
      var selector = null;
      var choices = null;
      var search = null;
      var input = null;
      var title = null;
      var description = null;
      var treeselect = null;
      var treewrapper = null;
      var selectedTimer = 0;

      // Show or hide the tree.
      function showTree(show, tween) {
        tween = tween || 'fast';
        if (show) {
          treewrapper.addClass('treevisible').show('fast');
        }
        else {
          treewrapper.removeClass('treevisible').hide('fast');
        }
      }

      // Create the selector element.
      selector = $(document.createElement('div'));
      selector.addClass('chzn-container chzn-container-multi');

      // Create the choices.
      choices = $(document.createElement('ul'));
      choices.addClass('chzn-choices chosentree-choices');

      // Create the search element.
      search = $(document.createElement('li'));
      search.addClass('search-field');

      // If they wish to have a title.
      title = $(document.createElement('label'));
      title.attr({
        'for': params.inputId
      });
      title.text(params.title);

      // If they wish to have a description.
      description = $(document.createElement('div'));
      description.attr({
        'class': 'description'
      });
      description.text(params.description);

      // Create the input element.
      input = $(document.createElement('input'));
      input.attr({
        'type': 'text',
        'name': params.inputId,
        'id': params.inputId,
        'value': params.default_text,
        'class': 'default',
        'autocomplete': 'off'
      });
      input.css('width', '100%');
      input.focus(function(event) {
        showTree(true);
      });

      // Creat the chosen selector.
      selector.append(title).append(choices.append(search.append(input)));

      treewrapper = $(document.createElement('div'));
      treewrapper.addClass('treewrapper');
      treewrapper.css('width', params.width + 'px');
      treewrapper.hide();

      // Get the tree select.
      treeselect = $(document.createElement('div'));
      treeselect.addClass('treeselect');

      // Setup the keyevents.
      $(this).keyup(function(event) {
        if (event.which == 27) {
          showTree(false);
        }
      });

      // Add the treeselect widget.
      $(this).append(selector.append(treewrapper.append(treeselect)));

      // Add the description.
      $(this).append(description);

      // Now declare the treeselect.
      var treeparams = params;

      // Reset the selected callback.
      treeparams.selected = (function(chosentree) {
        return function(node, root) {
          if (node.checked) {

            // Get and add a new choice.
            var choice = $(document.createElement('li'));
            choice.addClass('search-choice');
            choice.attr('id', 'choice_' + node.id);

            // Add the node data to this choice.
            choice.eq(0)[0].nodeData = node;

            var span = $(document.createElement('span'));
            span.text(node.title);

            var close = $(document.createElement('a'));
            close.addClass('search-choice-close');
            close.attr('href', 'javascript:void(0)');

            // Bind when someone clicks on the close button.
            close.bind('click', function(event) {

              // Prevent the default.
              event.preventDefault();

              // Remove the choice.
              $('li#choice_' + node.id, choices).remove();

              // Deselect this node.
              node.select(false);
            });

            // Add this to the choices.
            search.before(choice.append(span).append(close));
          }
          else {

            // If not selected, then remove the choice.
            $('li#choice_' + node.id, choices).remove();
          }

          // Make sure we don't do this often for performance.
          if (root) {

            // Get all of the nodes that are selected.
            var nodes = [];
            chosentree.value = {};

            // Show the choices.
            choices.show();

            // Add the selected items to the choices.
            $('li.search-choice', choices).each(function() {
              chosentree.value[this.nodeData.id] = this.nodeData.value;
              nodes.push(this.nodeData);
            });

            // Show more or less.
            if (jQuery.fn.moreorless) {

              // Add this to the choices.
              choices.moreorless(100, '+' + nodes.length + ' more');
            }

            // If they wish to know when it is loaded.
            if (treeparams.loaded) {

              // Call our callback with all the nodes.
              treeparams.loaded(nodes);
            }

            // Trigger an event.
            $(chosentree).trigger('treeloaded');
          }
        };
      })(this);

      // Now declare our treeselect control.
      $(treeselect).treeselect(treeparams);

      // Show the tree by default.
      if (!treeparams.collapsed) {
        choices.hide();
        showTree(true, null);
      }
    });
  };
})(jQuery);
