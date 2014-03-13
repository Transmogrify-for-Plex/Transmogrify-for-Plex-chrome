var show_update_text = true;
var update_text = "You can now view missing season episodes, try it now on a tv show season page! Also you can now manually set the Plex server address in the <a id='options-page-link' href='%OPTIONSURL%' target='_blank'>extension settings</a>"

var show_debug = null;
function debug(output) {
    if (show_debug == null) {
        // set show_debug for first run on this page
        utils.storage_get("debug", function (debug_){
            if (debug_ === "on") {
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

function checkIfUpdated() {
    utils.storage_get("last_version", function (last_version) {
        var version = utils.getExtensionVersion();
        // do not display if popup has been shown before
        if ((last_version && last_version === version) || !(show_update_text)) {
            return;
        }
        else {
            showUpdatePopup();
            utils.storage_set("last_version", version);
        }
    });
}

function showUpdatePopup() {
    var options_url = utils.getOptionsURL();
    var formatted_update_text = update_text.replace("%OPTIONSURL%", options_url);
    showPopup("New update! - " + formatted_update_text);
}

function closePopup() {
    var popup_container = document.getElementById("update-box");
    popup_container.parentNode.removeChild(popup_container);

    var overlay = document.getElementById("overlay");
    overlay.style.display = "none";
    overlay.removeEventListener("click", closePopup, false);
}

function showPopup(messsage) {
    var overlay = utils.insertOverlay();
    overlay.style.display = "block";

    var popup_container = document.createElement("div");
    popup_container.setAttribute("class", "update-box");
    popup_container.setAttribute("id", "update-box")

    var logo = document.createElement("img");
    logo.setAttribute("src", utils.getResourcePath("icon_transparent.png"));

    var message = document.createElement("p");
    message.innerHTML = messsage;

    popup_container.appendChild(logo);
    popup_container.appendChild(message);
    overlay.appendChild(popup_container);

    document.getElementById("options-page-link").addEventListener("click", openOptionsPage, false);
    overlay.addEventListener("click", closePopup, false);
}

function openOptionsPage() {
    var options_url = utils.getOptionsURL();
    var win = window.open(options_url, "_blank");
    win.focus();
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
                init();
            }
        }
        // check if on movie/tv show details page
        else if (/\/details\/%2Flibrary%2Fmetadata%2F(\d+)$/.test(document.URL)) {
            debug("runOnReady detected we are on movie/tv show details page");
            if (document.getElementsByClassName("item-title").length > 0 || document.getElementsByClassName("show-title").length > 0) {
                debug("Instance of .item-title or .show-title detected. Page is ready");
                window.clearInterval(interval);
                init();
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
        debug("plex_token fetched from document body - " + existing_plex_token);
        return existing_plex_token;
    }

    debug("Inserting plex_token into document body");
    var script = document.createElement("script");
    script.appendChild(document.createTextNode("("+ insertPlexToken +")();"));
    (document.body || document.head || document.documentElement).appendChild(script);

    var plex_token = document.body.getAttribute("data-plextoken");
    debug("plex_token fetched from document body - " + plex_token);
    return plex_token;
}

function getServerAddresses(plex_token, callback) {
    debug("Fetching server address");
    utils.getXML("https://plex.tv/pms/servers?X-Plex-Token=" + plex_token, true, function(servers_xml) {
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
        callback(server_addresses);
    });
}

function processLibrarySections(sections_xml) {
    var directories = sections_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory");
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

function init() {
    utils.storage_get_all(function (settings){
        main(settings);
    });
}

function main(settings) {
    debug("Running main()");

    // show popup if updated
    checkIfUpdated();

    var plex_token = getPlexToken();
    getServerAddresses(plex_token, function(server_addresses) {
        var page_url = document.URL;

        // check if on library section
        if (/\/section\/\d+$/.test(page_url)) {
            debug("main detected we are in library section");
            var page_identifier = page_url.match(/\/server\/(.[^\/]+)\/section\/(\d+)$/);
            var machine_identifier = page_identifier[1];
            var section_num = page_identifier[2];
            debug("machine identifier - " + machine_identifier);
            debug("library section - " + section_num);

            // get library sections xml
            utils.getXML("https://plex.tv/pms/system/library/sections?X-Plex-Token=" + plex_token, true, function(sections_xml) {
                var library_sections = processLibrarySections(sections_xml);
                var server = server_addresses[machine_identifier];
                var section = library_sections[machine_identifier][section_num];
                if (settings["plex_server_address"] != "" && settings["plex_server_port"] != "") {
                    debug("Plex server manual override");
                    server["address"] = settings["plex_server_address"];
                    server["port"] = settings["plex_server_port"];
                }

                if (settings["random_picker"] === "on") {
                    debug("random_picker plugin is enabled");
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

            var server = server_addresses[machine_identifier];
            if (settings["plex_server_address"] != "" && settings["plex_server_port"] != "") {
                debug("Plex server manual override");
                server["address"] = settings["plex_server_address"];
                server["port"] = settings["plex_server_port"];
            }

            // construct metadata xml link
            debug("Fetching metadata for id - " + parent_item_id);

            var metadata_xml_url = "http://" + server["address"] + ":" + server["port"] + "/library/metadata/" + parent_item_id + "?X-Plex-Token=" + server["access_token"];

            // fetch metadata xml asynchronously
            utils.getXML(metadata_xml_url, true, function(metadata_xml) {

                if (metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory").length > 0) {
                    // we're on a tv show page
                    debug("main detected we are on tv show index page");

                    if (metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0].getAttribute("type") === "show") {
                        // we're on the root show page
                        debug("main detected we are on root show page");

                        // create trakt link
                        if (settings["trakt_shows"] === "on") {
                            debug("trakt plugin is enabled");
                            trakt.init(metadata_xml, "show", server);
                        }
                        else {
                            debug("trakt plugin is disabled");
                        }
                    }
                    else if (metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0].getAttribute("type") === "season") {
                        // we're on the season page
                        debug("main detected we are on a season page");

                        // insert missing episodes
                        if (settings["missing_episodes"] === "on") {
                            debug("missing_episodes plugin is enabled");
                            missing_episodes.init(metadata_xml, server);
                        }
                        else {
                            debug("missing_episodes plugin is disabled");
                        }
                    }
                }
                else if (metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0].getAttribute("type") === "movie") {
                    // we're on a movie page
                    debug("main detected we are on a movie page");

                    // create letterboxd link
                    if (settings["letterboxd_link"] === "on") {
                        debug("letterboxd_link plugin is enabled");
                        letterboxd.init(metadata_xml);
                    }
                    else {
                        debug("letterboxd_link plugin is disabled");
                    }

                    // create youtube trailer button
                    if (settings["movie_trailers"] === "on") {
                        debug("youtube_trailer plugin is enabled");
                        youtube_trailer.init(metadata_xml);
                    }
                    else {
                        debug("youtube_trailer plugin is disabled");
                    }

                    // create rotten tomatoes link
                    if (settings["rotten_tomatoes_link"] === "on") {
                        debug("rotten_tomatoes_link plugin is enabled");
                        rotten_tomatoes.init(metadata_xml);
                    }
                    else {
                        debug("rotten_tomatoes_link plugin is disabled");
                    }

                    // create trakt link
                    if (settings["trakt_movies"] === "on") {
                        debug("trakt plugin is enabled");
                        trakt.init(metadata_xml, "movie", server);
                    }
                    else {
                        debug("trakt plugin is disabled");
                    }
                }
                else if (metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0].getAttribute("type") === "episode") {
                    // we're on an episode page

                    // create trakt link
                    if (settings["trakt_shows"] === "on") {
                        debug("trakt plugin is enabled");
                        trakt.init(metadata_xml, "episode", server);
                    }
                    else {
                        debug("trakt plugin is disabled");
                    }
                }
            });
        }
    });
}

// set the default options for extension
utils.setDefaultOptions();
debug("Set default options");

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