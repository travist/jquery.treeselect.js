/**
 *  moreorless.js - Developed by Travis Tidwell
 *
 *  http://github.com/travist/moreorless.js
 *
 *  Description:  This is an easy to use script that will make any element show
 *  more or less content.
 *
 *  License:  GPL version 3.
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the "Software"), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.

 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */
(function($) {
  jQuery.fn.moreorless = function(min_height, more_text, less_text) {

    // Default the parameters.
    min_height = min_height || 100;
    more_text = more_text || "more";
    less_text = less_text || "less";

    // Iterate over each element.
    this.each( function() {

      // Define all the elements of interest.
      this.element = $(this);
      this.div_height = 0;

      // Create the link.
      if (!this.link) {
        this.link = $(document.createElement('div')).css({cursor: 'pointer'});
        this.link.addClass('moreorless_link');
      }

      // Set the content.
      if (!this.content) {
        this.content = this.element.wrap('<div></div>').parent();
        this.content.addClass("moreorless_content expanded");
      }

      // Create a wrapper.
      if (!this.wrapper) {
        this.wrapper = this.content.wrap('<div></div>').parent();
        this.wrapper.addClass('moreorless_wrapper').css('position', 'relative');
      }

      /**
       * Expands or de-expands the content area.
       *
       * @param {boolean} expand true - Expand, false - Unexpand.
       */
      this.expand = function(expand, fromClick) {
        if (fromClick) {
          this.forceExpand = expand;
        }
        if (expand) {
          this.link.html(less_text);
          this.content.addClass('expanded').animate({
            height: this.div_height
          }, (function(content) {
            return function() {
              content.css('overflow', '').height('inherit');
            };
          })(this.content));
        }
        else {
          this.link.html(more_text);
          this.content.removeClass('expanded').animate({
            height: min_height
          }, (function(content) {
            return function() {
              content.css('overflow', 'hidden');
            };
          })(this.content));
        }
        return this.content;
      };

      /**
       * Check the height of the content.
       */
      this.checkHeight = function() {
        if (this.div_height > min_height) {
          if (!this.forceExpand) {
            this.bindLink();
            this.expand(false);
            this.content.after(this.link);
          }
        }
        else {
          this.expand(true);
          this.link.remove();
        }
      };

      /**
       * Binds the more or less link.
       */
      this.bindLink = function() {
        if (this.link.length > 0) {
          // Bind to when the link is clicked.
          this.link.unbind().bind('click', (function(widget) {
            return function(event) {
              event.preventDefault();
              event.stopPropagation();
              widget.expand(!widget.content.hasClass('expanded'), true);
            };
          })(this));
        }
      };

      /**
       * Create a function to set the new height of the element.
       */
      this.setElementHeight = function() {
        this.div_height = this.element.height();
        this.checkHeight();
      };

      // Trigger when resize events occur, but don't trigger to fast.
      var resizeTimer = 0;
      $(window).unbind('resize').bind('resize', (function(widget) {
        return function () {
          clearTimeout(resizeTimer);
          resizeTimer = setTimeout(function() {
            widget.setElementHeight();
          }, 100);
        };
      })(this));
      this.element.unbind('resize').bind('resize', (function(widget) {
        return function() {
          clearTimeout(resizeTimer);
          resizeTimer = setTimeout(function() {
            widget.setElementHeight();
          }, 100);
        };
      })(this));

      // Set the element height.
      this.setElementHeight();
    });
  }
})(jQuery);