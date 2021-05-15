imdb = {
    metadata_xml: null,

    init: function (metadata_xml, type) {
        imdb.metadata_xml = metadata_xml;
        imdb.getImdbId(type);
    },

    getImdbId: async (type) => {
        if (type == "movie") {
            utils.debug("imdb plugin: Checking Plex Agent");
            agent = imdb.metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0].getAttribute("guid");
            imdbelement = imdb.metadata_xml.querySelectorAll('[id^="imdb"]')[0];
            if (imdbelement) {
                imdbid_check = imdbelement.parentNode.parentNode.tagName;
            }
            else {
                imdbid_check = null;
            }

            if (imdbid_check == "MediaContainer") {
                imdb_id = imdbelement.id.replace("imdb://", "");
            }

            if (imdb_id) {
                utils.debug("imdb plugin: imdb id found - " + imdb_id);
                url = "http://www.imdb.com/title/" + imdb_id;
                imdb.insertImdbLink(url);
            }
            else {
                utils.debug("imdb plugin: imdb id not found. Attempting search via TMDB");
                tmdbelement = imdb.metadata_xml.querySelectorAll('[id^="tmdb"]')[0]
                if (tmdbelement) {
                    tmdbid_check = tmdbelement.parentNode.parentNode.tagName;
                }
                else {
                    tmdbid_check = null;
                }
                if (tmdbid_check == "MediaContainer") {
                    tmdb_id = tmdbelements[0].id
                    utils.debug("imdb plugin: tmdb id found - " + tmdb_id);
                    var api_url = "https://api.themoviedb.org/3/movie/" + tmdb_id + "/external_ids?api_key=" + themoviedb_api.api_key;
                    response = await fetch(api_url);
                    json = await response.json();
                    var imdb_id = json.imdb_id;
                    if (imdb_id) {
                        utils.debug("imdb plugin: imdb id found - " + imdb_id);
                        url = "http://www.imdb.com/title/" + imdb_id;
                        imdb.insertImdbLink(url);
                    }
                    else {
                        utils.debug("imdb plugin: imdb id not found. Aborting.");
                    }
                }
                else {
                    utils.debug("imdb plugin: imdb id not found via TMDB. Aborting.");
                }
            }
        }
        if (type == "show") {
            utils.debug("imdb plugin: Grabbing IMDB ID from TMDB");
            var agent = imdb.metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0].getAttribute("guid");

            // check if using the movie database metadata agent
            if (/com\.plexapp\.agents\.themoviedb/.test(agent)) {
                var tmdb_id = agent.match(/^com\.plexapp\.agents\.themoviedb:\/\/(.+)\?/)[1];
                utils.debug("imdb plugin: tmdb id found - " + tmdb_id);
                var api_url = "https://api.themoviedb.org/3/tv/" + tmdb_id + "/external_ids?api_key=" + themoviedb_api.api_key;
                response = await fetch(api_url);
                json = await response.json();
                imdb_id = json.imdb_id;
            }
            else {
                utils.debug("imdb plugin: Not using tmdb agent, aborting");
            }

            if (imdb_id) {
                utils.debug("imdb plugin: imdb id found - " + imdb_id);
                url = "http://www.imdb.com/title/" + imdb_id;
                imdb.insertImdbLink(url);
            }
            else {
                utils.debug("imdb plugin: imdb id not found");
            }
        }
    },

    constructImdbLink: function (imdb_url) {
        var sister_containers = document.querySelectorAll("[class*=PrePlayTertiaryTitleSpacer-tertiaryTitleSpacer-]")[0].parentNode.children;
        var container_element_template = sister_containers[0]
        var logo_url = utils.getResourcePath("imdb/imdb_logo.png")
        var imdb_container_element = document.createElement("span");
        imdb_container_element.setAttribute("id", "imdb-container");
        imdb_container_element.setAttribute("class", container_element_template.getAttribute("class"));

        // Set the class of the last element
        var last_sister = sister_containers[sister_containers.length - 1];
        last_sister.setAttribute("class", container_element_template.getAttribute("class"));

        // construct link
        var imdb_element_link = document.createElement("a");
        imdb_element_link.setAttribute("id", "imdb-link");
        imdb_element_link.setAttribute("href", imdb_url);
        imdb_element_link.setAttribute("target", "_blank");

        // construct logo
        var imdb_element_img = document.createElement("img");
        imdb_element_img.setAttribute("src", logo_url);
        imdb_element_img.setAttribute("height", "20px");

        imdb_element_link.appendChild(imdb_element_img);
        imdb_container_element.appendChild(imdb_element_link);

        return imdb_container_element;
    },

    insertImdbLink: function (url) {
        // create imdb link element
        var imdb_container = imdb.constructImdbLink(url);

        // insert imdb link element to bottom of metadata container
        utils.debug("imdb plugin: Inserting imdb container into page");
        document.querySelectorAll("[class*=PrePlayTertiaryTitle-tertiaryTitle]")[0].appendChild(imdb_container);
    }
}