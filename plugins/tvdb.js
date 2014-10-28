tvdb = {
    metadata_xml: null,

    init: function(metadata_xml, type) {
        tvdb.metadata_xml = metadata_xml;

        tvdb.getTvdbId();
    },

    getTvdbId: function() {
        utils.debug("tvdb plugin: Grabbing tvdb id");
        var agent = tvdb.metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0].getAttribute("guid");

        // check if using the tvdb metadata agent
        if (/com\.plexapp\.agents\.thetvdb/.test(agent)) {
            var tvdb_id = agent.match(/^com\.plexapp\.agents\.thetvdb:\/\/(\d+)\?/)[1];
            utils.debug("tvdb plugin: tvdb id found - " + tvdb_id);

            var tvdb_link = tvdb.createTvdbLink(tvdb_id);
            tvdb.insertTvdbLink(tvdb_link);
        }
        else {
            utils.debug("tvdb plugin: Not using thetvdb agent, aborting");
            return;
        }
    },

    createTvdbLink: function(tvdb_id) {
        var logo_url = utils.getResourcePath("tvdb/tvdb_logo.png")

        var tvdb_container_element = document.createElement("div");
        tvdb_container_element.setAttribute("id", "tvdb-container");

        // construct link
        var tvdb_element_link = document.createElement("a");
        tvdb_element_link.setAttribute("href", "http://thetvdb.com/?tab=series&id=" + tvdb_id);
        tvdb_element_link.setAttribute("target", "_blank");

        // construct logo
        var tvdb_element_img = document.createElement("img");
        tvdb_element_img.setAttribute("src", logo_url);

        tvdb_element_link.appendChild(tvdb_element_img);
        tvdb_container_element.appendChild(tvdb_element_link);

        return tvdb_container_element;
    },

    insertTvdbLink: function(tvdb_link) {
        // insert tvdb link element to bottom of metadata container
        utils.debug("tvdb plugin: Inserting tvdb container into page");
        document.getElementsByClassName("metadata-right")[0].appendChild(tvdb_link);
    }
}