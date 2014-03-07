PlexWWWatch = {
    doit: function (ratingkey) {
        PlexWWWatch.enabled(function (enabled) {
            if (enabled) {
                PlexWWWatch.getItem(ratingkey, function (item) {
                    PlexWWWatch.createInfo(item.item);
                });
            }
        });
    },

    enabled: function (cb) {
        chrome.storage.sync.get("plexwwwatch_url", function (result) {
            if ("plexwwwatch_url" in result && result.plexwwwatch_url !== "") {
                cb(true);
            } else {
                cb(false);
            }
        });
    },

    getItem: function (ratingkey, cb) {
        chrome.storage.sync.get("plexwwwatch_url", function (result) {
            if ("plexwwwatch_url" in result) {
                var url = result.plexwwwatch_url + "backend/plexWatchItem.php?item=" + ratingkey;
                getAsyncJSON(url, function (error, item) {
                    console.log("got json", error, item);
                    if (!error) {
                        cb(item);
                    }
                });
            }
        });
    },

    createInfo: function (item) {
        var numWatches = PlexWWWatch.createNumWatchedElement(item);
        var timeWatched = PlexWWWatch.createTimeWatchedElement(item);
        var numCompleted = PlexWWWatch.createNumCompletedElement(item);


        var container = document.getElementsByClassName("details-poster-container")[0];
        container.appendChild(numWatches);
        container.appendChild(timeWatched);
        container.appendChild(numCompleted);
    },

    createNumWatchedElement: function (item) {
        var numWatchedDiv = document.createElement("div");
        numWatchedDiv.className = "item-available-at metadata-tags";
        var text = "Never watched";
        if (item.numWatches === 1) {
             text = "Watched one time";
        } else if (item.numWatches > 1) {
            text = "Watched " + item.numWatches + " times";
        }
        numWatchedDiv.textContent = text;

        return numWatchedDiv;
    },

    createTimeWatchedElement: function (item) {
        var timeWatchedDiv = document.createElement("div");
        timeWatchedDiv.className = "item-available-at metadata-tags";
        var text = "Nothing watched";
        if (item.timeWatched > 0) {
            text = PlexWWWatch.secondsToDuration(item.timeWatched / 1000) + " watched";
        }

        timeWatchedDiv.textContent = text;

        return timeWatchedDiv;
    },

    createNumCompletedElement: function (item) {
        var numCompletedDiv = document.createElement("div");
        numCompletedDiv.className = "item-available-at metadata-tags";
        var text = "Never Completed";
        if (item.numCompleted === 1) {
             text = "Completed one time";
        } else if (item.numCompleted > 1) {
            text = "Completed " + item.numCompleted + " times";
        }
        numCompletedDiv.textContent = text;

        return numCompletedDiv;
    },

    secondsToDuration: function (s) {
        var h = parseInt(s / 3600, 10);
        var m = parseInt(s / 60, 10) % 60;

        var ret = "";
        if (h > 0) {
            ret = ret + h + " hr ";
        }
        if (m > 0) {
            ret = ret + m + " min ";
        }
        return ret;
    }
};
