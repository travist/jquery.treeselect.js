(function($) {

  /**
   * This adds a Chosen style selector for the tree select widget.
   *
   * This widget requires chosen.css.
   */
  $.fn.chosentree = function(params) {

    // Setup the default parameters.
    params = $.extend({
      inputId: 'chosentree-select',     /** The input element ID and NAME. */
      label: '',                        /** The label to add to the input. */
      description: '',                  /** The description for the input. */
      input_placeholder: 'Select Item', /** The input placeholder text. */
      input_type: 'text',               /** Define the input type. */
      autosearch: false,                /** If we would like to autosearch. */
      search_text: 'Search',            /** The search button text. */
      no_results_text: 'No results found', /** Shown when no results. */
      min_height: 100,                  /** The miniumum height. */
      more_text: '+%num% more',         /** The text to show in the more. */
      loaded: null,                     /** Called when all items are loaded. */
      collapsed: true,                  /** If the tree should be collapsed. */
      showtree: false                   /** To show the tree. */
    }, params);

    // Iterate through each instance.
    return $(this).each(function() {

      // Keep track of the treeselect.
      var selector = null;
      var choices = null;
      var search = null;
      var input = null;
      var search_btn = null;
      var label = null;
      var loading = null;
      var description = null;
      var treeselect = null;
      var treewrapper = null;
      var selectedTimer = 0;
      var root = null;

      // Show or hide the tree.
      var showTree = function(show, tween) {
        tween = tween || 'fast';
        if (show && (root == null || root.has_children)) {
          treewrapper.addClass('treevisible').show('fast');
        }
        else {
          treewrapper.removeClass('treevisible').hide('fast');
        }
      };

      // Create the selector element.
      selector = $(document.createElement('div'));
      selector.addClass('chzntree-container');
      if (params.input_type == 'search') {
        selector.addClass('chzntree-container-single');
        search = $(document.createElement('div'));
        search.addClass('chzntree-search');
      }
      else {
        selector.addClass('chzntree-container-multi');
        choices = $(document.createElement('ul'));
        choices.addClass('chzntree-choices chosentree-choices');
        search = $(document.createElement('li'));
        search.addClass('search-field');
      }

      // If they wish to have a label.
      label = $(document.createElement('label'));
      label.attr({
        'for': params.inputId
      });
      label.text(params.label);

      // If they wish to have a description.
      description = $(document.createElement('div'));
      description.attr({
        'class': 'description'
      });
      description.text(params.description);

      // Create the input element.
      if (params.input_placeholder) {
        input = $(document.createElement('input'));
        input.attr({
          'type': 'text',
          'placeholder': params.input_placeholder,
          'autocomplete': 'off'
        });
        if (!params.showtree && params.collapsed) {
          input.focus(function(event) {
            showTree(true);
          });
        }

        // Add a results item to the input.
        if (params.input_type == 'search') {

          // Need to make room for the search symbol.
          input.addClass('chosentree-search');

          // Perform the search.
          var doSearch = function(inputValue) {

            // We want to make sure we don't try while it is searching...
            // And also don't want to search if the input is one character...
            if (!input.hasClass('searching') && (inputValue.length !== 1)) {

              // Continue if we have a root node.
              if (root) {

                // Say that we are now searching...
                input.addClass('searching');

                // Search the tree node.
                root.search(inputValue, function(nodes, searchResults) {

                  // Say we are no longer searching...
                  input.removeClass('searching');

                  // Iterate over the nodes and append them to the search.
                  var count = 0;
                  root.childlist.children().detach();

                  // Add a class to distinguish if this is search results.
                  if (searchResults) {
                    root.childlist.addClass('chzntree-search-results');
                  }
                  else {
                    root.childlist.removeClass('chzntree-search-results');
                  }

                  // Iterate through our nodes.
                  for (var i in nodes) {
                    count++;

                    // Use either the search item or the display.
                    if (searchResults) {
                      root.childlist.append(nodes[i].searchItem);
                    }
                    else {
                      root.childlist.append(nodes[i].display);
                    }
                  }

                  if (!count) {
                    var txt = '<li>' + params.no_results_text + '</li>';
                    root.childlist.append(txt);
                  }
                });

                // A search was performed.
                return true;
              }
            }

            // A search was not performed.
            return false;
          };

          // If they wish to autosearch.
          if (params.autosearch) {

            // Keep track of a search timeout.
            var searchTimeout = 0;

            // Bind to the input when they type.
            input.bind('input', function inputSearch() {
              if (!doSearch(input.val())) {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(inputSearch, 1000);
              }
            });

            // Add the autosearch.
            search.addClass('autosearch');
          }
          else {
            search_btn = $(document.createElement('input'));
            search_btn.attr({
              'type': 'button',
              'value': params.search_text
            });
            search_btn.addClass('chosentree-search-btn');
            search_btn.bind('click', function(event) {
              event.preventDefault();
              doSearch(input.val());
            });

            // Add the autosearch.
            search.addClass('manualsearch');
          }
        }
        else {

          // Add the results class.
          input.addClass('chosentree-results');
        }

        search.append(input);

        // Append the search button if it exists.
        if (search_btn) {
          search.append(search_btn);
        }
      }

      // Creat the chosen selector.
      if (choices) {
        selector.append(label).append(choices.append(search));
      }
      else {
        selector.append(label).append(search);
      }

      treewrapper = $(document.createElement('div'));
      treewrapper.addClass('treewrapper');
      treewrapper.hide();

      // Create a loading span.
      loading = $(document.createElement('span')).attr({
        'class': 'tree-loading treebusy'
      }).css('display', 'block');

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
      treewrapper.append(treeselect.append(loading));
      $(this).append(selector.append(treewrapper));

      // Add the description.
      $(this).append(description);

      // Now declare the treeselect.
      var treeparams = params;

      // Reset the selected callback.
      treeparams.selected = (function(chosentree) {
        return function(node, direct) {

          // Get the existing choices.
          var selected_choice = $('li#choice_' + node.id, choices);

          // Only add if this node is valid.
          if (node.id) {

            // Add the choice if not already added.
            if (node.checked && (selected_choice.length == 0)) {

              // Get and add a new choice.
              var choice = $(document.createElement('li'));
              choice.addClass('search-choice');
              choice.attr('id', 'choice_' + node.id);

              // Add the node data to this choice.
              choice.eq(0)[0].nodeData = node;

              var span = $(document.createElement('span'));
              span.text(node.title);

              // Don't allow them to remove the root element unless it is
              // visible and has children.
              if (!node.root || (node.showRoot && node.has_children)) {
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
              }

              // Add this to the choices.
              search.before(choice.append(span).append(close));
            }
            else if (!node.checked) {

              // If not selected, then remove the choice.
              selected_choice.remove();
            }
          }

          // Make sure we don't do this often for performance.
          if (direct) {

            // Get all of the nodes that are selected.
            var nodes = [];
            chosentree.value = {};

            // Show the choices.
            choices.show();

            // Don't show the default value if the root has not children.
            if (input && node.children.length == 0) {
              input.attr({'value': ''});
            }

            // Add the selected items to the choices.
            $('li.search-choice', choices).each(function() {
              chosentree.value[this.nodeData.id] = this.nodeData.value;
              nodes.push(this.nodeData);
            });

            // Show more or less.
            if (jQuery.fn.moreorless) {

              // Add this to the choices.
              var more_text = params.more_text.replace('%num%', nodes.length);
              choices.moreorless(params.min_height, more_text);
              if (!choices.div_expanded) {
                showTree(true, null);
              }
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

      // Add the treeloaded event.
      treeparams.treeloaded = function(node) {
        loading.remove();
      };

      // Now declare our treeselect control.
      treeselect.treeselect(treeparams);
      root = treeselect.eq(0)[0].treenode;

      // Show the tree by default.
      if (treeparams.showtree || !treeparams.collapsed) {
        showTree(true, null);
      }
    });
  };
})(jQuery);
