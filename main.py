import feedparser
import spacy
import requests
import json
import hashlib  
import shelve
import gzip
import CloudFlare
import base64
from collections import Counter
import random
import os

from datetime import datetime, timedelta
from dateutil.parser import parse
import pytz

from newspaper import Article
import newspaper

import time

def get_locations(text):
    doc = nlp(text)
    locations = []
    for ent in doc.ents:
        if ent.label_ == "GPE" or ent.label_ == "LOC":
            locations += [ent.text]    
    return locations

def title_case(locations):
    return [l.title() for l in locations]

def get_article(url):
    article = Article(url)
    article.download()
    article.parse()
    return article

def geolocate(location_query):
    api_url = "https://geocoder.ls.hereapi.com/search/6.2/geocode.json?languages=en-US"
    params = {
        "maxresults": 4,
        "searchtext": location_query,
        "apiKey": HERE_API_KEY
    }
    response = requests.get(api_url, params=params)

    geolocation = {}
    result = json.loads(response.text)
    view = result["Response"]["View"]

    if len(view) == 0:
        return None
    
    locations = view[0]["Result"]
    
    if len(locations) == 0:
        return None
    
    location = locations[0]
    geolocation = {
        "lat": location["Location"]["DisplayPosition"]["Latitude"],
        "lng": location["Location"]["DisplayPosition"]["Longitude"]
    }
    
    if location["MatchLevel"] == "country":
        geolocation["type"] = "country"
    else:
        geolocation["type"] = "point"
        
    return geolocation

def get_geolocations(locations):
    # Do it for the unique locations
    geolocations = []
    for loc in locations:
        try:
            b = {**loc, **geolocate(loc["name"])}
            geolocations.append(b)
        except:
            continue
    return geolocations

def hash_entry(entry):
    return hashlib.md5(json.dumps(entry).encode("UTF-8")).hexdigest()

def simplify_entry(entry):
    s_entry = {
        "feed_name": entry["feed_name"],
        "feed_url": entry["feed_url"],
        "title": entry["title"],
        "summary": entry["summary"],
        "link": entry["link"],
        "published": entry["published"],
        "geolocations": entry["geolocations"],
        "source": entry["feed_provider"]
    }
    return s_entry

def upload(new_parsed_entries_json):
    new_parsed_entries_json_nozero = [entry for entry in new_parsed_entries_json if len(entry["geolocations"]) > 0]
    random.shuffle(new_parsed_entries_json_nozero)

    base64_bytes = base64.b64encode(json.dumps(new_parsed_entries_json_nozero).encode('utf-8'))
    top_news_json = {
        "key": "topnews",
        "value": base64_bytes.decode('UTF-8'),
        "base64": True
    }

def update_KV(json_array):
    # HAS to be an Array (!)
    headers = {
        "Authorization": "Bearer "+ CLOUDFLARE_BEARER_TOKEN,
        "Content-Type": "application/json"
    }
    response = requests.put("https://api.cloudflare.com/client/v4/accounts/b4d8e6840063ec76d6696c51338b3f43/storage/kv/namespaces/40f1dac2027141bba277172bb0132277/bulk",
                            headers=headers,
                            json=json_array)
    return response

    print(update_KV([top_news_json]).text)
    print("updated news length", len(json_arrayarray))

def read_recent_rss_feeds():
    rss_entries = []

    # BBC
    rss_provider = {
        "feed_provider": "BBC",
        "feed_name": "World - Europe",
        "feed_url": "http://feeds.bbci.co.uk/news/world/rss.xml"
    }
    rss_entries += [{**rss_provider, **entry} for entry in feedparser.parse(rss_provider["feed_url"]).entries]

    # The New York Time
    rss_provider = {
        "feed_provider": "The New York Times",
        "feed_name": "World",
        "feed_url": "https://rss.nytimes.com/services/xml/rss/nyt/World.xml"
    }
    rss_entries += [{**rss_provider, **entry} for entry in feedparser.parse(rss_provider["feed_url"]).entries]

    # The Guardian
    rss_provider = {
        "feed_provider": "The Guardian",
        "feed_name": "World",
        "feed_url": "https://www.theguardian.com/world/rss"
    }
    rss_entries += [{**rss_provider, **entry} for entry in feedparser.parse(rss_provider["feed_url"]).entries]

    # # Washington Post
    # rss_provider = {
    #     "feed_provider": "The Washington Post",
    #     "feed_name": "World",
    #     "feed_url": "http://feeds.washingtonpost.com/rss/world"
    # }
    # rss_entries += [{**rss_provider, **entry} for entry in feedparser.parse(rss_provider["feed_url"]).entries]

    # Reuters
    rss_provider = {
        "feed_provider": "Reuters",
        "feed_name": "World",
        "feed_url": "http://feeds.reuters.com/Reuters/worldNews"
    }
    rss_entries += [{**rss_provider, **entry} for entry in feedparser.parse(rss_provider["feed_url"]).entries]

    # LA Times
    rss_provider = {
        "feed_provider": "Los Angeles Times",
        "feed_name": "World",
        "feed_url": "https://www.latimes.com/world/rss2.0.xml"
    }
    rss_entries += [{**rss_provider, **entry} for entry in feedparser.parse(rss_provider["feed_url"]).entries]
    
    now_minus_24 = datetime.now(pytz.utc) - timedelta(hours=24)
    rss_entries_last_24h = [entry for entry in rss_entries if parse(entry["published"]) >= now_minus_24]
    return rss_entries_last_24h

def parse_entries(rss_entries_last_24h):
    VERBOSE = True

    top_news = []
    new_parsed_entries_json = []

    for rss_entry in rss_entries_last_24h:

        entry = rss_entry.copy()
        md5hash = hash_entry(entry)

        if VERBOSE:
            print(md5hash, entry["title"])
        else:
            print(".", end=" ")

        top_news.append({
            "title": entry["title"],
            "published": entry["published"],
            "source": entry["feed_provider"],
            "key": md5hash
        })

        if md5hash in s["md5s"]:
            if VERBOSE:
                print("\t--> Already found")
            new_parsed_entries_json.append(s["md5s"][md5hash])
            continue

        # Get article behind the entry
        article = get_article(entry["link"])
        # Get the locations
        locations = title_case(get_locations(article.text))

        locations_w_count = Counter(locations)
        locations_w_count = [{ "name": a,  "count": locations_w_count[a] } for a in locations_w_count]

        entry["geolocations"] = get_geolocations(locations_w_count)

        print(entry["feed_provider"], len(entry["geolocations"]))

        simple_entry = simplify_entry(entry)
        # base64_bytes = base64.b64encode(json.dumps(simple_entry).encode('utf-8'))
        # new_parsed_entries_json.append({"key": md5hash, "value": base64_bytes.decode('UTF-8'), "base64": True})
        new_parsed_entries_json.append(simple_entry)

        # Move this up if files should be marked complete ANYWAY
        s["md5s"][md5hash] = simple_entry
        
    return new_parsed_entries_json

def ts():
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
print(ts(), "loading NLP model")
nlp = spacy.load("en_core_web_lg")
s = shelve.open('processed_article_md5s.db', writeback=True)
s["md5s"] = {}

CLOUDFLARE_BEARER_TOKEN = os.environ['CLOUDFLARE_BEARER_TOKEN']
HERE_API_KEY = os.environ['HERE_API_KEY']

while True:
    
    print(ts(), "Parsing new entries")
    try:
        rss_entries = read_recent_rss_feeds()
        new_parsed_entries_json = parse_entries(rss_entries)

        if len(new_parsed_entries_json) > 0:
            upload(new_parsed_entries_json)
    except:
        print(ts(), "An error occured")
        
    print(ts(), "Waiting", 5*60, "seconds")
    time.sleep(5*60)
