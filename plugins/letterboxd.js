function constructLetterboxdLink(imdb_id) {
    var logo_url = "http://primer.cf.letterboxd.com/logos/letterboxd-logo-neg-rgb.png";
    var letterboxd_link = "http://letterboxd.com/imdb/" + imdb_id;

    // construct link
    var letterboxd_element_link = document.createElement("a");
    letterboxd_element_link.setAttribute("id", "letterboxd-link");
    letterboxd_element_link.setAttribute("href", letterboxd_link);
    letterboxd_element_link.setAttribute("target", "_blank");
    // construct logo
    var letterboxd_element_img = document.createElement("img");
    letterboxd_element_img.setAttribute("src", logo_url);
    letterboxd_element_img.setAttribute("width", 150);

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

    // grab imdb id
    debug("letterboxd plugin: Grabbing imdb id");
    var imdb_agent = xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0].getAttribute("guid");
    var imdb_id = imdb_agent.match(/^com.plexapp.agents.imdb:\/\/(.+)\?/)[1];
    debug("letterboxd plugin: Grabbed imdb id - " + imdb_id);

    // create letterboxd link element
    debug("letterboxd plugin: Constructing letterboxd link");
    var letterboxd_element = constructLetterboxdLink(imdb_id);

    // insert letterboxd link element to bottom of metadata container
    debug("letterboxd plugin: Inserting letterboxd link into page");
    document.getElementsByClassName("metadata-right")[0].appendChild(letterboxd_element);
}