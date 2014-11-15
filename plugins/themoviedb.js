themoviedb = {
    metadata_xml: null,

    init: function(metadata_xml) {
        themoviedb.metadata_xml = metadata_xml;

        themoviedb.getTmdbId();
    },

    getTmdbId: function() {
        utils.debug("themoviedb plugin: Grabbing themoviedb id");
        var agent = themoviedb.metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0].getAttribute("guid");

        // check if using the movie database metadata agent
        if (/com\.plexapp\.agents\.themoviedb/.test(agent)) {
            var tmdb_id = agent.match(/^com\.plexapp\.agents\.themoviedb:\/\/(.+)\?/)[1];
            utils.debug("themoviedb plugin: tmdb id found - " + tmdb_id);

            themoviedb.createTmdbLink(tmdb_id);
        }
        // check if using the freebase metadata agent
        else if (/com\.plexapp\.agents\.imdb/.test(agent)) {
            var imdb_id = agent.match(/^com\.plexapp\.agents\.imdb:\/\/(.+)\?/)[1];
            utils.debug("themoviedb plugin: imdb id found - " + imdb_id);

            // get tmdb id from tmdb api
            themoviedb_api.getTmdbId(imdb_id, "movie", function(tmdb_id) {
                utils.debug("themoviedb plugin: tmdb id retrieved - " + tmdb_id);

                themoviedb.createTmdbLink(tmdb_id);
            });
        }
        else {
            utils.debug("themoviedb plugin: Not using imdb or tmdb agents, aborting");
            return;
        }
    },

    createTmdbLink: function(tmdb_id) {
        var logo_url = utils.getResourcePath("themoviedb/themoviedb_logo.png")

        var themoviedb_container_element = document.createElement("div");
        themoviedb_container_element.setAttribute("id", "themoviedb-container");

        // construct link
        var themoviedb_element_link = document.createElement("a");
        themoviedb_element_link.setAttribute("href", "https://www.themoviedb.org/movie/" + tmdb_id);
        themoviedb_element_link.setAttribute("target", "_blank");

        // construct logo
        var themoviedb_element_img = document.createElement("img");
        themoviedb_element_img.setAttribute("src", logo_url);

        themoviedb_element_link.appendChild(themoviedb_element_img);
        themoviedb_container_element.appendChild(themoviedb_element_link);

        themoviedb.insertTmdbLink(themoviedb_container_element);
    },

    insertTmdbLink: function(tmdb_link) {
        // insert themoviedb link element to bottom of metadata container
        utils.debug("themoviedb plugin: Inserting themoviedb container into page");
        document.getElementsByClassName("metadata-right")[0].appendChild(tmdb_link);
    }
}