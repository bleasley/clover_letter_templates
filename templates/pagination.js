function fixDocument() {
  // We limit the number of fixes to 100, more as an escape hatch than anything
  // else from an infinite loop of errant fixes. We assume that we will not
  // want to paginate anything longer than 100 pages.
  for (var i = 0; i < 100; i++) {
    var previousLength = $('.page').length;

    // Try to "fix" the document by moving overflowing content to a new page
    moveContentToNextPage($('.page')[previousLength - 1]);
    console.log("Moving page");

    var newLength = $('.page').length;

    if (previousLength === newLength) {
      // If we maintain the same page length after the fix, then we're done. We
      // can return now.
      return;
    }
  }
}

function getElementFromSelector(selector) {
  return selector.length ? selector[0] : selector;
  console.log("Selecting: " + selector);
}



function isOverflowed(page) {
  var pageElement = getElementFromSelector($(page));
  console.log("Page " + page + " is overflowed: " + (pageElement.scrollHeight > pageElement.clientHeight));
  return pageElement.scrollHeight > pageElement.clientHeight;
}




function renderNewPage(children) {
  console.log("Rendering new page");
  var source   = $('#page-template').html();
  var template = Handlebars.compile(source);
  var context = {
    content: children.reduce(function (prev, curr) {
      return prev + curr.outerHTML;
    }, '')
  };
  return template(context);
}




function processPageBreaks(page) {
  var messageSelector = $(page).find('.message-content');
  var childrenToMove = [];

  // First scan down for a page-break
  var pageBreak = $(messageSelector).find('.page-break');
  console.log (pageBreak);
  if (pageBreak.length === 0) {
    console.log("No page breaks found");
    return false;
  }

  while (true) {
    var lastChild = messageSelector.children().last();
    var lastChildElement = getElementFromSelector(lastChild);
    $(lastChildElement).remove();
    if (lastChildElement === pageBreak[0]) {
      $('.document').append(renderNewPage(childrenToMove));
      return true;
    }
    childrenToMove.unshift(lastChildElement);
  }
}




function moveContentToNextPage(page) {
  // First scan down for a page-break
  if (processPageBreaks(page)) {
    return;
  }
  // don't bother if there's no overflow
  if (!isOverflowed(page)) {
    return;
  }

  console.log("Moving to new page");
  var messageSelector = $(page).find('.message-content');

  var childrenToMove = [];

  // start removing elements until they fit on one page
  while (isOverflowed(page)) {
    var lastChild = messageSelector.children().last();

    var lastChildElement = getElementFromSelector(lastChild);

    $(lastChildElement).remove();

    childrenToMove.unshift(lastChildElement);
  }

  // try to split the paragraph into two
  var elementToSplit = childrenToMove[0];

  var testElement = $(elementToSplit).clone();

  if (!testElement.hasClass('disable-split') && testElement.text().length > 0) {
    console.log("Handling no-split text");
    var textToMove = [];

    messageSelector.append(testElement);

    // start removing words until they fit on one page
    while (isOverflowed(page) && testElement.text().length > 0) {
      var elementText = testElement.text();
      var lastSpaceIndex = elementText.lastIndexOf(' ');

      var textToKeep, textToRemove;

      if (lastSpaceIndex >= 0) {
        textToKeep = elementText.substring(0, lastSpaceIndex);
        textToRemove = elementText.substring(lastSpaceIndex);
      } else {
        // no spaces, just move the entire thing forward
        textToKeep = '';
        textToRemove = elementText;
      }

      testElement.text(textToKeep);

      textToMove.unshift(textToRemove);
    }

    // we ended up moving/not moving the entire paragraph, we can't split, so don't do anything
    var shouldNotSplit = testElement.text().length === 0 || textToMove.length === 0;

    // if we're only going to move spaces, don't move anything
    // var shouldNotSplit = shouldNotSplit || textToMove.filter(function (item) {
    //   return item !== ' ';
    // }).length === 0;
    if (shouldNotSplit) {
      testElement.remove();
    } else {
      var replacementText = textToMove.reduce(function (prev, curr) {
        return prev + curr;
      }, '');

      $(elementToSplit).text(replacementText);
    }
  }

  // render removed elements
  var html = renderNewPage(childrenToMove);

  $('.document').append(html);

}



function makePagination() {
  console.log("Rendering pagination");
  var totalPages = $('.page').length;
  $('.footer-page-current').each(function (i, el) {
    $(el).text(i+1);
    console.log("Reducing footer: (" + i + ", " + el + ")");
  });
  $('.footer-page-total').text(totalPages);
}

$(document).ready(function () {
  fixDocument();
  makePagination();
});
