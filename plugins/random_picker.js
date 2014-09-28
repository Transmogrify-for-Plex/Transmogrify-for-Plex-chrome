random_picker = {
    server: null,
    section: null,
    only_unwatched: null,
    overlay: null,
    media_list: null,

    init: function(server, section, random_picker_only_unwatched) {
        random_picker.server = server;
        random_picker.section = section;
        random_picker.only_unwatched = random_picker_only_unwatched;

        random_picker.getMediaList();
    },

    insertElements: function() {
        var random_button_element = document.createElement("span");
        random_button_element.setAttribute("id", "pick-random");
        var text = document.createTextNode("Pick random");
        random_button_element.appendChild(text);

        utils.debug("random_picker plugin: Inserting random picker button into breadcrumb-bar");
        document.getElementsByClassName("breadcrumb-bar")[0].appendChild(random_button_element);

        // attach click event listener to pick random
        utils.debug("random_picker plugin: Attaching event listener to pick-random button");
        document.getElementById("pick-random").addEventListener("click", random_picker.displayRandom, false);

        random_picker.overlay = utils.insertOverlay();
    },

    closeRandom: function() {
        utils.debug("random_picker plugin: Close random_picker");
        var poster = document.getElementById("random-poster");
        poster.parentNode.removeChild(poster);

        random_picker.overlay.style.display = "none";
        random_picker.overlay.removeEventListener("click", random_picker.closeRandom, false);
    },

    getMediaList: function() {
        utils.debug("random_picker plugin: Fetching media list");
        var media_xml_url = "http://" + random_picker.server["address"] + ":" + random_picker.server["port"] + "/library/sections/" + random_picker.section["section_num"] + "/all?X-Plex-Token=" + random_picker.server["access_token"];
        utils.getXML(media_xml_url, function(media_xml) {
            if (random_picker.section["type"] == "movie") {
                var movies_xml = media_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video");

                if (random_picker.only_unwatched === "on") {
                    // only return unwatched movies
                    utils.debug("random_picker plugin: Only returning unwatched media");
                    var filtered_movies_xml = [];
                    for (i = 0; i < movies_xml.length; i++) {
                        if (movies_xml[i].getAttribute("viewCount") === null) {
                            filtered_movies_xml.push(movies_xml[i]);
                        }
                    }
                    random_picker.media_list = filtered_movies_xml;
                }
                else {
                    random_picker.media_list = movies_xml;
                }
            }
            else if (random_picker.section["type"] == "show") {
                random_picker.media_list = media_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory");
            }

            // insert selector elements
            random_picker.insertElements();
        });
    },

    getRandomItem: function() {
        var random_num =Math.floor(Math.random() * random_picker.media_list.length);
        utils.debug("random_picker plugin: Generated random number - " + random_num.toString() + " out of possible " + random_picker.media_list.length.toString() + " items");

        var id = random_picker.media_list[random_num].getAttribute("ratingKey");
        var thumb = random_picker.media_list[random_num].getAttribute("thumb");
        utils.debug("random_picker plugin: Got random media key - " + id);

        return {"id": id, "thumb": thumb};
    },

    getPosterURL: function(thumb) {
        var server_url = "http://" + random_picker.server["address"] + ":" + random_picker.server["port"];
        var poster_url = server_url + "/photo/:/transcode?width=450&height=675&url=" + encodeURIComponent("http://127.0.0.1:" + random_picker.server["port"] + thumb) + "&X-Plex-Token=" + random_picker.server["access_token"];

        return poster_url;
    },

    displayRandom: function() {
        utils.debug("random_picker plugin: pick-random button clicked");
        var random_item = random_picker.getRandomItem();
        var poster_url = random_picker.getPosterURL(random_item["thumb"]);
        utils.debug("random_picker plugin: Generated poster URL - " + poster_url);

        random_picker.overlay.style.display = "block";
        // attach click event listener on overlay to close random choice
        random_picker.overlay.addEventListener("click", random_picker.closeRandom, false);

        var poster_element = document.createElement("div");
        poster_element.setAttribute("id", "random-poster");
        var poster_image_element = document.createElement("img");
        poster_image_element.setAttribute("id", "random-poster-image");
        poster_image_element.setAttribute("src", poster_url);
        poster_image_element.setAttribute("data-libraryid", random_item["id"]);
        poster_element.appendChild(poster_image_element);

        utils.debug("random_picker plugin: Inserting poster element into document body");
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
        utils.debug("random_picker plugin: Refresh random button clicked");
        var random_item = random_picker.getRandomItem();
        var poster_url = random_picker.getPosterURL(random_item["thumb"]);
        utils.debug("random_picker plugin: Generated poster URL - " + poster_url);

        var poster_image_element = document.getElementById("random-poster-image");
        poster_image_element.setAttribute("src", poster_url);
        poster_image_element.setAttribute("data-libraryid", random_item["id"]);
    },

    loadChoice: function() {
        utils.debug("random_picker plugin: Loading choice");
        var library_id = document.getElementById("random-poster-image").getAttribute("data-libraryid");
        var new_url = document.URL.replace(/section\/\d+/, "details/%2Flibrary%2Fmetadata%2F" + library_id);
        utils.debug("random_picker plugin: Choice URL - " + new_url);

        random_picker.closeRandom();
        window.location.href = new_url;
    }
}