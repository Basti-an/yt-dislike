const API_KEY = process.env.API_KEY;

// for some strange reason, chrome port communication does not play nice with async/await
// using await always made the sendResponse function execute immediately,
// which is why the following code uses .then() instead 🤮
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg.video_id) {
    sendResponse({ error: "no video id" });
    return;
  }

  chrome.identity.getAuthToken({ interactive: true }, (token) => {
    let init = {
      method: "GET",
      async: true,
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      contentType: "json",
    };

    fetch(
      `https://www.googleapis.com/youtube/v3/videos?key=${API_KEY}&id=${msg.video_id}&part=statistics`,
      init
    ).then((response) => {
      response.json().then((body) => {
        const dislikes = body.items[0].statistics.dislikeCount;
        sendResponse({ dislikes });
      });
    });
  });

  return true;
});
