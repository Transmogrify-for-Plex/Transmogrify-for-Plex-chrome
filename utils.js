utils = {
    getExtensionVersion: function(callback) {
        var version = chrome.runtime.getManifest()["version"];
        callback(version);
    },

    getOptionsURL: function(callback) {
        var options_url = chrome.extension.getURL("options.html");
        callback(options_url);
    },

    insertOverlay: function() {
        // don't run if overlay exists on page
        debug("Checking if overlay already exists before creating");
        var existing_overlay = document.getElementById("overlay");
        if (existing_overlay) {
            debug("Overlay already exists. Passing");
            return existing_overlay;
        }

        var overlay = document.createElement("div");
        overlay.setAttribute("id", "overlay");

        document.body.appendChild(overlay);
        debug("Inserted overlay");

        return overlay;
    },

    storage_set: function(key, value) {
        var hash = {};
        hash[key] = value;
        chrome.storage.sync.set(hash);
    },

    storage_get: function(key, callback) {
        chrome.storage.sync.get(key, function (result) {
            var value = result[key];
            callback(value);
        });
    },

    storage_get_all: function(callback) {
        chrome.storage.sync.get(function (results) {
            callback(results);
        });
    },

    getXML: function(url, async, callback) {
        debug("Fetching XML from " + url + " with async=" + async);
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, async);
        if (async) {
            xhr.onload = function (e) {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        debug("Recieved XML response");
                        debug(xhr.responseXML);
                        callback(xhr.responseXML);
                    }
                    else {
                        callback(xhr.statusText);
                    }
                }
            };
            xhr.onerror = function () {
                callback(xhr.statusText);
            }
            xhr.send();
        }
        else {
            xhr.send();
            var resp = xhr.responseXML;
            debug("Recieved XML response");
            debug(resp);
            return resp;
        }
    },

    getJSON: function(url, async, callback) {
        debug("Fetching JSON from " + url + " with async=" + async);
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, async);
        if (async) {
            xhr.onload = function (e) {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        debug("Recieved JSON response");
                        debug(xhr.responseText);
                        callback(JSON.parse(xhr.responseText));
                    }
                    else {
                        callback({"error": xhr.statusText});
                    }
                }
            };
            xhr.onerror = function () {
                callback({"error": xhr.statusText});
            }
            xhr.send();
        }
        else {
            xhr.send();
            var resp = JSON.parse(xhr.responseText);
            debug("Recieved JSON response");
            debug(resp);
            return resp;
        }
    },

    readFile: function(file_name) {
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
    },

    setDefaultOptions: function(callback) {
        utils.storage_get_all(function(results) {
            if (!("movie_trailers" in results)) {
                utils.storage_set("movie_trailers", "on");
            }

            if (!("letterboxd_link" in results)) {
                utils.storage_set("letterboxd_link", "on");
            }

            if (!("random_picker" in results)) {
                utils.storage_set("random_picker", "on");
            }

            if (!("missing_episodes" in results)) {
                utils.storage_set("missing_episodes", "on");
            }

            if (!("rotten_tomatoes_link" in results)) {
                utils.storage_set("rotten_tomatoes_link", "off");
            }

            if (!("rotten_tomatoes_audience" in results)) {
                utils.storage_set("rotten_tomatoes_audience", "on");
            }

            if (!("rotten_tomatoes_citizen" in results)) {
                utils.storage_set("rotten_tomatoes_citizen", "non_us");
            }

            if (!("trakt_movies" in results)) {
                utils.storage_set("trakt_movies", "on");
            }

            if (!("trakt_shows" in results)) {
                utils.storage_set("trakt_shows", "on");
            }

            if (!("plex_server_address" in results) || !("plex_server_port" in results)) {
                utils.storage_set("plex_server_address", "");
                utils.storage_set("plex_server_port", "");
            }

            if (!("debug" in results)) {
                utils.storage_set("debug", "off");
            }

            if (callback) {
                callback();
            }
        });
    }
}