tvdb = {
    metadata_xml: null,

    init: function (metadata_xml, type) {
        tvdb.metadata_xml = metadata_xml;

        tvdb.getTvdbId();
    },

    getTvdbId: async () => {
        utils.debug("tvdb plugin: Grabbing tvdb id");
        var agent = tvdb.metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0].getAttribute("guid");

        // check if using the tvdb metadata agent
        if (/com\.plexapp\.agents\.thetvdb/.test(agent)) {
            var tvdb_id = agent.match(/^com\.plexapp\.agents\.thetvdb:\/\/(\d+)\?/)[1];
            utils.debug("tvdb plugin: tvdb id found - " + tvdb_id);
        }
        else {
            tv_year = tvdb.metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0].getAttribute("year");
            tv_title = tvdb.metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0].getAttribute("title");
            utils.debug("tvdb plugin: Not using thetvdb agent, attempting search via TMDB using title (" + tv_title + ") and year (" + tv_year + ")");
            var api_url = "https://api.themoviedb.org/3/search/tv?language=en-US&page=1&include_adult=false&query=" + tv_title + "&first_air_date_year=" + tv_year + "&api_key=" + themoviedb_api.api_key;
            utils.debug("tvdb plugin: Connecting to endpoint" + api_url);
            response = await fetch(api_url);
            json = await response.json();
            var tmdb_id = await json.results[0].id;
            if (tmdb_id) {
                utils.debug("tvdb plugin:  tmdb id found - " + tmdb_id);
                var api_url = "https://api.themoviedb.org/3/tv/" + tmdb_id + "/external_ids?api_key=" + themoviedb_api.api_key;
                utils.debug("tvdb plugin: Connecting to endpoint" + api_url);
                response = await fetch(api_url);
                json = await response.json();
                var tvdb_id = json.tvdb_id;
            }
        }
        if (tvdb_id) {
            utils.debug("tvdb plugin: tvdb id found - " + tvdb_id);
            var tvdb_link = tvdb.createTvdbLink(tvdb_id);
            tvdb.insertTvdbLink(tvdb_link);
        }
        else {
            utils.debug("tvdb plugin: tvdb id not found. Aborting.");
            return;
        }
    },

    createTvdbLink: function (tvdb_id) {
        var logo_url = utils.getResourcePath("tvdb/tvdb_logo.png");
        var sister_containers = document.querySelectorAll("[class*=PrePlayTertiaryTitleSpacer-tertiaryTitleSpacer-]")[0].parentNode.children;
        var container_element_template = sister_containers[0];
        var tvdb_container_element = document.createElement("span");
        tvdb_container_element.setAttribute("id", "tvdb-container");
        tvdb_container_element.setAttribute("class", container_element_template.getAttribute("class"));

        // Set the class of the last element
        var last_sister = sister_containers[sister_containers.length - 1];
        last_sister.setAttribute("class", container_element_template.getAttribute("class"));

        // construct link
        var tvdb_element_link = document.createElement("a");
        tvdb_element_link.setAttribute("href", "http://thetvdb.com/?tab=series&id=" + tvdb_id);
        tvdb_element_link.setAttribute("target", "_blank");

        // construct logo
        var tvdb_element_img = document.createElement("img");
        tvdb_element_img.setAttribute("src", logo_url);
        tvdb_element_img.setAttribute("height", "20px");

        tvdb_element_link.appendChild(tvdb_element_img);
        tvdb_container_element.appendChild(tvdb_element_link);

        return tvdb_container_element;
    },

    insertTvdbLink: function (tvdb_link) {
        // insert tvdb link element to bottom of metadata container
        utils.debug("tvdb plugin: Inserting tvdb container into page");
        document.querySelectorAll("[class*=PrePlayTertiaryTitle-tertiaryTitle]")[0].appendChild(tvdb_link);
    }
}