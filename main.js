let CURRENT_PAGE = null;
let PAGES = null;
let MAX_PAGE_NR = null;

let ALL_HEADLINES = [];

let FILTERED_HEADLINES = null;

let SELECTED_PAGINATION_ELEM = null;

let MAP;

let IS_MOBILE;

let NEWS_SOURCES = {
	"bbc": {
		"name": "BBC",
		"selected": true
	},
	"nyt": {
		"name": "The New York Times",
		"selected": true
	},
	"tg": {
		"name": "The Guardian",
		"selected": true
	},
	"r": {
		"name": "Reuters",
		"selected": true
	},
	"lat": {
		"name": "Los Angeles Times",
		"selected": true
	},
}

let SEARCH_STRING = "";

let init = async (is_mobile) => {
	IS_MOBILE = is_mobile;

	// Fetch all headlines
	let all_headlines = await get_headlines();
	for (let raw_headline of all_headlines) {
		ALL_HEADLINES.push(new Headline(raw_headline))
	}

	map_init();


	apply_filters();
	update_headlines_container();

	// update_after_filter();

	// document.getElementById("map").addEventListener("ontouchstart", function() {
	// 	console.log("map touched")
	// }, false)

	// document.getElementById("c").ontouchstart = (event) => {
	// 	console.log("C: ontouchstart");

	// 	event.preventDefault();
	// 	event.

	// 	document.getElementById("filter").style.pointerEvents = "none";
	// 	let new_e = new event.constructor(event.type, event);
	// 	new_e.isTrusted = true;
	// 	document.getElementById("map").dispatchEvent(new_e);
	// 	console.log(new_e)
	// }

	// document.getElementById("c").ontouchend = (event) => {
	// 	console.log("C: ontouchend");
	// 	// event.preventDefault();
	// 	// let new_e = new event.constructor(event.type, event);
	// 	// document.getElementById("map").dispatchEvent(new_e);
	// 	document.getElementById("filter").style.pointerEvents = "none";
	// }
	// document.getElementById("c").ontouchmove = (event) => {
	// 	console.log("C: ontouchmove");
	// 	// event.preventDefault();
	// 	// let new_e = new event.constructor(event.type, event);
	// 	// document.getElementById("map").dispatchEvent(new_e);
	// 	document.getElementById("filter").style.pointerEvents = "none";
	// }

	// document.getElementById("headlines_container").ontouchstart = () => {
	// 	console.log("touchstart")
	// 	document.getElementById("filter").style.pointerEvents = "initial";
	// }


	// document.getElementById("headlines_container").ontouchend = () => {
	// 	console.log("touchend")
	// 	setTimeout(function() {
	// 		console.log("none!")
	// 		document.getElementById("filter").style.pointerEvents = "none";
	// 	}, 125);
	// }


	// document.getElementById("b").ontouchstart = () => {
	// 	console.log("touchstart")
	// 	document.getElementById("filter").style.pointerEvents = "initial";
	// }

}

let map_init = () => {

	// LEAFLET
	// var map = L.map('map').setView([51.505, -0.09], 13);
	// var roads = L.mapkitMutant({

	// 	type: 'default',

	// 	authorizationCallback: function(done) {

	// 		fetch("https://mapnewsmapkey.menzinger.workers.dev")
	// 			.then(response => response.json())
	// 			.then(result => {
	// 				done(result.token) 
	// 			});

	// 	},
	// 	language: 'en',
	// 	// For debugging purposes only. Displays a L.Rectangle on the
	// 	// visible bounds ("region") of the mutant.
	// 	// debugRectangle: false
	// }).addTo(map);

	mapkit.init({
		authorizationCallback: function(done) {
			fetch("https://mapnewsmapkey.menzinger.workers.dev")
				.then(response => response.json())
				.then(result => {
					done(result.token)
				})
		}
	});

	var sfo = new mapkit.Coordinate(37.616934, -122.383790)

	var sfoRegion = new mapkit.CoordinateRegion(
		new mapkit.Coordinate(37.616934, -122.383790),
		new mapkit.CoordinateSpan(0.167647972, 0.354985255)
	);
	MAP = new mapkit.Map("map");

	var sfoAnnotation = new mapkit.MarkerAnnotation(sfo, { color: "#f4a56d", title: "SFO", glyphText: "HI!" });
	MAP.showItems([sfoAnnotation]);

	MAP.region = sfoRegion;
	MAP._allowWheelToZoom = true;
}

let toggle_expand = () => {
	let logo_expand = document.getElementById("logo-expand")
	if (logo_expand.innerHTML.includes("left")) {
		logo_expand.innerHTML = `<i class="fas fa-chevron-right"></i>`
	} else {
		logo_expand.innerHTML = `<i class="fas fa-chevron-left"></i>`
	}
	document.getElementById("bar-left").classList.toggle("mini")
}

let search = (search_div) => {
	SEARCH_STRING = search_div.value;
	console.log(SEARCH_STRING)
	apply_filters();
	update_headlines_container();
}

let set_show_no_headlines = () => {
	for (let headline in ALL_HEADLINES) {
		headline.hide();
	}
}
let set_show_all_headlines = () => {
	for (let headline in ALL_HEADLINES) {
		headline.show();
	}
}
let update_headlines_container = () => {

	div_all_headlines = document.getElementById("headlines");
	div_all_headlines.clearChildren();

	for (let headline of ALL_HEADLINES) {
		if (headline.is_show) {
			div_all_headlines.appendChild(headline.div);
		}
	}

	if (!IS_MOBILE) {
		headlines_to_pages();
		adjust_pagination();
		switch_to_page(1);
	}
}


// Rewrite this?
let apply_filters = () => {
	allowed_source_names = Object.keys(NEWS_SOURCES).filter(key => NEWS_SOURCES[key].selected).map(key => NEWS_SOURCES[key].name)
	for (let headline of ALL_HEADLINES) {

		if (headline.search_self(allowed_source_names, SEARCH_STRING)) {
			headline.show()
		} else {
			headline.hide()
		}

		// if (!allowed_source_names.includes(headline.source)) {
		// 	headline.hide()
		// }else {
		// 	if(headline.title.toLowerCase().includes(SEARCH_STRING.toLowerCase())) {
		// 		headline.show()
		// 	}else {
		// 		headline.hide()
		// 	}
		// }
	}
}


let toggle_provider = (clicked_dropdown) => {
	selected_source = clicked_dropdown.id.replace("dropdown_", "");
	clicked_dropdown.classList.toggle("selected");
	NEWS_SOURCES[selected_source].selected = !NEWS_SOURCES[selected_source].selected;

	apply_filters();
	update_headlines_container();
}


let headlines_to_pages = () => {
	let i = 0
	pages = {}
	page_nr = 0
	const headlines_to_show = ALL_HEADLINES.filter(h => h.is_show);
	while (i < headlines_to_show.length) {
		if (i % 10 == 0) {
			page_nr++;
			pages[page_nr + ""] = []
		}
		pages[page_nr + ""].push(headlines_to_show[i])
		i++;
	}
	PAGES = pages
	MAX_PAGE_NR = page_nr
}
let adjust_pagination = () => {
	pagination_start = document.getElementById("pagination-start")

	while (pagination_start.nextElementSibling.className === "page-item") {
		pagination_start.parentElement.removeChild(pagination_start.nextElementSibling)
	}

	for (let page_nr = MAX_PAGE_NR; page_nr >= 1; page_nr--) {
		const page_switcher_template = `
			<li class="page-item">
				<a class="page-link" id="page-nr-${page_nr}" href="#" onclick=switch_to_page(${page_nr})>${page_nr}</a>
			</li>
		`

		let wrapper = document.createElement("div");
		wrapper.innerHTML = page_switcher_template;
		insertAfter(wrapper.firstElementChild, pagination_start)
	}
}

let switch_to_page = (page_nr) => {
	if (page_nr > MAX_PAGE_NR | page_nr < 1)
		return

	clear_headlines()

	if (SELECTED_PAGINATION_ELEM)
		SELECTED_PAGINATION_ELEM.classList.remove("selected")

	SELECTED_PAGINATION_ELEM = document.getElementById("page-nr-" + page_nr)
	SELECTED_PAGINATION_ELEM.classList.add("selected")

	CURRENT_PAGE = page_nr
	show_headlines(PAGES[page_nr])
}

// let get_headlines = () => {
// 	return new Promise((resolve, reject) => {
// 		var xmlHttp = new XMLHttpRequest();
// 		xmlHttp.onreadystatechange = function() {
// 			if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
// 				resolve(xmlHttp.response);
// 			}
// 		}
// 		xmlHttp.open("GET", "https://mapnews.menzinger.workers.dev/topnews", true);
// 		xmlHttp.send(null);
// 	})
// }


class Headline {
	constructor(topnews_data) {
		this.title = topnews_data.title;
		this.published = topnews_data.published;
		this.source = topnews_data.source;
		this.key = topnews_data.key;

		this.is_show = true;

		this._make_div();
		this._add_onclick_listener();
		this._add_onswipe_listener();
	}

	_make_div() {
		const headline_template = `
			<div class="headline">
				<div class="card shadow-sm headline-card">
					<div class="card-body headline-card-body">
						<div class="headline-title">
							${this.title}
						</div>
						<div class="headline-content">
						</div>
						<div class="headline-info">
							<div class="headline-source">
								${this.source}
							</div>
							<div class="headline-date">
								${this.published}
							</div>
						<div>
					</div>
				</div>
			</div>
		`;

		let wrapper = document.createElement("div");
		wrapper.innerHTML = headline_template;
		this.div = wrapper.firstElementChild;
	}

	_add_onclick_listener() {
		this.div.onclick = async () => {
			// Await since we want to wait for the first request to finish
			await this.show_content();
			this.show_markers()
			this.focus()
		}
	}

	_add_onswipe_listener() {

		//this.div.addEventListener('touchstart', handleTouchStart, false);
		//this.div.addEventListener('touchmove', handleTouchMove, false);

		var xDown = null;
		var yDown = null;

		this.div.ontouchstart = (evt) => {
			const firstTouch = evt.touches[0];
			xDown = firstTouch.clientX;
			yDown = firstTouch.clientY;
		}

		this.div.ontouchmove = (evt) => {
			if (!xDown || !yDown) {
				return;
			}

			var xUp = evt.touches[0].clientX;
			var yUp = evt.touches[0].clientY;

			var xDiff = xDown - xUp;
			var yDiff = yDown - yUp;

			if (Math.abs(xDiff) > Math.abs(yDiff)) { /*most significant*/
				if (xDiff > 0) {
					/* left swipe */
					// console.log("left swipe");
				} else {
					/* right swipe */
					// console.log("right swipe");
				}
			} else {
				console.log(Math.abs(yDiff) / this.div.offsetHeight)
				if (Math.abs(yDiff) / this.div.offsetHeight > 0.1) {
					if (yDiff > 0) {
						// console.log("up swipe");
					} else {
						console.log("down swipe");
						this.remove_from_view()
					}
				}
			}
			/* reset values */
			xDown = null;
			yDown = null;
		};
	}

	async remove_from_view() {
		let div_headlines = document.getElementById("headlines");
		div_headlines.removeChild(this.div)
	}

	async get_content() {
		let content = await get_news_by_key(this.key);
		this.content = content;
	}

	async show_content() {
		if (this.content == null)
			await this.get_content();

		let content_div = this.div.querySelector(".headline-content")
		content_div.innerHTML = this.content.summary
		this.div.classList.add("showing");
	}

	async show_markers() {
		if (this.content == null)
			await this.get_content();

		MAP.removeAnnotations(MAP.annotations)
		let lls = []
		for (let ll of this.content.geolocations) {
			if (ll != null) {
				let coordinate = new mapkit.Coordinate(ll.lat, ll.lng)
				lls.push(new mapkit.MarkerAnnotation(coordinate, { color: "#f4a56d", glyphText: "" + ll.count }))
			}
		}
		MAP.showItems(lls);
	}

	focus() {
		for (let headline of ALL_HEADLINES) {
			headline.unfocus();
		}
		this.div.classList.add("focus")
	}

	unfocus() {
		this.div.classList.remove("focus")
	}

	show() {
		this.is_show = true;
	}

	hide() {
		this.is_show = false;
	}

	search_self(allowed_sources, re_search_string) {
		if (!allowed_sources.includes(this.source))
			return false;

		if (this.title.toLowerCase().search(re_search_string.toLowerCase()) != -1)
			return true;

		return false;
	}

}

/*
 * REQUESTS
 */
let get_headlines = async () => {
	return fetch("https://mapnews.menzinger.workers.dev/topnews")
		.then(response => response.json())
		.then(result => {
			return result
		})
}

let get_news_by_key = async (key) => {
	return fetch(`https://mapnews.menzinger.workers.dev/news?key=${key}`)
		.then(response => response.json())
		.then(result => {
			return result
		})
}


let headline_selected = async (headline) => {
	let content = await get_news_by_key(headline.key);
	show_markers_for_content(content);
	headline.content = content;


	let content_div = headline.div.querySelector(".headline-content")
	content_div.innerHTML = content.summary
	content_div.classList.add("showing");

	console.log(headline)
}

let clear_headlines = () => {
	let div_headlines = document.getElementById("headlines");
	div_headlines.clearChildren();
}
let show_headlines = (selected_headlines) => {
	clear_headlines();
	let div_headlines = document.getElementById("headlines");
	for (let headline of selected_headlines) {
		div_headlines.appendChild(headline.div);
	}
}

let make_headline = (headline) => {
	const headline_template = `
		<div class="card shadow-sm headline-card">
			<div class="card-body headline-card-body">
				<div class="headline-title">
					${headline.title}
				</div>
				<div class="headline-content">

				</div>
				<div class="headline-info">
					<div class="headline-source">
						${headline.source}
					</div>
					<div class="headline-date">
						${headline.published}
					</div>
				<div>
			</div>
		</div>
	`;

	let wrapper = document.createElement("div");
	wrapper.innerHTML = headline_template
	return wrapper.firstElementChild;
}

let show_markers_for_content = (content) => {
	MAP.removeAnnotations(MAP.annotations)
	let lls = []
	for (let ll of content.geolocations) {
		if (ll != null) {
			let coordinate = new mapkit.Coordinate(ll.lat, ll.lng)
			lls.push(new mapkit.MarkerAnnotation(coordinate, { color: "#f4a56d", glyphText: "1" }))
		}
	}
	MAP.showItems(lls);
}


/*
 * OVERRIDES
 */

// https://stackoverflow.com/questions/3955229/remove-all-child-elements-of-a-dom-node-in-javascript
if (typeof Element.prototype.clearChildren === 'undefined') {
	Object.defineProperty(Element.prototype, 'clearChildren', {
		configurable: true,
		enumerable: false,
		value: function() {
			while (this.firstChild) this.removeChild(this.lastChild);
		}
	});
}

// https://stackoverflow.com/questions/4793604/how-to-insert-an-element-after-another-element-in-javascript-without-using-a-lib
function insertAfter(newNode, referenceNode) {
	referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}