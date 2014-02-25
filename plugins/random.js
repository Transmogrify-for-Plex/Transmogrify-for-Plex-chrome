function closeRandom() {
	debug("random_picker plugin: Close random_picker. Removing poster");
    var poster = document.getElementById("random-poster");
    poster.parentNode.removeChild(poster);

    document.getElementById("overlay").style.display = "none";
}

function getMediaList(server_address, plex_token, section) {
    debug("random_picker plugin: Fetching media list");
    var media_xml = getXML("http://" + server_address + ":32400/library/sections/" + section["section_num"] + "/all?X-Plex-Token=" + plex_token);
    debug("random_picker plugin: Fetched media list");

    if (section["type"] == "movie") {
        return media_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video");
    }
    else if (section["type"] == "show") {
        return media_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory");
    }
}

function getRandomId(server_address, plex_token, section) {
    var media_xml = getMediaList(server_address, plex_token, section);
    var random_num =Math.floor(Math.random() * media_xml.length);
    debug("random_picker plugin: Generated random number - " + random_num.toString() + " out of " + media_xml.length.toString());

    var random_media = media_xml[random_num];
    debug("random_picker plugin: Picked random media");
    debug(random_media);
    var id = random_media.getAttribute("ratingKey");
    debug("random_picker plugin: Got random media key - " + id);

    return id;
}

function displayRandom(server_address, plex_token, section) {
	debug("random_picker plugin: pick-random button clicked");
    var random_id = getRandomId(server_address, plex_token, section);
    var poster_url = "http://" + server_address + ":32400/library/metadata/" + random_id + "/poster?X-Plex-Token=" + plex_token;
    debug("random_picker plugin: Generated poster URL - " + poster_url);

    document.getElementById("overlay").style.display = "block";
    // attach click event listener on overlay to close random choice
    document.getElementById("overlay").addEventListener("click", closeRandom, false);

    var poster_element = document.createElement("div");
    poster_element.setAttribute("id", "random-poster");
    var poster_image_element = document.createElement("img");
    poster_image_element.setAttribute("id", "random-poster-image");
    poster_image_element.setAttribute("src", poster_url);
    poster_image_element.setAttribute("data-libraryid", random_id);
    poster_element.appendChild(poster_image_element);

    debug("random_picker plugin: Inserting poster element into document body");
    document.getElementsByTagName("body")[0].appendChild(poster_element);

    var refresh_icon_element = document.createElement("span");
    refresh_icon_element.setAttribute("class", "glyphicon refresh");
    refresh_icon_element.setAttribute("id", "refresh-random");
    poster_element.appendChild(refresh_icon_element);

    // attach click event listener on refresh icon to refresh random choice
    refresh_icon_element.addEventListener("click", function(){refreshRandom(server_address, plex_token, section);}, false);
    // attach click event listener on poster to open media
    poster_image_element.addEventListener("click", loadChoice, false);
}

function refreshRandom(server_address, plex_token, section) {
	debug("random_picker plugin: Refresh random button clicked");
    var random_id = getRandomId(server_address, plex_token, section);
    var poster_url = "http://" + server_address + ":32400/library/metadata/" + random_id + "/poster?X-Plex-Token=" + plex_token;
    debug("random_picker plugin: New poster URL fetched - " + poster_url);

    var poster_image_element = document.getElementById("random-poster-image");
    poster_image_element.setAttribute("src", poster_url);
    poster_image_element.setAttribute("data-libraryid", random_id);
}

function loadChoice() {
	debug("random_picker plugin: Loading choice");
    var library_id = document.getElementById("random-poster-image").getAttribute("data-libraryid");
    var new_url = document.URL.replace(/section\/\d+/, "details/%2Flibrary%2Fmetadata%2F" + library_id);
    debug("random_picker plugin: Choice url - " + new_url);

    closeRandom();
    window.location = new_url;
}

function addRandomButton(server_address, plex_token, section) {
    // don't run if element already exists on page
    debug("random_picker plugin: Checking if #pick-random element already exists before creating");
    if (document.getElementById("pick-random")) {
        debug("random_picker plugin: #pick-random element already exists. Passing");
        return;
    }

    var random_button_element = document.createElement("span");
    random_button_element.setAttribute("id", "pick-random");
    var text = document.createTextNode("Pick random");
    random_button_element.appendChild(text);

    debug("random_picker plugin: Inserting random picker button into breadcrumb-bar");
    document.getElementsByClassName("breadcrumb-bar")[0].appendChild(random_button_element);

    // attach click event listener to pick random
    debug("random_picker plugin: Attaching event listener to pick-random button");
    document.getElementById("pick-random").addEventListener("click", function(){displayRandom(server_address, plex_token, section);}, false);

    insertOverlay();
}