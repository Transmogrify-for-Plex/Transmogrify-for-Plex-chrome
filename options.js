function saveOptions() {
    var movie_trailers = document.querySelector("input[name='movie_trailers']:checked").value;
    var letterboxd_link = document.querySelector("input[name='letterboxd_link']:checked").value;
    var trakt_movies = document.querySelector("input[name='trakt_movies']").checked;
    var trakt_shows = document.querySelector("input[name='trakt_shows']").checked;
    var random_picker = document.querySelector("input[name='random_picker']:checked").value;

    var debug = document.querySelector("input[name='debug']:checked").value;

    chrome.storage.sync.set({"movie_trailers": movie_trailers});
    chrome.storage.sync.set({"letterboxd_link": letterboxd_link});
    chrome.storage.sync.set({"random_picker": random_picker});
    if (trakt_movies) {
        chrome.storage.sync.set({"trakt_movies": "on"});
    }
    else {
        chrome.storage.sync.set({"trakt_movies": "off"});
    }
    if (trakt_shows) {
        chrome.storage.sync.set({"trakt_shows": "on"});
    }
    else {
        chrome.storage.sync.set({"trakt_shows": "off"});
    }

    chrome.storage.sync.set({"debug": debug});

    var save_button = document.getElementById("save");

    save_button.innerHTML = "Saved";
    setTimeout(function() {
        save_button.innerHTML = "Save";
    }, 1500);
}

function restoreOptions() {
    chrome.storage.sync.get("movie_trailers", function(result) {
        var radio_button = document.getElementById("trailers_" + result["movie_trailers"]);
        radio_button.checked = true;
    });

    chrome.storage.sync.get("letterboxd_link", function(result) {
        var radio_button = document.getElementById("letterboxd_" + result["letterboxd_link"]);
        radio_button.checked = true;
    });

    chrome.storage.sync.get("random_picker", function(result) {
        var radio_button = document.getElementById("random_" + result["random_picker"]);
        radio_button.checked = true;
    });

    chrome.storage.sync.get("trakt_movies", function(result) {
        var checkbox = document.getElementById("trakt_movies");
        if (result["trakt_movies"] === "on") {
            checkbox.checked = true;
        }
    });

    chrome.storage.sync.get("trakt_shows", function(result) {
        var checkbox = document.getElementById("trakt_shows");
        if (result["trakt_shows"] === "on") {
            checkbox.checked = true;
        }
    });

    chrome.storage.sync.get("debug", function(result) {
        var radio_button = document.getElementById("debug_" + result["debug"]);
        radio_button.checked = true;
    });
}

function setDefaultOptions() {
    chrome.storage.sync.get("movie_trailers", function(result) {
        if (!("movie_trailers" in result)) {
            chrome.storage.sync.set({"movie_trailers": "on"});
        }
    });

    chrome.storage.sync.get("letterboxd_link", function(result) {
        if (!("letterboxd_link" in result)) {
            chrome.storage.sync.set({"letterboxd_link": "on"});
        }
    });

    chrome.storage.sync.get("random_picker", function(result) {
        if (!("random_picker" in result)) {
            chrome.storage.sync.set({"random_picker": "on"});
        }
    });

    chrome.storage.sync.get("trakt_movies", function(result) {
        if (!("trakt_movies" in result)) {
            chrome.storage.sync.set({"trakt_movies": "on"});
        }
    });

    chrome.storage.sync.get("trakt_shows", function(result) {
        if (!("trakt_shows" in result)) {
            chrome.storage.sync.set({"trakt_shows": "on"});
        }
    });

    chrome.storage.sync.get("debug", function(result) {
        if (!("debug" in result)) {
            chrome.storage.sync.set({"debug": "off"});
        }
    });
}

document.addEventListener("DOMContentLoaded", restoreOptions);

if (document.getElementById("save")) {
    document.getElementById("save").addEventListener("click", saveOptions);
}
