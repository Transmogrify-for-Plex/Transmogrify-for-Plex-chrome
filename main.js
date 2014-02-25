function debug(output) {
    chrome.storage.sync.get("debug", function (result){
        if (result["debug"] === "on") {
            if (typeof output === "string") {
                console.log("Transmogrify for Plex log: " + output);
            }
            else {
                console.log(output);
            }
        }
    });
}

function getXML(xml_link) {
    debug("Fetching xml from " + xml_link);
    var request = new XMLHttpRequest;
    request.open("GET", xml_link, false);
    request.send();

    var xml_doc = request.responseXML;
    debug("Recieved xml response");
    debug(xml_doc);
    return xml_doc;
}

function insertOverlay() {
    // don't run if element already exists on page
    debug("Checking if overlay already exists before creating");
    if (document.getElementById("overlay")) {
        debug("Overlay already exists. Passing");
        return;
    }

    // create dark overlay
    var overlay = document.createElement("div");
    overlay.setAttribute("id", "overlay");

    document.getElementsByTagName("body")[0].appendChild(overlay);
    debug("Created overlay");
}

function removeOverlay() {
    debug("Checking if overlay exists before removing");
    if (document.getElementById("overlay")) {
        var overlay = document.getElementById("overlay");
        overlay.parentNode.removeChild(overlay);
        debug("Overlay removed");
    }
    debug("Overlay doesn't exist. Passing");
}

function runOnReady() {
    debug("runOnReady called. Starting watch");
    var page_url = document.URL;
    var interval = window.setInterval(function() {
        if (document.URL != page_url) {
            window.clearInterval(interval);
        }
        debug("Running runOnReady loop");
        // page is ready when class 'home-btn' exists.
        // otherwise check again in 1000ms

        // check if on library section
        if (/\/section\/\d+$/.test(document.URL)) {
            debug("runOnReady detected we are in library section");
            if (document.getElementsByClassName("media-poster").length > 0) {
                debug("Instance of .media-poster detected. Page is ready");
                window.clearInterval(interval);
                main();
            }
        }
        // check if on movie/tv show details page
        else if (/\/details\/%2Flibrary%2Fmetadata%2F(\d+)$/.test(document.URL)) {
            debug("runOnReady detected we are on movie/tv show details page");
            if (document.getElementsByClassName("item-title").length > 0 || document.getElementsByClassName("show-title").length > 0) {
                debug("Instance of .item-title or .show-title detected. Page is ready");
                window.clearInterval(interval);
                main();
            }
        }
        else {
            debug("runOnReady not on recognized page");
        }
    }, 1000);
}

function prepPlexToken() {
    var plex_token = PLEXWEB.myPlexAccessToken;
    document.body.setAttribute("data-plextoken", plex_token);
}

function getPlexToken() {
    debug("Inserting plex_token into document body");
    var script = document.createElement("script");
    script.appendChild(document.createTextNode("("+ prepPlexToken +")();"));
    (document.body || document.head || document.documentElement).appendChild(script);

    debug("plex_token fetched from document body");
    return document.body.getAttribute("data-plextoken");
}

function getServerAddress(plex_token) {
    debug("Fetching server address");
    var servers_xml = getXML("https://plex.tv/pms/servers?X-Plex-Token=" + plex_token);
    var server_address = servers_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Server")[0].getAttribute("address");

    debug("Server address fetched - " + server_address);
    return server_address;
}

function getLibrarySections(plex_token) {
    debug("Fetching library sections");
    var sections_xml = getXML("https://plex.tv/pms/system/library/sections?X-Plex-Token=" + plex_token);
    var directories = sections_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory");
    debug("Library sections fetched");
    debug(directories);

    debug("Parsing library sections");
    var dir_metadata = {};
    for (var i = 0; i < directories.length; i++) {
        var type = directories[i].getAttribute("type");
        var section_num = directories[i].getAttribute("path").match(/\/(\d+)$/)[1];

        dir_metadata[section_num] = {"type": type, "section_num": section_num};
    }

    debug("Parsed library sections");
    debug(dir_metadata);
    return dir_metadata;
}

function main() {
    debug("Running main()");
    var plex_token = getPlexToken();
    var server_address = getServerAddress(plex_token);
    var library_sections = getLibrarySections(plex_token);
    var page_url = document.URL;

    // remove overlay to be safe
    removeOverlay();

    // check if on library section
    if (/\/section\/\d+$/.test(page_url)) {
        debug("main detected we are in library section");
        var section_num = page_url.match(/\/section\/(\d+)$/)[1].toString();
        debug("library section - " + section_num);

        chrome.storage.sync.get("random_picker", function (result){
            debug("Checking if random_picker plugin should run");
            if (result["random_picker"] === "on") {
                debug("random_picker plugin is enabled");
                addRandomButton(server_address, plex_token, library_sections[section_num]);
            }
            else {
                debug("random_picker plugin is disabled");
            }
        });
    }

    // check if on movie/tv show details page
    else if (/\/details\/%2Flibrary%2Fmetadata%2F(\d+)$/.test(page_url)) {
        debug("main detected we are on movie/tv show details page");
        var res = page_url.match(/metadata%2F(\d+)$/);
        var parent_item_id = res[1];
        debug("metadata id - " + parent_item_id);

        // construct xml link
        debug("Fetching metadata for id - " + parent_item_id);
        var xml_link = "http://" + server_address + ":32400/library/metadata/" + parent_item_id + "?X-Plex-Token=" + plex_token;

        // fetch xml
        var xml = getXML(xml_link);

        if (xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory").length > 0) {
            // it's a tv show index page
            debug("main detected we are on tv show index page");
        }
        else if (xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0].getAttribute("type") === "movie") {
            // it's a movie page
            debug("main detected we are on a movie page");

            // create letterboxd link
            chrome.storage.sync.get("letterboxd_link", function (result){
                debug("Checking if letterboxd_link plugin should run");
                if (result["letterboxd_link"] === "on") {
                    debug("letterboxd_link plugin is enabled");
                    createLetterboxdLink(xml);
                }
                else {
                    debug("letterboxd_link plugin is disabled");
                }
            });
            // create youtube trailer button
            chrome.storage.sync.get("movie_trailers", function (result){
                debug("Checking if movie_trailers plugin should run");
                if (result["movie_trailers"] === "on") {
                    debug("movie_trailers plugin is enabled");
                    createTrailerButton(xml);
                }
                else {
                    debug("movie_trailers plugin is disabled");
                }
            });
        }
    }
}

// set the default options for extension
debug("Setting default options");
setDefaultOptions();

// plex.tv uses a lot of JS to manipulate the DOM so the only way to tell when
// plex's JS has finished is to check for the existance of certain elements.
if (/http:\/\/plex\.tv\/web\/app\#\!\/server\/.+?/.test(document.URL)) {
    runOnReady();
}

// because plex.tv uses JS to change pages Chrome extensions don't run on every
// page load as expected. To fix this we run the script every time the window
// url hash changes.

if ("onhashchange" in window) { // event supported
    window.onhashchange = function () {
        debug("Page change detected");
        if (/http:\/\/plex\.tv\/web\/app\#\!\/server\/.+?/.test(document.URL)) {
            runOnReady();
        }
    }
}
else { // event not supported
    var storedHash = window.location.hash;
    window.setInterval(function () {
        if (window.location.hash != storedHash) {
            storedHash = window.location.hash;
            debug("Page change detected");
            if (/http:\/\/plex\.tv\/web\/app\#\!\/server\/.+?/.test(document.URL)) {
                runOnReady();
            }
        }
    }, 500);
}