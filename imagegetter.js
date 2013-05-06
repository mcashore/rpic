var IMGUR_URL = /^(http:\/\/){0,1}(www\.){0,1}(i\.){0,1}imgur\.com/;
var IMGUR_IMAGE_PATH = ".//div[@id='image']//a";

function xpath(xpat, node) {
  return document.evaluate(xpat, node, null, XPathResult.ANY_TYPE, null);
}

/**
 * get the direct image URL from an imgur website
 */
function imgurURL(url) {
  var match = url.match(IMGUR_URL);
  if(!match) return;
  var resultUrl = null;

  if(match[3]) { // "i.imgur.com"
    return resultUrl = url;
  } else {
    $.ajax({
      url: url,
      sucess: function(html) {
        resultUrl = null;
      },
      async: false
    });
  }
  return resultUrl;
}