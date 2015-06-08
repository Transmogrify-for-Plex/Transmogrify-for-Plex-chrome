var show_update_text = false;
var update_text = "Version 1.3.3 is here. Lots of bug fixes and changes, a full list of which can be found in the <a id='stats-page-link' href='https://forums.plex.tv/index.php/topic/99209-transmogrify-for-plex-a-browser-extension-that-adds-features-to-plexweb' target='_blank'>forum thread</a>"

var settings;
var global_plex_token;
var global_server_addresses;

function checkIfUpdated() {
    var last_version = settings["last_version"];
    var version = utils.getExtensionVersion();

    if (last_version != version && show_update_text) {
        showUpdatePopup();
        settings["last_version"] = version;
        utils.storage_set("last_version", version);
    }
}

function showUpdatePopup() {
    var options_url = utils.getOptionsURL();
    var stats_url = utils.getStatsURL();
    var formatted_update_text = update_text.replace("%OPTIONSURL%", options_url).replace("%STATSPAGEURL%", stats_url);
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

    var is_firefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
    if (is_firefox) {
        try {
            document.getElementById("options-page-link").addEventListener("click", utils.openOptionsPage, false);
        }
        catch(e) {
        }
        try {
            document.getElementById("stats-page-link").addEventListener("click", utils.openStatsPage, false);
        }
        catch(e) {
        }
    }
    overlay.addEventListener("click", closePopup, false);
}

function runOnReady() {
    utils.debug("runOnReady called. Starting watch");
    var page_url = document.URL;
    var interval = window.setInterval(function() {
        if (document.URL != page_url) {
            window.clearInterval(interval);
        }

        if ((/index\.html\#?$/.test(document.URL)) || (/http:\/\/plex\.tv\/web\/app\#?$/.test(document.URL))) {
            if (document.getElementsByTagName("h2").length > 0) {
                utils.debug("Instance of h2 tag detected. Page is ready");
                window.clearInterval(interval);
                main();
            }
        }
        // page is ready when certain elements exist.

        // check if on library section
        else if (/\/section\/\d+$/.test(document.URL)) {
            if (document.getElementsByClassName("media-poster").length > 0) {
                utils.debug("Instance of .media-poster detected. Page is ready");
                window.clearInterval(interval);
                main();
            }
        }
        // check if on movie/tv show details page
        else if (/\/details\/%2Flibrary%2Fmetadata%2F(\d+)$/.test(document.URL)) {
            if (document.getElementsByClassName("item-title").length > 0 || document.getElementsByClassName("show-title").length > 0) {
                utils.debug("Instance of .item-title or .show-title detected. Page is ready");
                window.clearInterval(interval);
                main();
            }
        }
        else {
            utils.debug("runOnReady not on recognized page");
            window.clearInterval(interval);
        }
    }, 0);
}

function insertPlexToken() {
    var plex_token = PLEXWEB.myPlexAccessToken;
    if (plex_token) {
        document.body.setAttribute("data-plextoken", plex_token);
    }
}

function getPlexToken() {
    if (global_plex_token) {
        utils.debug("plex_token is cached - " + global_plex_token);

        return global_plex_token;
    }
    else if (localStorage["myPlexAccessToken"]) {
        global_plex_token = localStorage["myPlexAccessToken"];
        utils.debug("plex_token fetched from localStorage - " + localStorage["myPlexAccessToken"]);

        return localStorage["myPlexAccessToken"];
    }
    else {
        var plex_token = document.body.getAttribute("data-plextoken");

        if (plex_token === null) {
            // remove existing script if run before
            if (document.getElementById("plex-token-script")) {
                document.body.removeChild(document.getElementById("plex-token-script"));
            }

            utils.debug("Inserting plex_token into document body");
            var script = document.createElement("script");
            script.setAttribute("id", "plex-token-script")
            script.appendChild(document.createTextNode("("+ insertPlexToken +")();"));
            document.body.appendChild(script);

            plex_token = document.body.getAttribute("data-plextoken");
        }

        global_plex_token = plex_token;
        utils.debug("plex_token fetched from document body - " + plex_token);

        return plex_token;
    }
}

function insertLoadingIcon() {
    var nav_bar_right = document.body.getElementsByClassName("nav-bar-right")[0];

    var list_element = document.createElement("li");
    list_element.setAttribute("id", "loading-extension");

    var img = document.createElement("img");
    img.setAttribute("src", utils.getResourcePath("loading_extension.gif"));

    list_element.appendChild(img);
    nav_bar_right.insertBefore(list_element, nav_bar_right.firstChild);
}

function removeLoadingIcon() {
    var loading_icon = document.getElementById("loading-extension");
    if (loading_icon) {
        loading_icon.parentNode.removeChild(loading_icon);
    }
}

function getServerAddresses(requests_url, plex_token, callback) {
    if (global_server_addresses) {
        utils.debug("Server addresses are already cached");
        utils.debug(global_server_addresses);

        callback(global_server_addresses);
    }
    else {
        utils.debug("Fetching server addresses");

        insertLoadingIcon();

        utils.getXML(requests_url + "/resources?includeHttps=1&X-Plex-Token=" + plex_token, function(servers_xml) {
            var devices = servers_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Device");

            var task_counter = 0;
            var task_completed = function() {
                utils.debug("Server ping task finished");
                task_counter--;

                // check if all async tasks are finished
                if (task_counter === 0) {
                    utils.debug("All server ping tasks finished");

                    utils.debug("Server addresses fetched");
                    for (var machine_identifier in server_addresses) {
                        utils.debug(server_addresses[machine_identifier]);
                    }

                    // remove offline servers, which return a blank address from plex.tv
                    for (var machine_identifier in server_addresses) {
                        if (server_addresses[machine_identifier]["uri"] === "") {
                            utils.debug("Removing offline server - " + machine_identifier);
                            delete server_addresses[machine_identifier];
                        }
                    }

                    // pass server addresses to background for stats page
                    utils.background_storage_set("server_addresses", server_addresses);

                    // set global_server_addresses so results are cached
                    global_server_addresses = server_addresses;

                    removeLoadingIcon();
                    callback(server_addresses);
                }
            };

            var server_addresses = {};
            for (var i = 0; i < devices.length; i++) {
                var device = devices[i];
                var connections = device.getElementsByTagName("Connection");
                var name = device.getAttribute("name");
                var machine_identifier = device.getAttribute("clientIdentifier");
                var access_token = device.getAttribute("accessToken");

                for (var j = 0; j < connections.length; j++) {
                    var connection = connections[j];
                    var uri = connection.getAttribute("uri");
                    var local = connection.getAttribute("local") == 1;
                    task_counter += 1;

                    (function (machine_identifier, name, uri, access_token, local) {
                        utils.getXMLWithTimeout(uri + "?X-Plex-Token=" + access_token, 2000, function(server_xml) {
                            // use address if we can reach it
                            if (server_xml && server_xml != "Unauthorized" && server_xml.getElementsByTagName("MediaContainer")[0].getAttribute("machineIdentifier") === machine_identifier) {
                                utils.debug("Using address for " + machine_identifier + " - " + uri);

                                if (server_addresses[machine_identifier] && local) {
                                    // Local devices should override any remote
                                    utils.debug("Using local address for " + machine_identifier + " - " + uri);
                                    server_addresses[machine_identifier]["uri"] = uri;
                                } else if (!server_addresses[machine_identifier]) {
                                    // We found our first match!
                                    utils.debug("Using address for " + machine_identifier + " - " + uri);
                                    server_addresses[machine_identifier] = {
                                        "name": name,
                                        "machine_identifier": machine_identifier,
                                        "access_token": access_token,
                                        "uri": uri,
                                    };
                                }
                            }
                            else {
                                utils.debug("Failed to ping address for " + machine_identifier + " - " + uri);
                            }

                            task_completed();
                        });
                    }(machine_identifier, name, uri, access_token, local));
                }
            }
        });
    }
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

    utils.debug("Parsed library sections");
    utils.debug(dir_metadata);
    return dir_metadata;
}

function main() {
    utils.debug("Running main()");

    // show popup if updated
    checkIfUpdated();

    var page_url = document.URL;
    var plex_token = getPlexToken();

    // add observer for fast user switching functionality, to reload token and server addresses
    var observer = new MutationObserver(function(mutations) {
        observer.disconnect();

        utils.debug("User switched");
        global_server_addresses = null;
        global_plex_token = null;
        runOnReady();
    });

    observer.observe(document.getElementsByClassName("dropdown-poster-container")[0], {subtree: true, childList: true});

    // use plex.tv for API requests if we have plex token, otherwise use server URL
    // as user is on local server and not signed in
    var requests_url;
    if (plex_token) {
        requests_url = "https://plex.tv/pms";
    }
    else {
        var url_matches = page_url.match(/^https?\:\/\/(.+):(\d+)\/web\/.+/);
        requests_url = "http://" + url_matches[1] + ":" + url_matches[2];
    }
    utils.debug("requests_url set as " + requests_url);

    getServerAddresses(requests_url, plex_token, function(server_addresses) {
        // insert stats page link
        if (settings["stats_link"] === "on") {
            utils.debug("stats plugin is enabled");
            stats.init();
        }
        else {
            utils.debug("stats plugin is disabled");
        }

        // check if on dashboard page
        if ((/index\.html\#?$/.test(page_url)) || (/http:\/\/plex\.tv\/web\/app\#?$/.test(page_url))) {
            utils.debug("main detected we are on dashboard page");

            if (settings["split_added_deck"] === "on") {
                utils.debug("split_added_deck plugin is enabled");
                split_added_deck.init();
            }
            else {
                utils.debug("split_added_deck plugin is disabled");
            }

            // only purge caches when viewing main page
            utils.purgeStaleCaches();
        }

        // check if on library section
        else if (/\/section\/\d+$/.test(page_url)) {
            utils.debug("main detected we are in library section");
            var page_identifier = page_url.match(/\/server\/(.[^\/]+)\/section\/(\d+)$/);
            var machine_identifier = page_identifier[1];
            var section_num = page_identifier[2];
            utils.debug("machine identifier - " + machine_identifier);
            utils.debug("library section - " + section_num);

            // get library sections xml
            var library_sections_url = requests_url + "/system/library/sections?X-Plex-Token=" + plex_token;
            utils.getXML(library_sections_url, function(sections_xml) {
                var library_sections = processLibrarySections(sections_xml);
                var server;
                if (server_addresses) {
                    server = server_addresses[machine_identifier];
                }
                else {
                    server = {};
                }
                var section = library_sections[machine_identifier][section_num];

                // override server address if defined in settings
                if (settings["plex_server_uri"] != "") {
                    utils.debug("Plex server manual override");
                    server["uri"] = settings["plex_server_uri"];
                }

                if (settings["random_picker"] === "on") {
                    utils.debug("random_picker plugin is enabled");
                    random_picker.init(server, section, settings["random_picker_only_unwatched"]);
                }
                else {
                    utils.debug("random_picker plugin is disabled");
                }
            });
        }

        // check if on movie/tv show details page
        else if (/\/details\/%2Flibrary%2Fmetadata%2F(\d+)$/.test(page_url)) {
            utils.debug("main detected we are on movie/tv show details page");
            var page_identifier = page_url.match(/\/server\/(.[^\/]+)\/details\/%2Flibrary%2Fmetadata%2F(\d+)$/);
            var machine_identifier = page_identifier[1];
            var parent_item_id = page_identifier[2];
            utils.debug("metadata id - " + parent_item_id);

            var server = server_addresses[machine_identifier];

            // override server address if defined in settings
            if (settings["plex_server_uri"] != "") {
                utils.debug("Plex server manual override");
                server["uri"] = settings["uri"];
            }

            // construct metadata xml link
            utils.debug("Fetching metadata for id - " + parent_item_id);

            var metadata_xml_url = server["uri"] + "/library/metadata/" + parent_item_id + "?X-Plex-Token=" + server["access_token"];

            // fetch metadata xml asynchronously
            utils.getXML(metadata_xml_url, function(metadata_xml) {

                if (metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory").length > 0) {
                    // we're on a tv show page
                    utils.debug("main detected we are on tv show index page");

                    if (metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0].getAttribute("type") === "show") {
                        // we're on the root show page
                        utils.debug("main detected we are on root show page");

                        // create trakt link
                        if (settings["trakt_shows"] === "on") {
                            utils.debug("trakt plugin is enabled");
                            trakt.init(metadata_xml, "show", server);
                        }
                        else {
                            utils.debug("trakt plugin is disabled");
                        }

                        // create tvdb link
                        if (settings["tvdb_link"] === "on") {
                            utils.debug("tvdb plugin is enabled");
                            tvdb.init(metadata_xml);
                        }
                        else {
                            utils.debug("tvdb plugin is disabled");
                        }

                        // insert missing seasons
                        if (settings["missing_episodes"] === "on") {
                            utils.debug("missing_episodes plugin is enabled");
                            missing_episodes.init(metadata_xml, server, "seasons");
                        }
                        else {
                            utils.debug("missing_episodes plugin is disabled");
                        }
                    }
                    else if (metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0].getAttribute("type") === "season") {
                        // we're on the season page
                        utils.debug("main detected we are on a season page");

                        // insert missing episodes
                        if (settings["missing_episodes"] === "on") {
                            utils.debug("missing_episodes plugin is enabled");
                            missing_episodes.init(metadata_xml, server, "episodes");
                        }
                        else {
                            utils.debug("missing_episodes plugin is disabled");
                        }
                    }
                }
                else if (metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0].getAttribute("type") === "movie") {
                    // we're on a movie page
                    utils.debug("main detected we are on a movie page");

                    // insert canistreamit widget
                    if (settings["canistreamit"] === "on") {
                        utils.debug("canistreamit plugin is enabled");
                        canistreamit.init(metadata_xml);
                    }
                    else {
                        utils.debug("canistreamit plugin is disabled");
                    }

                    // create letterboxd link
                    if (settings["letterboxd_link"] === "on") {
                        utils.debug("letterboxd_link plugin is enabled");
                        letterboxd.init(metadata_xml);
                    }
                    else {
                        utils.debug("letterboxd_link plugin is disabled");
                    }

                    // insert themoviedb link
                    if (settings["themoviedb_link"] === "on") {
                        utils.debug("themoviedb plugin is enabled");
                        themoviedb.init(metadata_xml);
                    }
                    else {
                        utils.debug("themoviedb plugin is disabled");
                    }

                    // insert imdb link
                    if (settings["imdb_link"] === "on") {
                        utils.debug("imdb plugin is enabled");
                        imdb.init(metadata_xml);
                    }
                    else {
                        utils.debug("imdb plugin is disabled");
                    }

                    // create youtube trailer button
                    if (settings["movie_trailers"] === "on") {
                        utils.debug("youtube_trailer plugin is enabled");
                        youtube_trailer.init(metadata_xml);
                    }
                    else {
                        utils.debug("youtube_trailer plugin is disabled");
                    }

                    // create rotten tomatoes link
                    if (settings["rotten_tomatoes_link"] === "on") {
                        utils.debug("rotten_tomatoes_link plugin is enabled");
                        rotten_tomatoes.init(metadata_xml, settings["rotten_tomatoes_citizen"], settings["rotten_tomatoes_audience"]);
                    }
                    else {
                        utils.debug("rotten_tomatoes_link plugin is disabled");
                    }

                    // create trakt link
                    if (settings["trakt_movies"] === "on") {
                        utils.debug("trakt plugin is enabled");
                        trakt.init(metadata_xml, "movie", server);
                    }
                    else {
                        utils.debug("trakt plugin is disabled");
                    }

                    // create actors profiles
                    if (settings["actor_profiles"] === "on") {
                        utils.debug("actor_profiles plugin is enabled");
                        actor_profiles.init(metadata_xml);
                    }
                    else {
                        utils.debug("actor_profiles plugin is disabled");
                    }
                }
                else if (metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0].getAttribute("type") === "episode") {
                    // we're on an episode page

                    // create trakt link
                    if (settings["trakt_shows"] === "on") {
                        utils.debug("trakt plugin is enabled");
                        trakt.init(metadata_xml, "episode", server);
                    }
                    else {
                        utils.debug("trakt plugin is disabled");
                    }
                }
            });
        }
    });
}

// set the default options for extension
utils.setDefaultOptions(function(stored_settings) {
    settings = stored_settings;

    // Plex/Web uses a lot of JS to manipulate the DOM so the only way to tell when
    // plex's JS has finished is to check for the existance of certain elements.
    runOnReady();
});

// because Plex/Web uses JS to change pages Chrome extensions don't run on every
// page load as expected. To fix this we run the script every time the window
// url hash changes.
window.onhashchange = function() {
    utils.debug("Page change detected");
    runOnReady();
}