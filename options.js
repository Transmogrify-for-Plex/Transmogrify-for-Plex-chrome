function saveOptions() {
    var movie_trailers = document.querySelector("input[name='movie_trailers']:checked").value;
    var letterboxd_link = document.querySelector("input[name='letterboxd_link']:checked").value;
    var rotten_tomatoes_link = document.querySelector("input[name='rotten_tomatoes_link']:checked").value;
    var rotten_tomatoes_audience = document.querySelector("input[name='rotten_tomatoes_audience']").checked;
    var rotten_tomatoes_citizen = document.querySelector("input[name='rotten_tomatoes_citizen']:checked").value;
    var trakt_movies = document.querySelector("input[name='trakt_movies']").checked;
    var trakt_shows = document.querySelector("input[name='trakt_shows']").checked;
    var random_picker = document.querySelector("input[name='random_picker']:checked").value;
    var missing_episodes = document.querySelector("input[name='missing_episodes']:checked").value;
    var plex_server_address = document.querySelector("input[name='plex_server_address']").value;
    var plex_server_port = document.querySelector("input[name='plex_server_port']").value;

    var debug = document.querySelector("input[name='debug']:checked").value;

    chrome.storage.sync.set({"movie_trailers": movie_trailers});
    chrome.storage.sync.set({"letterboxd_link": letterboxd_link});
    chrome.storage.sync.set({"random_picker": random_picker});
    chrome.storage.sync.set({"rotten_tomatoes_link": rotten_tomatoes_link});
    chrome.storage.sync.set({"rotten_tomatoes_citizen": rotten_tomatoes_citizen});
    chrome.storage.sync.set({"missing_episodes": missing_episodes});
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
    chrome.storage.sync.set({"plex_server_address": plex_server_address.replace(/^https?:\/\//, ""), "plex_server_port": plex_server_port});

    chrome.storage.sync.set({"debug": debug});

    var save_button = document.getElementById("save");

    save_button.innerHTML = "Saved";
    setTimeout(function() {
        save_button.innerHTML = "Save";
    }, 1500);
}

function restoreOptions() {
    utils.setDefaultOptions(function() {
        chrome.storage.sync.get(function(result) {
            var movie_trailers_radio_button = document.getElementById("trailers_" + result["movie_trailers"]);
            movie_trailers_radio_button.checked = true;

            var letterboxd_link_radio_button = document.getElementById("letterboxd_" + result["letterboxd_link"]);
            letterboxd_link_radio_button.checked = true;

            var random_picker_radio_button = document.getElementById("random_" + result["random_picker"]);
            random_picker_radio_button.checked = true;

            var missing_episodes_radio_button = document.getElementById("missing_episodes_" + result["missing_episodes"]);
            missing_episodes_radio_button.checked = true;

            var rotten_tomatoes_link_radio_button = document.getElementById("rotten_tomatoes_" + result["rotten_tomatoes_link"]);
            rotten_tomatoes_link_radio_button.checked = true;
            refreshExtraOptions();

            var rotten_tomatoes_audience_checkbox = document.getElementById("rotten_tomatoes_audience");
            if (result["rotten_tomatoes_audience"] === "on") {
                rotten_tomatoes_audience_checkbox.checked = true;
            }
            else {
                rotten_tomatoes_audience_checkbox.checked = false;
            }

            var rotten_tomatoes_citizen_radio_button = document.getElementById("rotten_tomatoes_citizen_" + result["rotten_tomatoes_citizen"]);
            rotten_tomatoes_citizen_radio_button.checked = true;

            var trakt_movies_checkbox = document.getElementById("trakt_movies");
            if (result["trakt_movies"] === "on") {
                trakt_movies_checkbox.checked = true;
            }
            else {
                trakt_movies_checkbox.checked = false;
            }

            var trakt_shows_checkbox = document.getElementById("trakt_shows");
            if (result["trakt_shows"] === "on") {
                trakt_shows_checkbox.checked = true;
            }
            else {
                trakt_shows_checkbox.checked = false;
            }

            var plex_server_address = document.getElementById("plex_server_address");
            var plex_server_port = document.getElementById("plex_server_port");
            plex_server_address.value = result["plex_server_address"];
            plex_server_port.value = result["plex_server_port"];

            var debug_radio_button = document.getElementById("debug_" + result["debug"]);
            debug_radio_button.checked = true;
        });

        document.getElementById("rotten_tomatoes_on").addEventListener("click", refreshExtraOptions, false);
        document.getElementById("rotten_tomatoes_off").addEventListener("click", refreshExtraOptions, false);
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
document.getElementById("save").addEventListener("click", saveOptions);