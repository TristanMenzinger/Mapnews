<br>
<p align="center">
  <img src="https://raw.githubusercontent.com/TristanMenzinger/Mapnews/readme/Mapnews_logo.png?token=AG7APXVOSZMNXGCVT3AETU26YWVLG" width="13%">
</p>

Every day, things happen all around the world, but I rarely tought about where exactly. This is why, some years ago, I first created this. I hope you like it. Visit <a href="https://mapnews.io">the website here</a>.

<p align="center">
  <img src="https://raw.githubusercontent.com/TristanMenzinger/Mapnews/readme/Mapnews_example_image.jpg?token=AG7APXU4PQTDY4L3N2WW6726YWPUY" width="80%">
</p>

**Desktop:** In the top left you can select from different providers and search. When you click on a RSS headline that interests you, you will see the RSS post and the locations mentioned in the article.
<br>
**Mobile:** Swipe through RSS headlines to discover where things are happening. Swipe up to filter and search.

## About
I first made this (for myself) when I was 16, after I had noticed that all Reuters RSS feed news items always had a location mentioned before the content and I decided to geolocate them. I then expanded it to work for more news providers and locations appearing in the RSS text and soonafter anywhere in the article's text on the website itself. 
The very first version consisted of around 2500 lines of inefficient, unreliable and unstructured Java Code using Rome RSS, Boilerpipe, Stanford NLP, Google Geolocation Services and Lucene Text Analyzer. I re-discovered this during the stay-at-home time of Covid-19 and decided to redo and release the project.
Thankfully, the code is much cleaner now (only talking about the backend!) and consists of just a few lines of Python using SpaCy, Newspaper3k and the HERE Maps API. 

For the frontend on mobile, I tried to create a native-like experience where you can swipe to navigate. I am happy to hear if you like it. Unfortunately, this got more complicated than anticipated, and the CSS/JS became relatively large/complicated. Switching between touch inputs on div's of different heights (the cards), the map and the up-and-down swiping motion proved (very) challenging. In retrospect, this is a project that outgrew the vanilla javascript I wrote years ago and could have benefited from a framework.

## Packages used
#### Backend
* SpaCy for Named Entity Recognition (NER)
* Newspaper3k for fetching News articles
* HERE Maps for geocoding 

#### Frontend
* Cloudflare Workers as the API & for hosting
* Apple Maps (so cheap!)
* I created my own slider with CSS transforms (previously Glide.js) 

## Issues
* NLP results generally feature quite a few false positives, especially since the input is also automatically generated and not curated
* I haven't gotten around to convert all variants of country names to the official ones (e.g. U.K. - United Kingdom, US - The United States).
* There may be some bugs somewhere hiding.
