const API_KEY = "your-api-key-here";

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (!msg.video_id) {
    sendResponse({ error: "no video id" });
    return;
  }

  const response = fetch(
    `https://www.googleapis.com/youtube/v3/videos?key=${API_KEY}&id=${msg.video_id}&part=statistics`
  ).then((response) => {
    response.json().then((body) => {
      const dislikes = body.items[0].statistics.dislikeCount;
      sendResponse({ dislikes });
    });
  });

  return true;
});
