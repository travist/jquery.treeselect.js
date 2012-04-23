jQuery TreeSelect widget
==================================

This widget is used for transforming a hierarchy HTML lists with
input's into a hierarchial tree select tool.  You can also call this widget
with a structured JSON list and it will convert it to an HTML hierarchy select
tool of those items.

Live Example
----------------------------------

Go to http://travist.github.com/jquery.treeselect.js to see a live demo of this
widget!

Usage
----------------------------------
```
<html>
  <head>
    <script type='text/javascript' src="https://ajax.googleapis.com/ajax/libs/jquery/1.5.2/jquery.js"></script>
    <script type='text/javascript' src='lib/jquery.moreorless.js/jquery.moreorless.js'></script>
    <script type='text/javascript' src='js/jquery.treeselect.js'></script>
    <script type='text/javascript' src='js/jquery.chosentree.js'></script>
    <link rel='stylesheet' type='text/css' href='lib/jquery.moreorless.js/moreorless.css' />
    <link rel='stylesheet' type='text/css' href='css/treeselect.css' />
    <link rel='stylesheet' type='text/css' href='css/chosen.css' />
    <script type='text/javascript'>
    jQuery(function() {
      $('div.chosentree').chosentree({
        width: 500,
        deepLoad: true,
        load: function(node, callback) {
          /**
           * This would typically call jQuery.ajax to load a new node
           * on your server where you would return the tree structure
           * for the provided node.
           */
        }
      });
    });
  </script>
  </head>
  <body>
    <div class="chosentree"></div>
  </body>
</html>
```
