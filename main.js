function getXML(xml_link) {
    var request = new XMLHttpRequest;
    request.open("GET", xml_link, false);
    request.send();

    var xml_doc = request.responseXML;
    return xml_doc;
}

function insertOverlay() {
    // don't run if element already exists on page
    if (document.getElementById("overlay")) {
        return;
    }

    // create dark overlay
    var overlay = document.createElement("div");
    overlay.setAttribute("id", "overlay");

    document.getElementsByTagName("body")[0].appendChild(overlay);
}

function removeOverlay() {
    if (document.getElementById("overlay")) {
        var overlay = document.getElementById("overlay");
        overlay.parentNode.removeChild(overlay);
    }
}

function runOnReady() {
    var interval = window.setInterval(function() {
        // page is ready when class 'home-btn' exists.
        // otherwise check again in 1000ms
        if (document.getElementsByClassName("home-btn").length > 0) {
            main();
            window.clearInterval(interval);
        }
    }, 1500);
}

function prepPlexToken() {
    var plex_token = PLEXWEB.myPlexAccessToken;
    document.body.setAttribute("data-plextoken", plex_token);
}

function getPlexToken() {
    var script = document.createElement("script");
    script.appendChild(document.createTextNode("("+ prepPlexToken +")();"));
    (document.body || document.head || document.documentElement).appendChild(script);

    return document.body.getAttribute("data-plextoken");
}

function getServerAddress(plex_token) {
    var servers_xml = getXML("https://plex.tv/pms/servers?X-Plex-Token=" + plex_token);

    return servers_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Server")[0].getAttribute("address");
}

function getLibrarySections(plex_token) {
    var sections_xml = getXML("https://plex.tv/pms/system/library/sections?X-Plex-Token=" + plex_token);
    var directories = sections_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory");

    var dir_metadata = {};
    for (var i = 0; i < directories.length; i++) {
        var type = directories[i].getAttribute("type");
        var section_num = directories[i].getAttribute("path").match(/\/(\d+)$/)[1];

        dir_metadata[section_num] = {"type": type, "section_num": section_num};
    }

    return dir_metadata;
}

function main() {
    var plex_token = getPlexToken();
    var server_address = getServerAddress(plex_token);
    var library_sections = getLibrarySections(plex_token);
    var page_url = document.URL;

    // remove overlay to be safe
    removeOverlay();

    // check if on library section
    if (/\/section\/\d+$/.test(page_url)) {
        var section_num = page_url.match(/\/section\/(\d+)$/)[1].toString();

        chrome.storage.sync.get("random_picker", function (result){
            if (result["random_picker"] === "on") {
                addRandomButton(server_address, plex_token, library_sections[section_num]);
            }
        });
    }

    // check if on movie/tv show details page
    else if (/\/details\/%2Flibrary%2Fmetadata%2F(\d+)$/.test(page_url)) {
        var res = page_url.match(/metadata%2F(\d+)$/);
        var parent_item_id = res[1];

        // construct xml link
        var xml_link = "http://" + server_address + ":32400/library/metadata/" + parent_item_id + "?X-Plex-Token=" + plex_token;

        // fetch xml
        var xml = getXML(xml_link);


        if (xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory").length > 0) {
            // It's a tv show index page
        }
        // check if movie
        else if (xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0].getAttribute("type") === "movie") {
            // create letterboxd link
            chrome.storage.sync.get("letterboxd_link", function (result){
                if (result["letterboxd_link"] === "on") {
                    createLetterboxdLink(xml);
                }
            });
            // create youtube trailer button
            chrome.storage.sync.get("movie_trailers", function (result){
                if (result["movie_trailers"] === "on") {
                    createTrailerButton(xml);
                }
            });
        }
    }
}

// set the default options for extension
setDefaultOptions();

// plex.tv uses a lot of JS to manipulate the DOM so the only way to tell when
// plex's JS has finished is to check for the existance of certain elements.
runOnReady();

// because plex.tv uses JS to change pages Chrome extensions don't run on every
// page load as expected. To fix this we run the script every time the window
// url hash changes.

if ("onhashchange" in window) { // event supported
    window.onhashchange = function () {
        runOnReady();
    }
}
else { // event not supported
    var storedHash = window.location.hash;
    window.setInterval(function () {
        if (window.location.hash != storedHash) {
            storedHash = window.location.hash;
            runOnReady();
        }
    }, 100);
}