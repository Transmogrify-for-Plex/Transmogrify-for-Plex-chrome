imdb = {
    metadata_xml: null,

    init: function(metadata_xml) {
        imdb.metadata_xml = metadata_xml;

        imdb.processMovie();
    },

    processMovie: function() {
        var movie_title = imdb.metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0].getAttribute("title");
        var movie_year = imdb.metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0].getAttribute("year");
        utils.debug("imdb plugin: Got movie title - " + movie_title);

        // it's more accurate to search by imdb id, otherwise fall back to movie name
        utils.debug("imdb plugin: Grabbing imdb id");
        var agent = imdb.metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0].getAttribute("guid");

        var imdb_id;
        // check if using the freebase metadata agent
        if (/com\.plexapp\.agents\.imdb/.test(agent)) {
            var imdb_id = agent.match(/^com\.plexapp\.agents\.imdb:\/\/(.+)\?/)[1];
            utils.debug("imdb plugin: imdb id found - " + imdb_id);
        }
        // check if using the XBMCnfoMoviesImporter agent
        else if (/com\.plexapp\.agents\.xbmcnfo/.test(agent)) {
            var imdb_id = agent.match(/^com\.plexapp\.agents\.xbmcnfo:\/\/(.+)\?/)[1];
            utils.debug("imdb plugin: imdb id found - " + imdb_id);
        }
        else {
            utils.debug("imdb plugin: imdb id not found, falling back to movie name");
        }

        // use OMDb API to fetch movie data
        if (imdb_id) {
            omdb_api.searchByImdbId(imdb_id, function(movie_data) {
                imdb.processOMDbData(movie_data);
            });
        }
        else {
            omdb_api.searchByMovieTitle(movie_title, movie_year, function(movie_data) {
                imdb.processOMDbData(movie_data);
            });
        }
    },

    processOMDbData: function(movie_data) {
        if (!movie_data || "Error" in movie_data) {
            utils.debug("imdb plugin: Error response recieved. Aborting")
            return;
        }

        var url = "http://www.imdb.com/title/" + movie_data["imdbID"];
        var rating = movie_data["imdbRating"];

        imdb.insertImdbLink(url, rating);
    },

    insertImdbLink: function(url, rating) {
        // create imdb link element
        var imdb_container = imdb.constructImdbLink(url, rating);

        // insert imdb link element to bottom of metadata container
        utils.debug("imdb plugin: Inserting imdb container into page");
        document.getElementsByClassName("metadata-right")[0].appendChild(imdb_container);
    },

    constructImdbLink: function(imdb_url, imdb_rating) {
        var logo_url = utils.getResourcePath("imdb/imdb_logo.png")

        var imdb_container_element = document.createElement("a");
        imdb_container_element.setAttribute("id", "imdb-container");
        imdb_container_element.setAttribute("href", imdb_url);
        imdb_container_element.setAttribute("target", "_blank");

        // construct logo
        var imdb_element_img = document.createElement("img");
        imdb_element_img.setAttribute("id", "imdb-logo");
        imdb_element_img.setAttribute("src", logo_url);

        // construct rating
        var imdb_rating_element = document.createElement("div");
        imdb_rating_element.setAttribute("id", "imdb-rating");
        imdb_rating_element.setAttribute("style", "background-image: url(" + utils.getResourcePath("imdb/imdb_star.png") + ");")

        var rating_text = document.createTextNode(imdb_rating);
        imdb_rating_element.appendChild(rating_text);

        imdb_container_element.appendChild(imdb_element_img);
        imdb_container_element.appendChild(imdb_rating_element);

        return imdb_container_element;
    }
}