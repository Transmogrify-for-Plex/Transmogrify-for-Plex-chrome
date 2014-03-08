utils = {
    insertOverlay: function() {
        // don't run if overlay exists on page
        debug("Checking if overlay already exists before creating");
        if (document.getElementById("overlay")) {
            debug("Overlay already exists. Passing");
            return;
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
    }
}