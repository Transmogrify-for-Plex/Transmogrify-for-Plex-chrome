var show_update_text = false;
var update_text = "Actor profiles are now available when you hover over actor's names on movie pages! Also you now have the option to only return unwatched movies using the random picker. Check out the <a id='options-page-link' href='%OPTIONSURL%' target='_blank'>extension settings</a> page, which now automatically saves changes."

var settings;

function checkIfUpdated() {
    var last_version = settings["last_version"];
    var version = utils.getExtensionVersion();
    // do not display if popup has been shown before
    if ((last_version && last_version === version) || !(show_update_text)) {
        return;
    }
    else {
        showUpdatePopup();
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

function purgeStaleCaches() {
    utils.local_storage_get("cache_keys", function(cache_keys) {
        // check if there is any cached data yet
        if (!cache_keys) {
            utils.debug("No cached data, skipping cache purge");
            return;
        }

        var time_now = new Date().getTime();

        // iterate over cache keys and check if stale
        for (var key in cache_keys) {
            var timestamp = cache_keys[key]["timestamp"];

            // 3 day cache
            if (time_now - timestamp > 259200000) {
                utils.debug("Found stale data, removing " + key);
                utils.local_storage_remove(key);

                delete cache_keys[key];
                utils.local_storage_set("cache_keys", cache_keys);
            }
        }
    });
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
    if (localStorage["myPlexAccessToken"]) {
        utils.debug("plex_token fetched from localStorage - " + localStorage["myPlexAccessToken"]);
        return localStorage["myPlexAccessToken"];
    }
    else {
        var plex_token = document.body.getAttribute("data-plextoken");

        if (plex_token === null) {
            // remove existing script if run before
            if (document.getElementById("plex-token-script")) {
                document.removeChild(document.getElementById("plex-token-script"));
            }

            utils.debug("Inserting plex_token into document body");
            var script = document.createElement("script");
            script.setAttribute("id", "plex-token-script")
            script.appendChild(document.createTextNode("("+ insertPlexToken +")();"));
            document.body.appendChild(script);

            plex_token = document.body.getAttribute("data-plextoken");
        }

        utils.debug("plex_token fetched from document body - " + plex_token);
        return plex_token;
    }
}

function getServerAddresses(requests_url, plex_token, callback) {
    utils.debug("Fetching server addresses");
    utils.getXML(requests_url + "/servers?includeLite=1&X-Plex-Token=" + plex_token, function(servers_xml) {
        var servers = servers_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Server");
        var server_addresses = {};
        for (var i = 0; i < servers.length; i++) {
            var name = servers[i].getAttribute("name");
            var address = servers[i].getAttribute("address");
            var port = servers[i].getAttribute("port");
            var machine_identifier = servers[i].getAttribute("machineIdentifier");
            var access_token = servers[i].getAttribute("accessToken");

            server_addresses[machine_identifier] = {"name": name, "address": address, "port": port, "machine_identifier": machine_identifier, "access_token": access_token};
        }

        utils.debug("Server addresses fetched");
        utils.debug(server_addresses);

        // pass server addresses to background for stats page
        utils.background_storage_set("server_addresses", server_addresses);

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
            purgeStaleCaches();
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
                if (settings["plex_server_address"] != "" && settings["plex_server_port"] != "") {
                    utils.debug("Plex server manual override");
                    server["address"] = settings["plex_server_address"];
                    server["port"] = settings["plex_server_port"];
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
            if (settings["plex_server_address"] != "" && settings["plex_server_port"] != "") {
                utils.debug("Plex server manual override");
                server["address"] = settings["plex_server_address"];
                server["port"] = settings["plex_server_port"];
            }

            // construct metadata xml link
            utils.debug("Fetching metadata for id - " + parent_item_id);

            var metadata_xml_url = "http://" + server["address"] + ":" + server["port"] + "/library/metadata/" + parent_item_id + "?X-Plex-Token=" + server["access_token"];

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