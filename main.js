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
    var overylay = utils.insertOverlay();
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

function insertPlexToken() {
    var plex_token = PLEXWEB.myPlexAccessToken;
    document.body.setAttribute("data-plextoken", plex_token);
}

function getPlexToken() {
    var existing_plex_token = document.body.getAttribute("data-plextoken");
    if (existing_plex_token) {
        debug("plex_token fetched from document body - " + plex_token);
        return plex_token;
    }

    debug("Inserting plex_token into document body");
    var script = document.createElement("script");
    script.appendChild(document.createTextNode("("+ insertPlexToken +")();"));
    (document.body || document.head || document.documentElement).appendChild(script);

    var plex_token = document.body.getAttribute("data-plextoken");
    debug("plex_token fetched from document body - " + plex_token);
    return plex_token;
}

function getServerAddresses(plex_token) {
    debug("Fetching server address");
    var servers_xml = utils.getXML("https://plex.tv/pms/servers?X-Plex-Token=" + plex_token);
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
    var sections_xml = utils.getXML("https://plex.tv/pms/system/library/sections?X-Plex-Token=" + plex_token);
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

    // check if on library section
    if (/\/section\/\d+$/.test(page_url)) {
        debug("main detected we are in library section");
        var page_identifier = page_url.match(/\/server\/(.[^\/]+)\/section\/(\d+)$/);
        var machine_identifier = page_identifier[1];
        var section_num = page_identifier[2];
        debug("machine identifier - " + machine_identifier);
        debug("library section - " + section_num);

        chrome.storage.sync.get("random_picker", function (result){
            if (result["random_picker"] === "on") {
                debug("random_picker plugin is enabled");
                var section = library_sections[machine_identifier][section_num];
                var server = server_addresses[machine_identifier];

                random_picker.init(server, section);
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
        var server = server_addresses[machine_identifier];

        var metadata_xml_link = "http://" + server["address"] + ":" + server["port"] + "/library/metadata/" + parent_item_id + "?X-Plex-Token=" + server["access_token"];

        // fetch metadata xml
        var metadata_xml = utils.getXML(metadata_xml_link);

        if (metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory").length > 0) {
            // we're on a tv show page
            debug("main detected we are on tv show index page");

            if (metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0].getAttribute("type") === "show") {
                // we're on the root show page
                debug("main detected we are on root show page");

                // create trakt link
                chrome.storage.sync.get("trakt_shows", function (result){
                    if (result["trakt_shows"] === "on") {
                        debug("trakt plugin is enabled");
                        trakt.init(metadata_xml, "show", server);
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
                chrome.storage.sync.get("missing_episodes", function (result){
                    if (result["missing_episodes"] === "on") {
                        debug("missing_episodes plugin is enabled");
                        missing_episodes.init(metadata_xml, server);
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
                if (result["letterboxd_link"] === "on") {
                    debug("letterboxd_link plugin is enabled");
                    letterboxd.init(metadata_xml);
                }
                else {
                    debug("letterboxd_link plugin is disabled");
                }
            });

            // create youtube trailer button
            chrome.storage.sync.get("movie_trailers", function (result){
                if (result["movie_trailers"] === "on") {
                    debug("youtube_trailer plugin is enabled");
                    youtube_trailer.init(metadata_xml);
                }
                else {
                    debug("youtube_trailer plugin is disabled");
                }
            });

            // create rotten tomatoes link
            chrome.storage.sync.get("rotten_tomatoes_link", function (result){
                if (result["rotten_tomatoes_link"] === "on") {
                    debug("rotten_tomatoes_link plugin is enabled");
                    rotten_tomatoes.init(metadata_xml);
                }
                else {
                    debug("rotten_tomatoes_link plugin is disabled");
                }
            });

            // create trakt link
            chrome.storage.sync.get("trakt_movies", function (result){
                if (result["trakt_movies"] === "on") {
                    debug("trakt plugin is enabled");
                    trakt.init(metadata_xml, "movie", server);
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
                if (result["trakt_shows"] === "on") {
                    debug("trakt plugin is enabled");
                    trakt.init(metadata_xml, "episode", server);
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