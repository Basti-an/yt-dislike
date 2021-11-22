// chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
//   if (msg.color) {
//     console.log("Receive color = " + msg.color);
//     document.body.style.backgroundColor = msg.color;
//     sendResponse("Change color to " + msg.color);
//   } else {
//     sendResponse("Color message is none.");
//   }
// });
import sentinel from "sentinel-js";

/** returns input if its not null, throws generic error if input is null */
function notNull(input: Element | null, entityName: string) {
  if (input === null) {
    throw new Error(`yt-dislike: cannot find ${entityName}`);
  }
  return input;
}

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
  const $dislikeButton = $buttonTopBar.children[1]; // first child is like button

  return $dislikeButton;
}

function getDislikeButtonText($dislikeButton: Element) {
  const $buttonText = $dislikeButton.querySelector("#text");
  if (!$buttonText) {
    throw new Error("yt-dislike: cannot find dislike button text");
  }
  return $buttonText;
}

const dislike = ($dislikeButton: Element) => () => {
  console.log("DISLIKE");
  const $buttonText = getDislikeButtonText($dislikeButton);
  let dislikeCount = parseInt($buttonText.innerHTML, 10);

  // check if video is already disliked by checking for style-default-active in classlist of $dislikeButton
  const { classList } = $dislikeButton;
  const isDisliked = [...classList].indexOf("style-default-active") !== -1;
  console.log("is already disliked: " + isDisliked);

  if (isDisliked) {
    // add to dislike count
    dislikeCount += 1;
  } else {
    // subtract from dislike count
    dislikeCount -= 1;
  }

  $buttonText.innerHTML = dislikeCount.toString();
};

function requestDislikeCount($dislikeButton: Element) {
  const video_id = document.location.search.split("=")[1]; // might not work for playlists and stuff?
  chrome.runtime.sendMessage({ video_id }, async function (response) {
    console.log("answer from backend:");
    console.log(response);
    const { dislikes } = response;
    console.log(dislikes);
    setDislikeCount(dislikes, $dislikeButton);
  });
}

function setDislikeCount(dislikeCount: number, $dislikeButton: Element) {
  const $buttonText = getDislikeButtonText($dislikeButton);
  $buttonText.innerHTML = dislikeCount.toString();
}

function main() {
  const $dislikeButton = getDislikeButton();
  requestDislikeCount($dislikeButton);
  return $dislikeButton;
}

// wait until like/dislike menu is rendered
if (typeof sentinel.on !== "function") {
  console.error("yt-dislike: cannot init sentinel-js");
}
sentinel.on("#menu .style-scope.ytd-video-primary-info-renderer", () => {
  const $dislikeButton = main();

  // attach click listener to manipulate dislike count locally
  $dislikeButton.addEventListener("click", dislike($dislikeButton));
});

// since youtube uses its own router we use this event to refire our script when video changes
window.addEventListener("yt-page-data-updated", main);
