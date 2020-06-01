function setLoading(isLoading) {
    const loaderElement = document.getElementById("loader");
    const gifsElement = document.getElementById("gifs");
    if (isLoading) {
        loaderElement.style.display = null;
        gifsElement.style.display = "none";
    }
    else {
        loaderElement.style.display = "none";
        gifsElement.style.display = null;
    }
}

function addGIFToFavorite(event) {
    const likeButton = event.currentTarget;
    const gifId = likeButton.dataset.gifId;

    const gifElement = document.getElementById(gifId);

    const gifTitle = gifElement.querySelector('div h3').textContent;
    const gifVideoUrl = gifElement.querySelector('source').src;
    const gifImageUrl = gifElement.querySelector('img').src;

    const db = window.db;

    // TODO: 4a - Open IndexedDB's database
    db.open().catch(err => {
      console.error('Failed to open db : ' + (err.stack || err));
    });
    // TODO: 4b - Save GIF data into IndexedDB's database
    db.gifs.add({id: gifId, title: gifTitle, imageUrl: gifImageUrl, videoUrl: gifVideoUrl});
    // TODO: 4c - Put GIF media (image and video) into a cache named "gif-images"
    self.addEventListener('install', (event) => {
        event.waitUntil(
          caches.open('gif-images')
            .then((cache) => {
                return cache.addAll([gifImageUrl, gifVideoUrl]);
            })
        );
    });
    // Set button in 'liked' state (disable the button)
    likeButton.disabled = true;
}

function buildGIFCard(gifItem, isSaved) {
    // Create GIF Card element
    const newGifElement = document.createElement("article");
    newGifElement.classList.add("gif-card");
    newGifElement.id = gifItem.id;

    // Append GIF to card
    const gifImageElement = document.createElement('video');
    gifImageElement.autoplay = true;
    gifImageElement.loop = true;
    gifImageElement.muted = true;
    gifImageElement.setAttribute('playsinline', true);

    const videoSourceElement = document.createElement('source');
    videoSourceElement.src = gifItem.images.original.mp4;
    videoSourceElement.type = 'video/mp4';
    gifImageElement.appendChild(videoSourceElement);

    const imageSourceElement = document.createElement('img');
    imageSourceElement.classList.add('lazyload');
    imageSourceElement.dataset.src = gifItem.imageUrl;
    imageSourceElement.alt = `${gifItem.title} image`;
    gifImageElement.appendChild(imageSourceElement);

    newGifElement.appendChild(gifImageElement);

    // Append metadata to card
    const gifMetaContainerElement = document.createElement("div");
    newGifElement.appendChild(gifMetaContainerElement);

    // Append title to card metadata
    const gifTitleElement = document.createElement("h3");
    const gifTitleNode = document.createTextNode(gifItem.title || 'No title');
    gifTitleElement.appendChild(gifTitleNode);
    gifMetaContainerElement.appendChild(gifTitleElement);

    // Append favorite button to card metadata
    const favButtonElement = document.createElement("button");
    favButtonElement.setAttribute('aria-label', `Save ${gifItem.title}`);
    favButtonElement.classList.add("button");
    favButtonElement.dataset.gifId = gifItem.id;
    favButtonElement.onclick = addGIFToFavorite;
    const favIconElement = document.createElement("i");
    favIconElement.classList.add("fas", "fa-heart");
    favButtonElement.appendChild(favIconElement);
    gifMetaContainerElement.appendChild(favButtonElement);

    // Disable button (set GIF as liked) if liked
    if (isSaved) {
        favButtonElement.disabled = true;
    }

    // Append GIF Card to DOM
    const articlesContainerElement = document.getElementById("gifs");
    articlesContainerElement.appendChild(newGifElement);
}

window.addEventListener("DOMContentLoaded", async function () {
    setLoading(true);

    // TODO: 1a - Set up a new URL object to use Giphy trending endpoint
    var url = "https://api.giphy.com/v1/gifs/trending?api_key=";

    // TODO: 1b - Set proper query parameters to the newly created URL object
    var apiKey = "6GNTqOVhy7BuXqr4iAPspvgka8fn7OYP&limit=25&rating=G";
    try {
        // TODO: 1c - Fetch GIFs from Giphy Trending endpoint
        fetch(url+apiKey).then(res => {
          return res.json();
        }).then(response => {
          // TODO: 1d - If response is not valid, return
          if(response.length == 0) {
            return;
          }
          // TODO: 1e - Convert Giphy response to json

          // TODO: 1f - Use 'response.data' in the constant 'gifs' instead of an empty array
          const gifs = response.data; // replace array by data
          const db = window.db;

          // TODO: 4d - Open IndexedDB's database
          db.open().catch(err => {
            console.error('Failed to open db : ' + (err.stack || err));
          });
          // Display every GIF
          gifs.forEach(async gif => {
              // TODO: 4e - Get GIF from IndexedDB's database, by its ID
              var dataGIF = await db.gifs.where("id").equalsIgnoreCase(gif.id).toArray();
              // TODO: 4f - Create a boolean `isSaved` to check if the GIF was already saved
              var isSaved = dataGIF.length == 0 ? false : true; // replace false by the condition
              // TODO: 1g - Call the function buildGIFCard with proper parameters
              buildGIFCard(gif, isSaved);
              // TIP: Use the boolean `isSaved`
          });
        }).catch(e => console.log("Fetch failed : " + e));
    } catch (e) {
        // TODO: 1h - Display a message in console in case of error
        console.log("Failed to get trending gif : " + e);
    } finally {
        setLoading(false);
    }
});
