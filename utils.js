var global_settings;

utils = {
    debug: function(output) {
        if (global_settings["debug_unfiltered"] === "off" && typeof output === "string") {
            output = output.replace(global_plex_token, "XXXXXXXXXXXXXXXXXXXX");
            output = output.replace(/X-Plex-Token=[\w\d]{20}/, "X-Plex-Token=XXXXXXXXXXXXXXXXXXXX");
            output = output.replace(/\d+\.\d+\.\d+\.\d+/, "XXX.XXX.X.XX");
        }

        if (global_settings["debug"] === "on") {
            if (typeof output === "string") {
                console.log("Transmogrify for Plex log: " + output);
            }
            else {
                console.log(output);
            }
        }
    },

    getExtensionVersion: function() {
        var version = chrome.runtime.getManifest()["version"];
        return version;
    },

    getOptionsURL: function() {
        var options_url = chrome.extension.getURL("options.html");
        return options_url;
    },

    getStatsURL: function() {
        var stats_url = chrome.extension.getURL("stats.html");
        return stats_url;
    },

    insertOverlay: function() {
        // don't run if overlay exists on page
        utils.debug("Checking if overlay already exists before creating");
        var existing_overlay = document.getElementById("overlay");
        if (existing_overlay) {
            utils.debug("Overlay already exists. Passing");
            return existing_overlay;
        }

        var overlay = document.createElement("div");
        overlay.setAttribute("id", "overlay");

        document.body.appendChild(overlay);
        utils.debug("Inserted overlay");

        return overlay;
    },

    background_storage_set: function(key, value) {
        chrome.runtime.sendMessage({"type": "set", "key": key, "value": value});
    },

    background_storage_get: function(key, callback) {
        chrome.runtime.sendMessage({"type": "get", "key": key}, function(results) {
            callback(results);
        });
    },

    storage_set: function(key, value) {
        var hash = {};
        hash[key] = value;
        chrome.storage.sync.set(hash);
    },

    storage_get: function(key, callback) {
        chrome.storage.sync.get(key, function(result) {
            var value = result[key];
            callback(value);
        });
    },

    storage_get_all: function(callback) {
        chrome.storage.sync.get(function(results) {
            callback(results);
        });
    },

    local_storage_set: function(key, value) {
        var hash = {};
        hash[key] = value;
        chrome.storage.local.set(hash);
    },

    local_storage_get: function(key, callback) {
        chrome.storage.local.get(key, function(result) {
            var value = result[key];
            callback(value);
        });
    },

    local_storage_remove: function(key) {
        chrome.storage.local.remove(key);
    },

    cache_set: function(key, data) {
        utils.local_storage_get("cache_keys", function(cache_keys) {
            // check if cache keys don't exist yet
            if (!cache_keys) {
                cache_keys = {};
            }

            // store cached url keys with timestamps
            cache_keys[key] = {"timestamp": new Date().getTime()};
            utils.local_storage_set("cache_keys", cache_keys);

            // store cached data with url key
            utils.local_storage_set(key, data);
        });
    },

    cache_get: function(key, callback) {
        utils.local_storage_get(key, function(result) {
            if (result) {
                utils.debug("Cache hit");
                callback(result);
            }
            else {
                utils.debug("Cache miss");
                callback(null);
            }
        });
    },

    purgeStaleCaches: function(force) {
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
                if (time_now - timestamp > 259200000 || force) {
                    utils.debug("Found stale data, removing " + key);
                    utils.local_storage_remove(key);

                    delete cache_keys[key];
                    utils.local_storage_set("cache_keys", cache_keys);
                }
            }
        });
    },

    getResourcePath: function(resource) {
        return chrome.extension.getURL("resources/" + resource);
    },

    getApiKey: function(api_name) {
        var file_path = utils.getResourcePath("api_keys/" + api_name + ".txt");
        var text;
        var rawFile = new XMLHttpRequest();
        rawFile.open("GET", file_path, false);
        rawFile.onreadystatechange = function() {
            if (rawFile.readyState === 4) {
                if (rawFile.status === 200 || rawFile.status == 0) {
                    text = rawFile.responseText;
                }
            }
        }
        rawFile.send(null);
        return text;
    },

    getXML: function(url, callback) {
        utils.debug("Fetching XML from " + url);
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.onload = function(e) {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    utils.debug("Recieved XML response");
                    utils.debug(xhr.responseXML);
                    callback(xhr.responseXML);
                }
                else {
                    callback(xhr.statusText);
                }
            }
        };
        xhr.onerror = function() {
            callback(xhr.statusText);
        };
        xhr.send();
    },

    getXMLWithTimeout: function(url, timeout, callback) {
        utils.debug("Fetching XML from " + url);
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.onload = function(e) {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    utils.debug("Recieved XML response");
                    utils.debug(xhr.responseXML);
                    callback(xhr.responseXML);
                }
                else {
                    callback(xhr.statusText);
                }
            }
        };
        xhr.onerror = function() {
            callback(xhr.statusText);
        };
        xhr.timeout = timeout;
        xhr.ontimeout = function() {
            callback(xhr.statusText);
        };
        xhr.send();
    },

    getJSONWithCache: function(url, callback) {
        utils.debug("Fetching JSON from " + url);
        utils.cache_get("cache-" + url, function(result) {
            if (result) {
                callback(result);
            }
            else {
                // cache missed or stale, grabbing new data
                utils.getJSON(url, function(result) {
                    utils.cache_set("cache-" + url, result);
                    callback(result);
                });
            }
        });
    },

    getJSON: function(url, callback) {
        utils.debug("Fetching JSON from " + url);
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.onload = function(e) {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    utils.debug("Recieved JSON response");
                    utils.debug(xhr.responseText);
                    callback(JSON.parse(xhr.responseText));
                }
                else {
                    callback({"error": xhr.statusText});
                }
            }
        };
        xhr.onerror = function() {
            callback({"error": xhr.statusText});
        };
        xhr.send();
    },

    setDefaultOptions: function(callback) {
        utils.storage_get_all(function(settings) {
            global_settings = settings;

            if (!("movie_trailers" in settings)) {
                utils.storage_set("movie_trailers", "on");
            }

            if (!("letterboxd_link" in settings)) {
                utils.storage_set("letterboxd_link", "on");
            }

            if (!("random_picker" in settings)) {
                utils.storage_set("random_picker", "on");
            }

            if (!("random_picker_only_unwatched" in settings)) {
                utils.storage_set("random_picker_only_unwatched", "off");
            }

            if (!("missing_episodes" in settings)) {
                utils.storage_set("missing_episodes", "on");
            }

            if (!("rotten_tomatoes_link" in settings)) {
                utils.storage_set("rotten_tomatoes_link", "off");
            }

            if (!("rotten_tomatoes_audience" in settings)) {
                utils.storage_set("rotten_tomatoes_audience", "on");
            }

            if (!("rotten_tomatoes_citizen" in settings)) {
                utils.storage_set("rotten_tomatoes_citizen", "non_us");
            }

            if (!("trakt_movies" in settings)) {
                utils.storage_set("trakt_movies", "on");
            }

            if (!("trakt_shows" in settings)) {
                utils.storage_set("trakt_shows", "on");
            }

            if (!("plex_server_address" in settings) || !("plex_server_port" in settings)) {
                utils.storage_set("plex_server_address", "");
                utils.storage_set("plex_server_port", "");
            }

            if (!("split_added_deck" in settings)) {
                utils.storage_set("split_added_deck", "on");
            }

            if (!("canistreamit" in settings)) {
                utils.storage_set("canistreamit", "off");
            }

            if (!("imdb_link" in settings)) {
                utils.storage_set("imdb_link", "on");
            }

            if (!("tvdb_link" in settings)) {
                utils.storage_set("tvdb_link", "off");
            }

            if (!("actor_profiles" in settings)) {
                utils.storage_set("actor_profiles", "on");
            }

            if (!("stats_link" in settings)) {
                utils.storage_set("stats_link", "on");
            }

            if (!("last_version" in settings)) {
                utils.storage_set("last_version", "");
            }

            if (!("debug" in settings)) {
                utils.storage_set("debug", "off");
            }

            if (!("debug_unfiltered" in settings)) {
                utils.storage_set("debug_unfiltered", "off");
            }

            if (callback) {
                callback(settings);
            }
        });
    }
}