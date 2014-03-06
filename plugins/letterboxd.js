function constructLetterboxdLink(id, agent) {
    var logo_url = chrome.extension.getURL("resources/letterboxd/letterboxd_logo.png")
    var letterboxd_link = "http://letterboxd.com/" + agent + "/" + id;

    // construct link
    var letterboxd_element_link = document.createElement("a");
    letterboxd_element_link.setAttribute("id", "letterboxd-link");
    letterboxd_element_link.setAttribute("href", letterboxd_link);
    letterboxd_element_link.setAttribute("target", "_blank");
    // construct logo
    var letterboxd_element_img = document.createElement("img");
    letterboxd_element_img.setAttribute("src", logo_url);

    letterboxd_element_link.appendChild(letterboxd_element_img);

    return letterboxd_element_link;
}

function createLetterboxdLink(xml) {
    // don't run if element already exists on page
    debug("letterboxd plugin: Checking if #letterboxd-link element already exists before creating");
    if (document.getElementById("letterboxd-link")) {
        debug("letterboxd plugin: #letterboxd-link element already exists. Passing");
        return;
    }

    // grab tmdb/imdb id
    debug("letterboxd plugin: Grabbing tmdb/imdb id");
    var imdb_id;
    var tmdb_id;
    var agent = xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0].getAttribute("guid");
    // check if using the freebase metadata agent
    if (/com.plexapp.agents.imdb/.test(agent)) {
        imdb_id = agent.match(/^com.plexapp.agents.imdb:\/\/(.+)\?/)[1];
        debug("letterboxd plugin: imdb id found - " + imdb_id);
    }
    // check if using the movie database metadata agent
    else if (/com.plexapp.agents.themoviedb/.test(agent)) {
        tmdb_id = agent.match(/^com.plexapp.agents.themoviedb:\/\/(.+)\?/)[1];
        debug("letterboxd plugin: tmdb id found - " + tmdb_id);
    }

    // create letterboxd link element
    debug("letterboxd plugin: Constructing letterboxd link");
    var letterboxd_element;
    if (imdb_id) {
        letterboxd_element = constructLetterboxdLink(imdb_id, "imdb");
    }
    else if (tmdb_id) {
        letterboxd_element = constructLetterboxdLink(tmdb_id, "tmdb");
    }

    // insert letterboxd link element to bottom of metadata container
    debug("letterboxd plugin: Inserting letterboxd link into page");
    document.getElementsByClassName("metadata-right")[0].appendChild(letterboxd_element);
}