utils = {
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
        chrome.storage.sync.get(function(result) {
            if (!("movie_trailers" in result)) {
                chrome.storage.sync.set({"movie_trailers": "on"});
            }

            if (!("letterboxd_link" in result)) {
                chrome.storage.sync.set({"letterboxd_link": "on"});
            }

            if (!("random_picker" in result)) {
                chrome.storage.sync.set({"random_picker": "on"});
            }

            if (!("missing_episodes" in result)) {
                chrome.storage.sync.set({"missing_episodes": "on"});
            }

            if (!("rotten_tomatoes_link" in result)) {
                chrome.storage.sync.set({"rotten_tomatoes_link": "off"});
            }

            if (!("rotten_tomatoes_audience" in result)) {
                chrome.storage.sync.set({"rotten_tomatoes_audience": "on"});
            }

            if (!("rotten_tomatoes_citizen" in result)) {
                chrome.storage.sync.set({"rotten_tomatoes_citizen": "non_us"});
            }
            if (!("trakt_movies" in result)) {
                chrome.storage.sync.set({"trakt_movies": "on"});
            }

            if (!("trakt_shows" in result)) {
                chrome.storage.sync.set({"trakt_shows": "on"});
            }

            if (!("debug" in result)) {
                chrome.storage.sync.set({"debug": "off"});
            }

            if (callback) {
                callback();
            }
        });
    }
}