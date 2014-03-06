function getRottenTomatoesData(imdb_id) {
    debug("rotten_tomatoes plugin: Reading API key");
    var api_key = readFile(chrome.extension.getURL("resources/rotten_tomatoes_api_key.txt"));
    debug("rotten_tomatoes plugin: Successfully read API key");

    var api_url = "http://api.rottentomatoes.com/api/public/v1.0/movie_alias.json?apikey=" + api_key + "&type=imdb&id=" + imdb_id;

    var rotten_tomatoes_json = getJSON(api_url);

    return rotten_tomatoes_json;
}

function constructRottenTomatoesLink(movie_data, show_audience_rating) {
    var rotten_tomatoes_link = movie_data["links"]["alternate"];
    var critics_score = movie_data["ratings"]["critics_score"];
    var critics_rating_image = movie_data["ratings"]["critics_rating"];
    var audience_score = movie_data["ratings"]["audience_score"];
    var audience_rating_image = movie_data["ratings"]["audience_rating"];

    var logo_url = chrome.extension.getURL("resources/rotten_tomatoes_logo.png")

    var rotten_tomatoes_container_element = document.createElement("a");
    rotten_tomatoes_container_element.setAttribute("href", rotten_tomatoes_link);
    rotten_tomatoes_container_element.setAttribute("target", "_blank");
    rotten_tomatoes_container_element.setAttribute("id", "rotten-tomatoes-container");

    var rotten_tomatoes_ratings_container_element = document.createElement("div");
    rotten_tomatoes_ratings_container_element.setAttribute("id", "rotten-tomatoes-ratings-container");

    // construct logo
    var rotten_tomatoes_element_img = document.createElement("img");
    rotten_tomatoes_element_img.setAttribute("src", logo_url);

    rotten_tomatoes_container_element.appendChild(rotten_tomatoes_element_img);

    if (critics_score === -1) {
        // no rating available, don't show rating
        return rotten_tomatoes_container_element;
    }

    if (show_audience_rating == "on") {
        // construct audience score
        var rotten_tomatoes_audience_rating_element = document.createElement("div");
        rotten_tomatoes_audience_rating_element.setAttribute("id", "rotten-tomatoes-audience-score");
        var audience_rating_text = document.createTextNode(audience_score + "%");

        // construct audience rating image
        var rotten_tomatoes_audience_rating_image_element = document.createElement("img");
        var audience_image_url;
        if (audience_rating_image === "Upright") {
            audience_image_url = chrome.extension.getURL("resources/rotten_tomatoes_upright.png");
        }
        else if (audience_rating_image === "Spilled") {
            audience_image_url = chrome.extension.getURL("resources/rotten_tomatoes_spilled.png");
        }
        rotten_tomatoes_audience_rating_image_element.setAttribute("src", audience_image_url);
        rotten_tomatoes_audience_rating_image_element.setAttribute("id", "rotten-tomatoes-audience-rating-image");

        rotten_tomatoes_audience_rating_element.appendChild(rotten_tomatoes_audience_rating_image_element);
        rotten_tomatoes_audience_rating_element.appendChild(audience_rating_text);

        rotten_tomatoes_ratings_container_element.appendChild(rotten_tomatoes_audience_rating_element);
    }

    // construct critics score
    var rotten_tomatoes_critics_rating_element = document.createElement("div");
    rotten_tomatoes_critics_rating_element.setAttribute("id", "rotten-tomatoes-critics-score");
    var critics_rating_text = document.createTextNode(critics_score + "%");

    // construct critics rating image
    var rotten_tomatoes_critics_rating_image_element = document.createElement("img");
    var critics_image_url;
    if (critics_rating_image === "Certified Fresh") {
        critics_image_url = chrome.extension.getURL("resources/rotten_tomatoes_certified.png");
    }
    else if (critics_rating_image === "Fresh") {
        critics_image_url = chrome.extension.getURL("resources/rotten_tomatoes_fresh.png");
    }
    else if (critics_rating_image === "Rotten") {
        critics_image_url = chrome.extension.getURL("resources/rotten_tomatoes_rotten.png");
    }
    rotten_tomatoes_critics_rating_image_element.setAttribute("src", critics_image_url);
    rotten_tomatoes_critics_rating_image_element.setAttribute("id", "rotten-tomatoes-critics-rating-image");

    rotten_tomatoes_critics_rating_element.appendChild(rotten_tomatoes_critics_rating_image_element);
    rotten_tomatoes_critics_rating_element.appendChild(critics_rating_text);

    rotten_tomatoes_ratings_container_element.appendChild(rotten_tomatoes_critics_rating_element);


    rotten_tomatoes_container_element.appendChild(rotten_tomatoes_ratings_container_element);

    return rotten_tomatoes_container_element;
}

function createRottenTomatoesLink(xml, show_audience_rating) {
    // don't run if element already exists on page
    debug("rotten_tomatoes plugin: Checking if #rotten-tomatoes-container element already exists before creating");
    if (document.getElementById("rotten-tomatoes-container")) {
        debug("rotten_tomatoes plugin: #rotten-tomatoes-container element already exists. Passing");
        return;
    }

    var imdb_id;
    // it's more accurate to search by imdb id, otherwise fall back to movie name
    debug("rotten_tomatoes plugin: Grabbing imdb id");
    var agent = xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0].getAttribute("guid");
    // check if using the freebase metadata agent
    if (/com.plexapp.agents.imdb/.test(agent)) {
        imdb_id = agent.match(/^com.plexapp.agents.imdb:\/\/tt(.+)\?/)[1];
        debug("rotten_tomatoes plugin: imdb id found - " + imdb_id);
    }
    // check if using the movie database metadata agent
    else if (/com.plexapp.agents.themoviedb/.test(agent)) {
        var tmdb_id = agent.match(/^com.plexapp.agents.themoviedb:\/\/(.+)\?/)[1];
        debug("rotten_tomatoes plugin: tmdb id found - " + tmdb_id);
        imdb_id = getImdbId(tmdb_id);
        // chop off tt prefix
        imdb_id = imdb_id.slice(2);
        debug("rotten_tomatoes plugin: imdb id found - " + imdb_id);
    }

    var movie_data = getRottenTomatoesData(imdb_id);
    if ("error" in movie_data) {
        debug("rotten_tomatoes plugin: No results for movie. Aborting");
        return;
    }

    // create rotten tomatoes link element
    var rotten_tomatoes_container = constructRottenTomatoesLink(movie_data, show_audience_rating);

    // insert rotten tomatoes link element to bottom of metadata container
    debug("rotten_tomatoes plugin: Inserting rotten_tomatoes container into page");
    document.getElementsByClassName("metadata-right")[0].appendChild(rotten_tomatoes_container);
}

function runRottenTomatoes(xml) {
    // check if US citizen (API requirement)
    chrome.storage.sync.get("rotten_tomatoes_citizen", function (result){
        if (result["rotten_tomatoes_citizen"] === "us") {
            debug("rotten_tomatoes plugin: User is in US");
            // check whether to show audience rating
            chrome.storage.sync.get("rotten_tomatoes_audience", function (result){
                createRottenTomatoesLink(xml, result["rotten_tomatoes_audience"]);
            });
        }
        else {
            debug("rotten_tomatoes plugin: User is not in US. Aborting");
        }
    });
}