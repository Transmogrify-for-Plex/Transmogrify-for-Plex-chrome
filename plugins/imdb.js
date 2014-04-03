imdb = {
    metadata_xml: null,

    init: function(metadata_xml) {
        imdb.metadata_xml = metadata_xml;

        imdb.processMovie();
    },

    processMovie: function() {
        var movie_title = imdb.metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0].getAttribute("title");
        var movie_year = imdb.metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0].getAttribute("year");
        debug("imdb plugin: Got movie title - " + movie_title);

        // it's more accurate to search by imdb id, otherwise fall back to movie name
        debug("imdb plugin: Grabbing imdb id");
        var agent = imdb.metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0].getAttribute("guid");

        var imdb_id;
        // check if using the freebase metadata agent
        if (/com\.plexapp\.agents\.imdb/.test(agent)) {
            var imdb_id = agent.match(/^com\.plexapp\.agents\.imdb:\/\/(.+)\?/)[1];
            debug("imdb plugin: imdb id found - " + imdb_id);
        }
        // check if using the XBMCnfoMoviesImporter agent
        else if (/com\.plexapp\.agents\.xbmcnfo/.test(agent)) {
            var imdb_id = agent.match(/^com\.plexapp\.agents\.xbmcnfo:\/\/(.+)\?/)[1];
            debug("imdb plugin: imdb id found - " + imdb_id);
        }
        else {
            debug("imdb plugin: imdb id not found, falling back to movie name");
        }

        var query;
        var type;
        if (imdb_id) {
            query = imdb_id;
            type = "imdb_id";
        }
        else {
            query = movie_title;
            type = "title";
        }
        imdb.getOMDbData(query, type, movie_year, function(movie_data) {
            if ("Error" in movie_data) {
                debug("imdb plugin: Error response recieved. Aborting")
                return;
            }

            var url = "http://www.imdb.com/title/" + movie_data["imdbID"];
            var rating = movie_data["imdbRating"];

            imdb.insertImdbLink(url, rating);
        });
    },

    getOMDbData: function(query, type, movie_year, callback) {
        var api_url;
        if (type === "imdb_id") {
            api_url = "http://www.omdbapi.com/?i=" + query;
        }
        else if (type === "title") {
            api_url = "http://www.omdbapi.com/?t=" + encodeURIComponent(query) + "&y=" + movie_year;
        }

        utils.getJSON(api_url, true, function(omdb_json) {
            callback(omdb_json);
        });
    },

    insertImdbLink: function(url, rating) {
        // create imdb link element
        var imdb_container = imdb.constructImdbLink(url, rating);

        // insert imdb link element to bottom of metadata container
        debug("imdb plugin: Inserting imdb container into page");
        document.getElementsByClassName("metadata-right")[0].appendChild(imdb_container);
    },

    constructImdbLink: function(imdb_url, imdb_rating) {
        var logo_url = utils.getResourcePath("imdb/imdb_logo.png")

        var imdb_container_element = document.createElement("div");
        imdb_container_element.setAttribute("id", "imdb-container");

        // construct link
        var imdb_element_link = document.createElement("a");
        imdb_element_link.setAttribute("href", imdb_url);
        imdb_element_link.setAttribute("target", "_blank");

        // construct logo
        var imdb_element_img = document.createElement("img");
        imdb_element_img.setAttribute("id", "imdb-logo");
        imdb_element_img.setAttribute("src", logo_url);

        imdb_element_link.appendChild(imdb_element_img);

        // construct rating
        var imdb_rating_element = document.createElement("div");
        imdb_rating_element.setAttribute("id", "imdb-rating");
        imdb_rating_element.setAttribute("style", "background-image: url(" + utils.getResourcePath("imdb/imdb_star.png") + ");")

        var rating_text = document.createTextNode(imdb_rating);
        imdb_rating_element.appendChild(rating_text);

        imdb_container_element.appendChild(imdb_element_link);
        imdb_container_element.appendChild(imdb_rating_element);

        return imdb_container_element;
    }
}