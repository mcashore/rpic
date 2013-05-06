function subredditURL(sub) {
  return 'http://www.reddit.com/r/' + sub;
}

function addToDisplay(sub) {
  $('#subListing').find('tbody')
    .append($('<tr>')
      .attr('id', sub+'Tr')
      .append($('<td>')
        .append($('<a>')
          .attr('href', subredditURL(sub))
          .text(sub)))
      .append($('<td>')
        .append($('<button>')
          .attr('id', sub)
          .text('Delete'))));
  document.getElementById(sub).addEventListener('click', function() { removeSub(sub); }, false);
}

function removeSub(sub) {
  // remove from display
  $(document.getElementById(sub + 'Tr')).remove();

  var subreddits = JSON.parse(localStorage['subreddits']);

  // remove from localStorage
  var ind = -1;
  for(var i = 0; i < subreddits.length; i++) {
    if(subreddits[i] == sub) {
      ind = i;
      break;
    }
  }

  if(ind != -1) {
    subreddits.splice(ind, 1);
  }

  localStorage['subreddits'] = JSON.stringify(subreddits);

}

/**
 * given a subreddit string (either a URL or the name of the subreddit),
 * return the name of the subreddit
 */
function determineSubName(subreddit) {
  subMatch = subreddit.match(/^(http:\/\/){0,1}(www\.){0,1}reddit\.com\/r\/([^\/]+)/);
  if(subMatch != null) {
    return subMatch[3];
  } else if(subreddit.match(/^[^\/]+$/)) {
    return subreddit;
  }
  return null;
}

function submit() {
  newSub = determineSubName(document.getElementById('subreddit').value);
  if(newSub == null) {
    alert('Not a valid subreddit!');
    return;
  }
  document.getElementById('subreddit').value = '';

  // stupid localStorage can only hold strings
  var subreddits = JSON.parse(localStorage['subreddits']);

  if(subreddits.indexOf(newSub) == -1) {
    subreddits.push(newSub);
    addToDisplay(newSub);
  } else {
    alert('Already have that one');
  }

  localStorage['subreddits'] = JSON.stringify(subreddits);
}

function addExistingSubreddits() {
  if(localStorage['subreddits'] == '[]') return;

  subreddits = JSON.parse(localStorage['subreddits']);
  for(var i = 0; i < subreddits.length; i++) {
    addToDisplay(subreddits[i]);
  }
}

document.addEventListener('DOMContentLoaded', function () {
  if(localStorage['subreddits'] == undefined) {
    localStorage['subreddits'] = '[]';
  }
  document.getElementById('submit').addEventListener('click', submit, false);
  addExistingSubreddits();
});