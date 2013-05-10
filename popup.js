var LINK_XPATH = ".//div[@class='content']//div[@id='siteTable']/div[@class!='clearleft']";
var IMG_XPATH = ".//a[@class='title ']";//["./a", ".//a[@class='title ']"];
var TITLE_XPATH = ".//a[@class='title ']";//[".//a[@class='title ']"]

var EXT_IMG_WIDTH = 750;
var EXT_IMG_HEIGHT = 525;

var subreddits = [];

/**
 * subredditImgLinks maps subreddits to unseen imgur links from that subreddit
 */
var subredditImgLinks = new Object();
var remainingSubImgLinks = new Object();

/* nextSubredditUrls maps a subreddit to the URL where we will find the next
 * batch of images for that subreddit */
var nextSubredditUrls;

/**
 * RedditLink: A structure to keep track of details for a link
 */
function RedditLink(imgUrl, linkTitle, subreddit) {
  this.imgUrl = imgUrl;
  this.linkTitle = linkTitle;
  this.subreddit = subreddit;
}

function generateSubredditUrls() {
  nextSubredditUrls = new Object();
  for(i = 0; i < subreddits.length; i++) {
    nextSubredditUrls[subreddits[i]] = "http://reddit.com/r/" + subreddits[i];
  }
};

function noOptionsSet() {
  $('body').append($('<p>').attr('id', 'noOptionsSet').text('Click \'options\' to add a subreddit'));
}

// code the generate images
var imageGenerator = {

  // NOT the food. http://en.wikipedia.org/wiki/Currying
  curry: function(fn) {
    var slice = Array.prototype.slice,
        args = slice.apply(arguments, [1]);
    return function () {
      return fn.apply(null, args.concat(slice.apply(arguments)));
    };
  },

  /**
   * Set the corresonding <img> tag in popup.html to have imgUrl as its
   * source. Also resizes the image to as to not require scrolling, while
   * not distorting the image.
   */
  setImage: function(theImage) {
    $("#masterImage").attr("src", theImage.imgUrl).attr("height", EXT_IMG_HEIGHT)
                     .load(function() {
                        $("#subreddit").text(theImage.subreddit + ':');
                        $("#description").text(theImage.linkTitle);
                     });
  },

  /**
   * Once subredditImgLinks has been populated, this function picks an image
   * at random
   */
  chooseNewImage: function() {
    // choose image at random as described here:
    // http://geomblog.blogspot.ca/2008/01/happy-birthday-don-knuth.html
    var c = 0;
    var theSubreddit = null;
    var theImage = null;
    var theImageInd;

    if(this.isEmpty(remainingSubImgLinks)) {
      remainingSubImgLinks = this.copyHash(subredditImgLinks);
    }

    for(subreddit in remainingSubImgLinks) {

      for(var i = 0; i < remainingSubImgLinks[subreddit].length; i++) {
        if(Math.random() < 1/++c) {
          theSubreddit = subreddit;
          theImage = remainingSubImgLinks[subreddit][i];
          theImageInd = i;
        }
      }

    }

    // remove the link from future choices
    remainingSubImgLinks[theSubreddit].splice(theImageInd, 1);

    // for now do nothing with 'theSubreddit'...
    return theImage;
  },

  nextImage: function() {
    imageGenerator.setImage(imageGenerator.chooseNewImage());
  },

  /**
   * Once all asynchronous reddit requests have run, this function is called. It
   * does what needs to be done to preserve images, then i
   */
  asyncFinished: function() {
    $('#noOptionsSet').remove();
    this.nextImage();
  },

  /**
   * return a valid image version of the link passed, or null if none such link
   * exists
   */
  validHref: function(href) {
    // only handle imgur links for now
    if(href.match(/\.(jpg|jpeg|gif|png|bmp)$/)) {
      return href
    }
    return null;
  },

  /**
   * handle asynchronous GET request to the subreddit URL. Finds i.imgur.com
   * links in the response, and adds them to subredditImgLinks
   * responses have been handled, imageGenerator.asyncFinished() is called
   */
  handleResponse: function(subreddit, e) {
    console.log("subreddit = " + subreddit);
    console.log("hello: e.target.responseXML=" + e.target.response);

    // get all links on the page
    var xpathResult = document.evaluate(LINK_XPATH, e.target.responseXML, null,
                                        XPathResult.ANY_TYPE, null);

    subredditImgLinks[subreddit] = [];
    while(node = xpathResult.iterateNext()) {
      var as = document.evaluate(IMG_XPATH, node, null, XPathResult.ANY_TYPE, null);
      var a = as.iterateNext();
      var imgUrl = this.validHref(a.href);
      var linkTitle = a.text;
      /*
      // extract the image
      var imgUrl = null;
      for(var i = 0; i < IMG_XPATHS.length && imgUrl == null; i++) {
        // thins that match some variation of an <a>
        as = document.evaluate(IMG_XPATHS[i], node, null, XPathResult.ANY_TYPE, null);
        while((a = as.iterateNext()) && (imgUrl == null)) {
          imgUrl = this.validHref(a.href);
        }

      }

      if(imgUrl == null) continue;

      // try to find the title
      var linkTitle = null;
      for(var i = 0; i < TITLE_XPATHS.length && imgUrl == null; i++) {
        as = document.evaluate(TITLE_XPATHS[i], node, null, XPatResult.ANY_TYPE, null);
        while((a = as.iterateNext()) && (linkTitle == null)) {
          imgUrl = this.validHref(a.href);
        }
      }*/

      if(imgUrl == null) continue;


      // eventually do some magic processing here on href

      // find other information about the entry

      subredditImgLinks[subreddit].push(new RedditLink(imgUrl, linkTitle, subreddit));
    }

    // check if all responses have been handled
    allHandled = true;
    for(var i = 0; i < subreddits.length; i++) {
      if(subredditImgLinks[subreddits[i]] == [] || subredditImgLinks[subreddits[i]] == undefined) {
        allHandled = false;
      }
    }

    if(allHandled) {
      this.asyncFinished();
    }
  },

  /**
   * Load image locations from subreddits, save in global variables
   */
  loadImages: function() {
    if(!this.isEmpty(subredditImgLinks)) {
      return;
    } else if(this.isEmpty(subreddits)) {
      noOptionsSet();
      return;
    }

    $('body').append($('<p>').attr('id', 'noOptionsSet').text('Loading...'));

    // submit AJAX requests
    for(subreddit in nextSubredditUrls) {
      url = nextSubredditUrls[subreddit];
      req = new XMLHttpRequest();
      req.responseType = "document";
      req.open("GET", url, true);
      req.setRequestHeader('Content-Type', 'text/xml');
      console.log("onloading...");

      // curry the function so it may be called each time with a different
      // subreddit (i.e. the right one)
      req.onload = this.curry(this.handleResponse.bind(this), subreddit);
      req.send(null);
    }

  },

  // check if map, an Object, is empty
  isEmpty: function(map) {
    for(var key in map) {
      if (map.hasOwnProperty(key) && map[key].length > 0) {
        return false;
      }
    }
    return true;
  },

  copyArr: function(arr) {
    newArr = [];
    for(var i = 0; i < arr.length; i++) {
      newArr.push(arr[i]);
    }
    return newArr;
  },

  copyHash: function(obj) {
    newObj = {};
    for(var key in obj) {
      newObj[key] = this.copyArr(obj[key]);
    }
    return newObj;
  }
};

document.addEventListener('DOMContentLoaded', function () {

  if(localStorage['subreddits'] == undefined) {
    noOptionsSet();
  } else {
    subreddits = JSON.parse(localStorage['subreddits']);
    generateSubredditUrls();
    document.getElementById("masterImage").onclick = imageGenerator.nextImage;
    imageGenerator.loadImages();
  }

});
