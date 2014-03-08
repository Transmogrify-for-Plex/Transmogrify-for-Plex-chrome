random_picker = {
    server: null,
    section: null,
    overlay: null,

    // init: function(server_address, server_port, plex_token, section) {
    init: function(server, section) {
        random_picker.server = server;
        random_picker.section = section;

        var random_button_element = document.createElement("span");
        random_button_element.setAttribute("id", "pick-random");
        var text = document.createTextNode("Pick random");
        random_button_element.appendChild(text);

        debug("random_picker plugin: Inserting random picker button into breadcrumb-bar");
        document.getElementsByClassName("breadcrumb-bar")[0].appendChild(random_button_element);

        // attach click event listener to pick random
        debug("random_picker plugin: Attaching event listener to pick-random button");
        document.getElementById("pick-random").addEventListener("click", random_picker.displayRandom, false);

        random_picker.overlay = utils.insertOverlay();
    },

    closeRandom: function() {
    	debug("random_picker plugin: Close random_picker");
        var poster = document.getElementById("random-poster");
        poster.parentNode.removeChild(poster);

        random_picker.overlay.style.display = "none";
    },

    getMediaList: function() {
        debug("random_picker plugin: Fetching media list");
        var media_xml_url = "http://" + random_picker.server["address"] + ":" + random_picker.server["port"] + "/library/sections/" + random_picker.section["section_num"] + "/all?X-Plex-Token=" + random_picker.server["access_token"];
        var media_xml = utils.getXML(media_xml_url, false);

        if (random_picker.section["type"] == "movie") {
            return media_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video");
        }
        else if (random_picker.section["type"] == "show") {
            return media_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory");
        }
    },

    getRandomId: function() {
        var media_xml = random_picker.getMediaList();
        var random_num =Math.floor(Math.random() * media_xml.length);
        debug("random_picker plugin: Generated random number - " + random_num.toString() + " out of possible " + media_xml.length.toString() + " items");

        var random_id = media_xml[random_num].getAttribute("ratingKey");
        debug("random_picker plugin: Got random media key - " + random_id);

        return random_id;
    },

    displayRandom: function() {
    	debug("random_picker plugin: pick-random button clicked");
        var random_id = random_picker.getRandomId();
        var poster_url = "http://" + random_picker.server["address"] + ":" + random_picker.server["port"] + "/library/metadata/" + random_id + "/poster?X-Plex-Token=" + random_picker.server["access_token"];
        debug("random_picker plugin: Generated poster URL - " + poster_url);

        random_picker.overlay.style.display = "block";
        // attach click event listener on overlay to close random choice
        random_picker.overlay.addEventListener("click", random_picker.closeRandom, false);

        var poster_element = document.createElement("div");
        poster_element.setAttribute("id", "random-poster");
        var poster_image_element = document.createElement("img");
        poster_image_element.setAttribute("id", "random-poster-image");
        poster_image_element.setAttribute("src", poster_url);
        poster_image_element.setAttribute("data-libraryid", random_id);
        poster_element.appendChild(poster_image_element);

        debug("random_picker plugin: Inserting poster element into document body");
        document.body.appendChild(poster_element);

        var refresh_icon_element = document.createElement("span");
        refresh_icon_element.setAttribute("class", "glyphicon refresh");
        refresh_icon_element.setAttribute("id", "refresh-random");
        poster_element.appendChild(refresh_icon_element);

        // attach click event listener on refresh icon to refresh random choice
        refresh_icon_element.addEventListener("click", random_picker.refreshRandom, false);
        // attach click event listener on poster to open media
        poster_image_element.addEventListener("click", random_picker.loadChoice, false);
    },

    refreshRandom: function() {
    	debug("random_picker plugin: Refresh random button clicked");
        var random_id = random_picker.getRandomId();
        var poster_url = "http://" + random_picker.server["address"] + ":" + random_picker.server["port"] + "/library/metadata/" + random_id + "/poster?X-Plex-Token=" + random_picker.server["access_token"];
        debug("random_picker plugin: Generated poster URL - " + poster_url);

        var poster_image_element = document.getElementById("random-poster-image");
        poster_image_element.setAttribute("src", poster_url);
        poster_image_element.setAttribute("data-libraryid", random_id);
    },

    loadChoice: function() {
    	debug("random_picker plugin: Loading choice");
        var library_id = document.getElementById("random-poster-image").getAttribute("data-libraryid");
        var new_url = document.URL.replace(/section\/\d+/, "details/%2Flibrary%2Fmetadata%2F" + library_id);
        debug("random_picker plugin: Choice URL - " + new_url);

        random_picker.closeRandom();
        window.location = new_url;
    }
}