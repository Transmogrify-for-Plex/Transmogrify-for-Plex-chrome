themoviedb = {
    metadata_xml: null,

    init: function (metadata_xml) {
        themoviedb.metadata_xml = metadata_xml;

        themoviedb.getTmdbId();
    },

    getTmdbId: function () {
        utils.debug("themoviedb plugin: Checking metadata for TMDB id");
        tmdbelement = imdb.metadata_xml.querySelectorAll('[id^="tmdb"]')[0]
        if (tmdbelement) {
            tmdbid_check = tmdbelement.parentNode.parentNode.tagName;
        }
        else {
            tmdbid_check = null;
        }
        if (tmdbid_check == "MediaContainer") {
            tmdb_id = tmdbelement.id.replace("tmdb://", "");
            utils.debug("themoviedb plugin: tmdb id found - " + tmdb_id);
            themoviedb.insertTmdbLink(tmdb_id);
        }
        else {
            utils.debug("themoviedb plugin: tmdb id not found. Aborting.");
        }
    },

    insertTmdbLink: function (tmdb_id) {
        // insert themoviedb link element to bottom of metadata container
        var tmdb_container = themoviedb.constructTmdbLink(tmdb_id);
        utils.debug("themoviedb plugin: Inserting themoviedb container into page");
        document.querySelectorAll("[class*=PrePlayTertiaryTitle-tertiaryTitle]")[0].appendChild(tmdb_container);
    },

    constructTmdbLink: function (tmdb_id) {
        var sister_containers = document.querySelectorAll("[class*=PrePlayTertiaryTitleSpacer-tertiaryTitleSpacer-]")[0].parentNode.children;
        var container_element_template = sister_containers[0];
        var logo_url = utils.getResourcePath("themoviedb/themoviedb_logo.svg");
        var themoviedb_container_element = document.createElement("span");
        themoviedb_container_element.setAttribute("id", "themoviedb-container");
        themoviedb_container_element.setAttribute("class", container_element_template.getAttribute("class"));

        // Set the class of the last element
        var last_sister = sister_containers[sister_containers.length - 1];
        last_sister.setAttribute("class", container_element_template.getAttribute("class"));

        // construct link
        var themoviedb_element_link = document.createElement("a");
        themoviedb_element_link.setAttribute("id", "themoviedb-link");
        themoviedb_element_link.setAttribute("href", "https://www.themoviedb.org/movie/" + tmdb_id);
        themoviedb_element_link.setAttribute("target", "_blank");

        // construct logo
        var themoviedb_element_img = document.createElement("img");
        themoviedb_element_img.setAttribute("src", logo_url);
        themoviedb_element_img.setAttribute("height", "20px");

        themoviedb_element_link.appendChild(themoviedb_element_img);
        themoviedb_container_element.appendChild(themoviedb_element_link);

        return themoviedb_container_element;
    }
}