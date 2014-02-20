function closeRandom() {
    var poster = document.getElementById('random-poster');
    poster.parentNode.removeChild(poster);

    document.getElementById('overlay').style.display = "none";
}

function getMediaList(server_address, plex_token, section) {
    var media_xml = getXML("http://" + server_address + ':32400/library/sections/' + section["section_num"] + '/all?X-Plex-Token=' + plex_token);

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

    var random_media = media_xml[random_num];
    var id = random_media.getAttribute('ratingKey');

    return id;
}

function displayRandom(server_address, plex_token, section) {
    var random_id = getRandomId(server_address, plex_token, section);
    var poster_url = "http://" + server_address + ":32400/library/metadata/" + random_id + "/poster?X-Plex-Token=" + plex_token;

    document.getElementById('overlay').style.display = "block";
    // attach click event listener on overlay to close random choice
    document.getElementById('overlay').addEventListener("click", closeRandom, false);

    var poster_element = document.createElement('div');
    poster_element.setAttribute('id', "random-poster");
    var poster_image_element = document.createElement('img');
    poster_image_element.setAttribute('id', "random-poster-image");
    poster_image_element.setAttribute('src', poster_url);
    poster_image_element.setAttribute('data-libraryid', random_id);
    poster_element.appendChild(poster_image_element);

    document.getElementsByTagName('body')[0].appendChild(poster_element);

    var refresh_icon_element = document.createElement('span');
    refresh_icon_element.setAttribute('class', "glyphicon refresh");
    refresh_icon_element.setAttribute('id', 'refresh-random');
    poster_element.appendChild(refresh_icon_element);

    // attach click event listener on refresh icon to refresh random choice
    refresh_icon_element.addEventListener("click", function(){refreshRandom(server_address, plex_token, section);}, false);
    // attach click event listener on poster to open media
    poster_image_element.addEventListener("click", loadChoice, false);
}

function refreshRandom(server_address, plex_token, section) {
	var random_id = getRandomId(server_address, plex_token, section);
	var poster_url = "http://" + server_address + ":32400/library/metadata/" + random_id + "/poster?X-Plex-Token=" + plex_token;

	var poster_image_element = document.getElementById('random-poster-image');
    poster_image_element.setAttribute('src', poster_url);
    poster_image_element.setAttribute('data-libraryid', random_id);
}

function loadChoice() {
	var library_id = document.getElementById('random-poster-image').getAttribute('data-libraryid');
	var new_url = document.URL.replace(/section\/\d+/, "details/%2Flibrary%2Fmetadata%2F" + library_id);
	
	closeRandom();
	window.location = new_url;
}

function addRandomButton(server_address, plex_token, section) {
	// don't run if element already exists on page
    if (document.getElementById('pick-random')) {
        return;
    }

    var random_button_element = document.createElement('span');
    random_button_element.setAttribute('id', 'pick-random');
    var text = document.createTextNode("Pick random");
    random_button_element.appendChild(text);

    document.getElementsByClassName('breadcrumb-bar')[0].appendChild(random_button_element);

    // attach click event listener to pick random
    document.getElementById('pick-random').addEventListener("click", function(){displayRandom(server_address, plex_token, section);}, false);

    insertOverlay();
}