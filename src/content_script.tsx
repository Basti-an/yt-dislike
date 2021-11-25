// the yt DOM element for our dislike button might not be loaded yet,
// despite common indicators like document.readystate claiming otherwise
// to combat this, we use sentinel-js to detect when our dislike button is in DOM and ready to go!
// sentinel achieves this by basically creating a custom stylesheet for our queryselector
// and registering an invisible animation on it-
// this animation in turn triggers a JS event which sentinel subscribes to, which becomes our entrypoint
import sentinel from "sentinel-js";

/** returns input if its not null, throws generic error if input is null */
function notNull(input: Element | null, entityName: string) {
  if (input === null) {
    throw new Error(`yt-dislike: cannot find ${entityName}`);
  }
  return input;
}

/** either returns DOM element of yt dislike button
 * or throws if element can't be located in DOM
 */
function getDislikeButton() {
  // get yt like/dislike info bar
  const $infoBar = notNull(
    document.querySelector(
      "#menu .style-scope.ytd-video-primary-info-renderer"
    ),
    "dislike infoBar"
  );
  const $buttonTopBar = notNull(
    $infoBar.querySelector("#top-level-buttons-computed"),
    "like/dislike buttonBar"
  );
  const $dislikeButton = $buttonTopBar.children[1]; // [like, dislike, whatever...]

  return $dislikeButton;
}

/** returns text node of dislike button or throws if it cant be located for some reason */
function getDislikeButtonText($dislikeButton: Element) {
  return notNull($dislikeButton.querySelector("#text"), "dislike button text");
}

/** mimics the effect of disliking a video by locally changing
 *  the dislike count in DOM according to button toggle state
 *  the actual dislike is still handled by yt's own event handlers
 */
const dislike = ($dislikeButton: Element) => () => {
  const $buttonText = getDislikeButtonText($dislikeButton);
  let dislikeCount = parseInt($buttonText.innerHTML, 10);

  // check if video is already disliked by checking for style-default-active in classlist of $dislikeButton
  const { classList } = $dislikeButton;
  const isDisliked = [...classList].indexOf("style-default-active") !== -1;

  // youtube changes the classname of the dislike button BEFORE this eventhandler runs
  // therefore we are reacting to the current state and not the previous one
  if (isDisliked) {
    dislikeCount += 1;
  } else {
    dislikeCount -= 1;
  }

  $buttonText.innerHTML = dislikeCount.toString();
};

/** requests dislike count of current url video id via background script
 *  and calls setDislikeCount with the value received from background
 */
function requestDislikeCount($dislikeButton: Element) {
  const video_id = document.location.search.split("=")[1]; // might not work for playlists and stuff?
  chrome.runtime.sendMessage({ video_id }, function (response) {
    if (!response) {
      return;
    }
    const { dislikes } = response;
    setDislikeCount(dislikes, $dislikeButton);
  });
}

function setDislikeCount(dislikeCount: number, $dislikeButton: Element) {
  const $buttonText = getDislikeButtonText($dislikeButton);
  $buttonText.innerHTML = dislikeCount.toString();
}

function main() {
  // due to yt´s custom routing, I cannot scope this script to only run on /watch urls
  // because the script would'nt be invoked when clicking on a video from a non /watch url
  // therefore we just run the script on every youtube page and exit early if it not a video
  if (!document.location.pathname.includes("watch")) {
    return null;
  }

  const $dislikeButton = getDislikeButton();
  requestDislikeCount($dislikeButton);
  return $dislikeButton;
}

// wait until like/dislike menu is rendered
if (typeof sentinel.on !== "function") {
  console.error("yt-dislike: cannot init sentinel-js");
}

sentinel.on("#menu .style-scope.ytd-video-primary-info-renderer", () => {
  sentinel.off("#menu .style-scope.ytd-video-primary-info-renderer");

  const $dislikeButton = main();
  if (!$dislikeButton) {
    return;
  }

  // attach click listener to manipulate dislike count locally
  $dislikeButton.addEventListener("click", dislike($dislikeButton));
});

// we cant depend on popstate / readystate etc. to detect video/url changes
// due to yt's custom routing, so we use yt custom events instead
window.addEventListener("yt-page-data-updated", main);
