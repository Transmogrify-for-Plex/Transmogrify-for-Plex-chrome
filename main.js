var show_update_text = false;
var update_text = "Rotten Tomatoes ratings can now be enabled in the <a href='" + chrome.extension.getURL("options.html") + "' target='_blank'>extension settings!</a>"

var show_debug = null;
function debug(output) {
    if (show_debug == null) {
        // set show_debug for first run on this page
        chrome.storage.sync.get("debug", function (result){
            if (result["debug"] === "on") {
                show_debug = true;
            }
            else {
                show_debug = false;
            }
        });
    }
    if (show_debug) {
        if (typeof output === "string") {
            console.log("Transmogrify for Plex log: " + output);
        }
        else {
            console.log(output);
        }
    }
}

function closePopup() {
    var popup_container = document.getElementById("update-box");
    popup_container.parentNode.removeChild(popup_container);

    var overlay = document.getElementById("overlay");
    overlay.style.display = "none";
    overlay.removeEventListener("click", closePopup, false);
}

function showPopup(messsage) {
    var overylay = insertOverlay();
    overlay.style.display = "block";

    var popup_container = document.createElement("div");
    popup_container.setAttribute("class", "update-box");
    popup_container.setAttribute("id", "update-box")

    var logo = document.createElement("img");
    logo.setAttribute("src", chrome.extension.getURL("resources/icon_transparent.png"));

    var message = document.createElement("p");
    message.innerHTML = messsage;

    popup_container.appendChild(logo);
    popup_container.appendChild(message);
    overlay.appendChild(popup_container);

    overlay.addEventListener("click", closePopup, false);
}

function showUpdatePopup() {
    chrome.storage.local.get("last_version", function (result) {
        var current_version = chrome.runtime.getManifest()["version"];
        // do not display if popup has been shown before
        if ((result["last_version"] && result["last_version"] === current_version) || !(show_update_text)) {
            return;
        }
        else {
            showPopup("New update! - " + update_text);
            chrome.storage.local.set({"last_version": current_version});
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

function getJSON(json_link) {
    debug("Fetching json from " + json_link);
    var request = new XMLHttpRequest;
    request.open("GET", json_link, false);
    request.send();

    var json_resp = JSON.parse(request.responseText);
    debug("Recieved json response");
    debug(json_resp);
    return json_resp;
}

function readFile(file_name) {
    var text;
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", file_name, false);
    rawFile.onreadystatechange = function() {
        if (rawFile.readyState === 4) {
            if (rawFile.status === 200 || rawFile.status == 0) {
                text = rawFile.responseText;
            }
        }
    }
    rawFile.send(null);
    return text;
}

function getMetadata(server_address, server_port, id, access_token) {
    return getXML("http://" + server_address + ":" + server_port + "/library/metadata/" + id + "?X-Plex-Token=" + access_token);
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

    return overlay;
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
        // page is ready when certain elements exist.
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

    var plex_token = document.body.getAttribute("data-plextoken");
    debug("plex_token fetched from document body - " + plex_token);
    return plex_token;
}

function getServerAddresses(plex_token) {
    debug("Fetching server address");
    var servers_xml = getXML("https://plex.tv/pms/servers?X-Plex-Token=" + plex_token);
    var servers = servers_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Server");
    var server_addresses = {};
    for (var i = 0; i < servers.length; i++) {
        var address = servers[i].getAttribute("address");
        var port = servers[i].getAttribute("port");
        var machine_identifier = servers[i].getAttribute("machineIdentifier");
        var access_token = servers[i].getAttribute("accessToken");

        server_addresses[machine_identifier] = {"address": address, "port": port, "machine_identifier": machine_identifier, "access_token": access_token};
    }

    debug("Server addresses fetched");
    debug(server_addresses);
    return server_addresses;
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
        var machine_identifier = directories[i].getAttribute("machineIdentifier");

        if (machine_identifier in dir_metadata) {
            dir_metadata[machine_identifier][section_num] = {"type": type, "section_num": section_num};
        }
        else {
            dir_metadata[machine_identifier] = {};
            dir_metadata[machine_identifier][section_num] = {"type": type, "section_num": section_num};
        }
    }

    debug("Parsed library sections");
    debug(dir_metadata);
    return dir_metadata;
}

function main() {
    debug("Running main()");

    // show popup if updated
    showUpdatePopup();

    var plex_token = getPlexToken();
    var server_addresses = getServerAddresses(plex_token);
    var library_sections = getLibrarySections(plex_token);
    var page_url = document.URL;

    // remove overlay to be safe
    removeOverlay();

    // check if on library section
    if (/\/section\/\d+$/.test(page_url)) {
        debug("main detected we are in library section");
        var page_identifier = page_url.match(/\/server\/(.[^\/]+)\/section\/(\d+)$/);
        var machine_identifier = page_identifier[1];
        var section_num = page_identifier[2];
        debug("machine identifier - " + machine_identifier);
        debug("library section - " + section_num);

        chrome.storage.sync.get("random_picker", function (result){
            debug("Checking if random_picker plugin should run");
            if (result["random_picker"] === "on") {
                debug("random_picker plugin is enabled");
                var server_address = server_addresses[machine_identifier]["address"];
                var server_port = server_addresses[machine_identifier]["port"];
                var access_token = server_addresses[machine_identifier]["access_token"];
                var section_data = library_sections[machine_identifier][section_num];

                addRandomButton(server_address, server_port, access_token, section_data);
            }
            else {
                debug("random_picker plugin is disabled");
            }
        });
    }

    // check if on movie/tv show details page
    else if (/\/details\/%2Flibrary%2Fmetadata%2F(\d+)$/.test(page_url)) {
        debug("main detected we are on movie/tv show details page");
        var page_identifier = page_url.match(/\/server\/(.[^\/]+)\/details\/%2Flibrary%2Fmetadata%2F(\d+)$/);
        var machine_identifier = page_identifier[1];
        var parent_item_id = page_identifier[2];
        debug("metadata id - " + parent_item_id);

        // construct metadata xml link
        debug("Fetching metadata for id - " + parent_item_id);
        var server_address = server_addresses[machine_identifier]["address"];
        var server_port = server_addresses[machine_identifier]["port"];
        var access_token = server_addresses[machine_identifier]["access_token"];

        var metadata_xml_link = "http://" + server_address + ":" + server_port + "/library/metadata/" + parent_item_id + "?X-Plex-Token=" + access_token;

        // fetch metadata xml
        var metadata_xml = getXML(metadata_xml_link);

        if (metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory").length > 0) {
            // we're on a tv show page
            debug("main detected we are on tv show index page");

            if (metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0].getAttribute("type") === "show") {
                // we're on the root show page
                debug("main detected we are on root show page");

                // create trakt link
                chrome.storage.sync.get("trakt_shows", function (result){
                    debug("Checking if trakt plugin should run");
                    if (result["trakt_shows"] === "on") {
                        debug("trakt plugin is enabled");
                        createTraktLink(metadata_xml, "show", server_address, server_port, access_token);
                    }
                    else {
                        debug("trakt plugin is disabled");
                    }
                });
            }
            else if (metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0].getAttribute("type") === "season") {
                // we're on the season page
                debug("main detected we are on a season page");

                // insert missing episodes
                // insertMissingEpisodes(metadata_xml, server_address, server_port, access_token);
                chrome.storage.sync.get("missing_episodes", function (result){
                    debug("Checking if missing_episodes plugin should run");
                    if (result["missing_episodes"] === "on") {
                        debug("missing_episodes plugin is enabled");
                        insertMissingEpisodes(metadata_xml, server_address, server_port, access_token);
                    }
                    else {
                        debug("missing_episodes plugin is disabled");
                    }
                });
            }
        }
        else if (metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0].getAttribute("type") === "movie") {
            // we're on a movie page
            debug("main detected we are on a movie page");

            // create letterboxd link
            chrome.storage.sync.get("letterboxd_link", function (result){
                debug("Checking if letterboxd_link plugin should run");
                if (result["letterboxd_link"] === "on") {
                    debug("letterboxd_link plugin is enabled");
                    createLetterboxdLink(metadata_xml);
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
                    createTrailerButton(metadata_xml);
                }
                else {
                    debug("movie_trailers plugin is disabled");
                }
            });

            // create rotten tomatoes link
            chrome.storage.sync.get("rotten_tomatoes_link", function (result){
                debug("Checking if rotten_tomatoes_link plugin should run");
                if (result["rotten_tomatoes_link"] === "on") {
                    debug("rotten_tomatoes_link plugin is enabled");
                    runRottenTomatoes(metadata_xml);
                }
                else {
                    debug("rotten_tomatoes_link plugin is disabled");
                }
            });

            // create trakt link
            chrome.storage.sync.get("trakt_movies", function (result){
                debug("Checking if trakt plugin should run");
                if (result["trakt_movies"] === "on") {
                    debug("trakt plugin is enabled");
                    createTraktLink(metadata_xml, "movie", server_address, server_port, access_token);
                }
                else {
                    debug("trakt plugin is disabled");
                }
            });
        }
        else if (metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0].getAttribute("type") === "episode") {
            // we're on an episode page

            // create trakt link
            chrome.storage.sync.get("trakt_shows", function (result){
                debug("Checking if trakt plugin should run");
                if (result["trakt_shows"] === "on") {
                    debug("trakt plugin is enabled");
                    createTraktLink(metadata_xml, "episode", server_address, server_port, access_token);
                }
                else {
                    debug("trakt plugin is disabled");
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