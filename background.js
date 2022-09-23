if (typeof browser === "undefined") {
    var browser = chrome;
}

function filterUser(user) {
  let perma = "";
  if (user.permalink) {
    perma = user.permalink
  } else {
    perma = user.user.permalink
  }
  const badWords = ["18-", "sex", "sexy", "teen", "hot", "lover", "love", "beach", "pussy"]
  let isnum = /^\d+$/.test(perma);
  return [...badWords
  ].some(e => perma.includes(e)) || isnum;
}

function listener(details) {
  let filter = browser.webRequest.filterResponseData(details.requestId);
  let decoder = new TextDecoder("utf-8");
  let encoder = new TextEncoder();

  const filterResponse = ["comments","reposters","likers"].some(e => details.url.includes(e));

  let data = "";
  filter.ondata = event => {
    let str = decoder.decode(event.data, {stream: true});
    if (filterResponse) {
      data += str;
    } else {
      filter.write(encoder.encode(str));
    }
  }

  filter.onstop = () => {
    if (filterResponse) {
      try {
        let obj = JSON.parse(data);
        obj.collection = obj.collection.filter(user => {
          if (filterUser(user)) {
            return false;
          } else {
            return true;
          }
        });
        filter.write(encoder.encode(JSON.stringify(obj)));
      } catch (e) {
        console.log("ERROR", e)
      }
    }
    filter.close();
  };

  return {};
}

browser.webRequest.onBeforeRequest.addListener(
  listener,
  {urls: ["https://api-v2.soundcloud.com/*"]},
  ["blocking"]
);
