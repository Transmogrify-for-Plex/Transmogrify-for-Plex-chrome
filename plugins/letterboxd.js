letterboxd = {
    init: function(metadata_xml) {
        // grab tmdb/imdb id
        var imdb_id;
        var tmdb_id;
        var agent = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0].getAttribute("guid");
        // check if using the freebase metadata agent
        if (/com\.plexapp\.agents\.imdb/.test(agent)) {
            imdb_id = agent.match(/^com\.plexapp\.agents\.imdb:\/\/(.+)\?/)[1];
            debug("letterboxd plugin: imdb id found - " + imdb_id);
        }
        // check if using the movie database metadata agent
        else if (/com\.plexapp\.agents\.themoviedb/.test(agent)) {
            tmdb_id = agent.match(/^com\.plexapp\.agents\.themoviedb:\/\/(.+)\?/)[1];
            debug("letterboxd plugin: tmdb id found - " + tmdb_id);
        }
        // check if using the XBMCnfoMoviesImporter agent
        else if (/com\.plexapp\.agents\.xbmcnfo/.test(agent)) {
            imdb_id = agent.match(/^com\.plexapp\.agents\.xbmcnfo:\/\/(.+)\?/)[1];
            debug("letterboxd plugin: imdb id found - " + imdb_id);
        }

        // create letterboxd link element
        var letterboxd_element;
        if (imdb_id) {
            letterboxd_element = letterboxd.constructLetterboxdLink(imdb_id, "imdb");
        }
        else if (tmdb_id) {
            letterboxd_element = letterboxd.constructLetterboxdLink(tmdb_id, "tmdb");
        }

        //if an unknown agent is used and neither imdb nor tmdb is filled letterboxed_element ist empty
        if (letterboxd_element) {
            // insert letterboxd link element to bottom of metadata container
            debug("letterboxd plugin: Inserting letterboxd link into page");
            document.getElementsByClassName("metadata-right")[0].appendChild(letterboxd_element);
        }
    },

    constructLetterboxdLink: function(id, agent) {
        var logo_url = utils.getResourcePath("letterboxd/letterboxd_logo.png");
        var letterboxd_url = "http://letterboxd.com/" + agent + "/" + id;

        // construct link
        var letterboxd_element_link = document.createElement("a");
        letterboxd_element_link.setAttribute("id", "letterboxd-link");
        letterboxd_element_link.setAttribute("href", letterboxd_url);
        letterboxd_element_link.setAttribute("target", "_blank");
        // construct logo
        var letterboxd_element_img = document.createElement("img");
        letterboxd_element_img.setAttribute("src", logo_url);

        letterboxd_element_link.appendChild(letterboxd_element_img);

        return letterboxd_element_link;
    }
}
