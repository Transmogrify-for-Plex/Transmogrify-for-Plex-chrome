function saveOptions() {
    var movie_trailers = document.querySelector("input[name='movie_trailers']:checked").value;
    var letterboxd_link = document.querySelector("input[name='letterboxd_link']:checked").value;
    var rotten_tomatoes_link = document.querySelector("input[name='rotten_tomatoes_link']:checked").value;
    var rotten_tomatoes_audience = document.querySelector("input[name='rotten_tomatoes_audience']").checked;
    var rotten_tomatoes_citizen = document.querySelector("input[name='rotten_tomatoes_citizen']:checked").value;
    var trakt_movies = document.querySelector("input[name='trakt_movies']").checked;
    var trakt_shows = document.querySelector("input[name='trakt_shows']").checked;
    var random_picker = document.querySelector("input[name='random_picker']:checked").value;
    var plexwwwatch_url = document.getElementById("plexwwwatch_url").value;

    var debug = document.querySelector("input[name='debug']:checked").value;

    chrome.storage.sync.set({"movie_trailers": movie_trailers});
    chrome.storage.sync.set({"letterboxd_link": letterboxd_link});
    chrome.storage.sync.set({"random_picker": random_picker});
    chrome.storage.sync.set({"rotten_tomatoes_link": rotten_tomatoes_link});
    chrome.storage.sync.set({"rotten_tomatoes_citizen": rotten_tomatoes_citizen});
    if (rotten_tomatoes_audience) {
        chrome.storage.sync.set({"rotten_tomatoes_audience": "on"});
    }
    else {
        chrome.storage.sync.set({"rotten_tomatoes_audience": "off"});
    }
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
    chrome.storage.sync.set({"plexwwwatch_url": plexwwwatch_url});

    chrome.storage.sync.set({"debug": debug});

    var save_button = document.getElementById("save");

    save_button.innerHTML = "Saved";
    setTimeout(function() {
        save_button.innerHTML = "Save";
    }, 1500);
}

function restoreOptions() {
    setDefaultOptions();

    chrome.storage.sync.get("movie_trailers", function(result) {
        var radio_button;
        if (result["movie_trailers"]) {
            radio_button = document.getElementById("trailers_" + result["movie_trailers"]);
        }
        else {
            radio_button = document.getElementById("trailers_on");
        }
        radio_button.checked = true;
    });

    chrome.storage.sync.get("letterboxd_link", function(result) {
        var radio_button;
        if (result["letterboxd_link"]) {
            radio_button = document.getElementById("letterboxd_" + result["letterboxd_link"]);
        }
        else {
            radio_button = document.getElementById("letterboxd_on");
        }
        radio_button.checked = true;
    });

    chrome.storage.sync.get("random_picker", function(result) {
        var radio_button;
        if (result["random_picker"]) {
            radio_button = document.getElementById("random_" + result["random_picker"]);
        }
        else {
            radio_button = document.getElementById("random_on");
        }
        radio_button.checked = true;
    });

    chrome.storage.sync.get("rotten_tomatoes_link", function(result) {
        var radio_button;
        if (result["rotten_tomatoes_link"]) {
            radio_button = document.getElementById("rotten_tomatoes_" + result["rotten_tomatoes_link"]);
        }
        else {
            radio_button = document.getElementById("rotten_tomatoes_off");
        }
        radio_button.checked = true;
        refreshExtraOptions();
    });

    chrome.storage.sync.get("rotten_tomatoes_audience", function(result) {
        var checkbox;
        if (result["rotten_tomatoes_audience"]) {
            checkbox = document.getElementById("rotten_tomatoes_audience");
            if (result["rotten_tomatoes_audience"] === "on") {
                checkbox.checked = true;
            }
        }
        else {
            checkbox = document.getElementById("rotten_tomatoes_audience");
            checkbox.checked = true;
        }
    });

    chrome.storage.sync.get("rotten_tomatoes_citizen", function(result) {
        var radio_button;
        if (result["rotten_tomatoes_citizen"]) {
            radio_button = document.getElementById("rotten_tomatoes_citizen_" + result["rotten_tomatoes_citizen"]);
        }
        else {
            radio_button = document.getElementById("rotten_tomatoes_citizen_non_us");
        }
        radio_button.checked = true;
    });

    chrome.storage.sync.get("trakt_movies", function(result) {
        var checkbox;
        if (result["trakt_movies"]) {
            checkbox = document.getElementById("trakt_movies");
            if (result["trakt_movies"] === "on") {
                checkbox.checked = true;
            }
        }
        else {
            checkbox = document.getElementById("trakt_movies");
            checkbox.checked = true;
        }
    });

    chrome.storage.sync.get("trakt_shows", function(result) {
        var checkbox;
        if (result["trakt_shows"]) {
            checkbox = document.getElementById("trakt_shows");
            if (result["trakt_shows"] === "on") {
                checkbox.checked = true;
            }
        }
        else {
            checkbox = document.getElementById("trakt_shows");
            checkbox.checked = true;
        }
    });

    chrome.storage.sync.get("plexwwwatch_url", function (result) {
        if ("plexwwwatch_url" in result) {
            document.getElementById("plexwwwatch_url").value = result.plexwwwatch_url;
        }
    });

    chrome.storage.sync.get("debug", function(result) {
        var radio_button;
        if (result["debug"]) {
            radio_button = document.getElementById("debug_" + result["debug"]);
        }
        else {
            radio_button = document.getElementById("debug_off");
        }
        radio_button.checked = true;
    });

    document.getElementById("rotten_tomatoes_on").addEventListener("click", refreshExtraOptions, false);
    document.getElementById("rotten_tomatoes_off").addEventListener("click", refreshExtraOptions, false);
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

    chrome.storage.sync.get("rotten_tomatoes_link", function(result) {
        if (!("rotten_tomatoes_link" in result)) {
            chrome.storage.sync.set({"rotten_tomatoes_link": "off"});
        }
    });

    chrome.storage.sync.get("rotten_tomatoes_audience", function(result) {
        if (!("rotten_tomatoes_audience" in result)) {
            chrome.storage.sync.set({"rotten_tomatoes_audience": "on"});
        }
    });

    chrome.storage.sync.get("rotten_tomatoes_citizen", function(result) {
        if (!("rotten_tomatoes_citizen" in result)) {
            chrome.storage.sync.set({"rotten_tomatoes_citizen": "non_us"});
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

    chrome.storage.sync.get("plexwwwatch_url", function(result) {
        if (!(plexwatch_url in result)) {
            chrome.storage.sync.set({"plexwatch_url": ""});
        }
    });

    chrome.storage.sync.get("debug", function(result) {
        if (!("debug" in result)) {
            chrome.storage.sync.set({"debug": "off"});
        }
    });
}

function refreshExtraOptions() {
    var extra_options_elements = document.querySelectorAll(".extra-options.rotten-tomatoes, .extra-options-label");
    if (document.getElementById('rotten_tomatoes_on').checked) {
        for (var i = 0; i < extra_options_elements.length; i++) {
            extra_options_elements[i].style.display = "block";
        }
    }
    else {
        for (var i = 0; i < extra_options_elements.length; i++) {
            extra_options_elements[i].style.display = "none";
        }
    }
}

document.addEventListener("DOMContentLoaded", restoreOptions);

// document.getElementById("rotten_tomatoes_on").addEventListener("click", refreshExtraOptions, false);
// document.getElementById("rotten_tomatoes_off").addEventListener("click", refreshExtraOptions, false);

if (document.getElementById("save")) {
    document.getElementById("save").addEventListener("click", saveOptions);
}
