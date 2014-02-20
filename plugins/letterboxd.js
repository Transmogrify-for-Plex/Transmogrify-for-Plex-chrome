function constructLetterboxdLink(imdb_id) {
    var logo_url = "http://primer.cf.letterboxd.com/logos/letterboxd-logo-neg-rgb.png";
    var letterboxd_link = "http://letterboxd.com/imdb/" + imdb_id;

    // construct link
    var letterboxd_element_link = document.createElement("a");
    letterboxd_element_link.setAttribute("id", "letterboxd_link");
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
    if (document.getElementById("letterboxd_link")) {
        return;
    }

    // grab imdb id
    var imdb_agent = xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0].getAttribute("guid");
    var imdb_id = imdb_agent.match(/^com.plexapp.agents.imdb:\/\/(.+)\?/)[1];

    // create letterboxd link element
    var letterboxd_element = constructLetterboxdLink(imdb_id);

    // insert letterboxd link element to bottom of metadata container
    document.getElementsByClassName("metadata-right")[0].appendChild(letterboxd_element);
}