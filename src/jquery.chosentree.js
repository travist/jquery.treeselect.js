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
      showtree: false,                  /** To show the tree. */
      selected: null,                   /** Callback when a node was selected, returns the selected node. */
      selectedAll: null                 /** Callback after all nodes were selected, returns object with all selected nodes. */
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
      var description = null;
      var treeselect = null;
      var treewrapper = null;
      var selectedTimer = 0;
      var root = null;

      // Show or hide the tree.
      var showTree = function(show, tween) {
        tween = tween || 'fast';
        if (show && (!root || root.has_children)) {
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

                  // Add class if input checkbox is enabled.
                  if (params.inputName !== '') {
                    root.childlist.addClass('input-enabled');
                  }
                  else {
                    root.childlist.removeClass('input-enabled');
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
            search_btn.addClass('button chosentree-search-btn');
            search_btn.bind('click', function(event) {
              event.preventDefault();
              doSearch(input.val());
            });

            // Make sure to do a search.
            jQuery(document).bind('keydown', function(event) {
              if ((event.keyCode == 13) && input.is(':focus')) {
                event.preventDefault();
                doSearch(input.val());
              }
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
      treewrapper.append(treeselect);
      $(this).append(selector.append(treewrapper));

      // Add the description.
      $(this).append(description);

      // Now declare the treeselect.
      var treeparams = params;

      // Declare the callback function for selected node(s)
      var singleSelectedNodeCallback = params.selected;
      var selectingCompleteCallback = params.selectedAll;
      
      // Reset the selected callback.
      treeparams.selected = (function(chosentree) {

        // Keep track of the selected nodes.
        var selectedNodes = {};

        // The node callback.
        return function(node, direct) {

          // If this is a valid node.
          if (node.id) {

            // Get the existing choices.
            var selected_choice = $('li#choice_' + node.id, choices);

            // Add the choice if not already added.
            if (node.checked) {

              // If the choice is already selected, remove it.
              if (selected_choice.length !== 0) {
                selected_choice.remove();
              }

              // Add this to the selected nodes.
              selectedNodes[node.id] = node;

              //Call given callback function for a single selected node
              if(!direct && singleSelectedNodeCallback !== null) {
                singleSelectedNodeCallback(node);              
              }              
            }
            else if (!node.checked) {

              // If not selected, then remove the choice.
              selected_choice.remove();
            }
          }

          // If we are done selecting.
          if (direct) {

            // Set the chosentree value.
            chosentree.value = {};

            // Callback to close the chosen selector.
            var closeChosen = function(node) {
              return function(event) {

                // Prevent the default.
                event.preventDefault();

                // Get the node data.
                node = this.parentNode.nodeData;

                // Remove the choice.
                $('li#choice_' + node.id, choices).remove();

                // Deselect this node.
                node.selectChildren(false);
              };
            };            

            // Iterate through all the selected nodes.
            for (var id in selectedNodes) {

              // Set the node.
              node = selectedNodes[id];

              // Add to the chosen tree value.
              chosentree.value[id] = node;

              // Get and add a new choice.
              var choice = $(document.createElement('li'));
              choice.addClass('search-choice');
              choice.attr('id', 'choice_' + node.id);

              // Add the node data to this choice.
              choice.eq(0)[0].nodeData = node;

              var span = $(document.createElement('span'));

              // If including children below, add text to the title to say so.
              if (!params.deepLoad && node.include_children) {
                span.text(node.title + ' (All below)');
              }
              else {
                span.text(node.title);
              }

              // Don't allow them to remove the root element unless it is
              // visible and has children.
              var close = '';
              if (!node.root || (node.showRoot && node.has_children)) {
                close = $(document.createElement('a'));
                close.addClass('search-choice-close');
                close.attr('href', '#');
                close.bind('click', closeChosen(node));
              }

              // Add this to the choices.
              if (choices) {
                choices.prepend(choice.append(span).append(close));
              }
            }


            //Call given callback function for all selected nodes
            if(node.checked && selectingCompleteCallback !== null) {
              selectingCompleteCallback(selectedNodes);              
            }

            if (choices) {
              // Only show the choices if they are not visible.
              if (!choices.is(':visible')) {

                // Show the choices.
                choices.show();
              }

              // Reset the selected nodes.
              selectedNodes = {};

              // Don't show the default value if the root has not children.
              if (input && node.children.length === 0) {
                input.attr({'value': ''});
              }

              // Show more or less.
              if (jQuery.fn.moreorless) {

                // Get how many nodes there are.
                var numNodes = $('li.search-choice', choices).length;

                // Add this to the choices.
                var more_text = params.more_text.replace('%num%', numNodes);
                choices.moreorless(params.min_height, more_text);
                if (!choices.div_expanded) {
                  showTree(true, null);
                }
              }
            }

            // If they wish to know when it is loaded.
            if (treeparams.loaded) {

              // Call our callback with the loaded node.
              treeparams.loaded(node);
            }

            // Trigger an event.
            $(chosentree).trigger('treeloaded');
          }                    
        };
      })(this);

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
