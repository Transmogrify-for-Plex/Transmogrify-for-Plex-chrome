canistreamit = {
    metadata_xml: null,

    init: function(metadata_xml) {
        canistreamit.metadata_xml = metadata_xml;

        canistreamit.getMovieId();
    },

    getMovieId: function() {
        var imdb_id;
        debug("canistreamit plugin: Grabbing imdb id");
        var agent = canistreamit.metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0].getAttribute("guid");
        // check if using the freebase metadata agent
        if (/com\.plexapp\.agents\.imdb/.test(agent)) {
            imdb_id = agent.match(/^com\.plexapp\.agents\.imdb:\/\/(.+)\?/)[1];
            debug("canistreamit plugin: imdb id found - " + imdb_id);

            canistreamit.createCanIStreamItLink(imdb_id);
        }
        // check if using the movie database metadata agent
        else if (/com\.plexapp\.agents\.themoviedb/.test(agent)) {
            var tmdb_id = agent.match(/^com\.plexapp\.agents\.themoviedb:\/\/(.+)\?/)[1];
            debug("canistreamit plugin: tmdb id found - " + tmdb_id);
            // async call to get imdb id using themoviedb
            themoviedb.getImdbId(tmdb_id, function(imdb_id) {
                debug("canistreamit plugin: imdb id found - " + imdb_id);

                canistreamit.createCanIStreamItLink(imdb_id);
            });
        }
        // check if using the XBMCnfoMoviesImporter agent
        else if (/com\.plexapp\.agents\.xbmcnfo/.test(agent)) {
            imdb_id = agent.match(/^com\.plexapp\.agents\.xbmcnfo:\/\/(.+)\?/)[1];
            debug("canistreamit plugin: imdb id found - " + imdb_id);

            canistreamit.createCanIStreamItLink(imdb_id);
        }
    },

    createCanIStreamItLink: function(imdb_id) {
       // create canistreamit container element
        var canistreamit_container = canistreamit.constructCanIStreamItFrame(imdb_id);

        // insert canistreamit container to bottom right of .details-metadata-container
        debug("canistreamit plugin: Inserting canistreamit container into page");
        document.getElementsByClassName("details-metadata-container")[0].appendChild(canistreamit_container);
    },

    constructCanIStreamItFrame: function(imdb_id) {
        var iframe_link = "http://www.canistream.it/external/imdb/" + imdb_id + "?l=mini";

        var canistreamit_iframe = document.createElement("iframe");
        canistreamit_iframe.setAttribute("id", "canistreamit-container");
        canistreamit_iframe.setAttribute("src", iframe_link);
        canistreamit_iframe.setAttribute("frameborder", "0");
        canistreamit_iframe.setAttribute("scrolling", "no");

        return canistreamit_iframe;
    }
}