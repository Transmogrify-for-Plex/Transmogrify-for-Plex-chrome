function saveOptions() {
    var imdb_movies = document.querySelector("input[name='imdb_movies']").checked;
    var imdb_shows = document.querySelector("input[name='imdb_shows']").checked;
    var themoviedb_link = document.querySelector("input[name='themoviedb_link']:checked").value;
    var tvdb_link = document.querySelector("input[name='tvdb_link']:checked").value;
    var trakt_movies = document.querySelector("input[name='trakt_movies']").checked;
    var trakt_shows = document.querySelector("input[name='trakt_shows']").checked;
    var missing_episodes = document.querySelector("input[name='missing_episodes']:checked").value;
    var stats_link = document.querySelector("input[name='stats_link']:checked").value;
    var plex_server_uri = document.querySelector("input[name='plex_server_uri']").value;

    var debug = document.querySelector("input[name='debug']:checked").value;
    var debug_unfiltered = document.querySelector("input[name='debug_unfiltered']:checked").value;

    if (imdb_movies) {
        utils.storage_set("imdb_movies", "on");
    }
    else {
        utils.storage_set("imdb_movies", "off");
    }
    if (imdb_shows) {
        utils.storage_set("imdb_shows", "on");
    }
    else {
        utils.storage_set("imdb_shows", "off");
    }
    utils.storage_set("themoviedb_link", themoviedb_link);
    utils.storage_set("tvdb_link", tvdb_link);
    utils.storage_set("missing_episodes", missing_episodes);
    utils.storage_set("stats_link", stats_link);
    if (trakt_movies) {
        utils.storage_set("trakt_movies", "on");
    }
    else {
        utils.storage_set("trakt_movies", "off");
    }
    if (trakt_shows) {
        utils.storage_set("trakt_shows", "on");
    }
    else {
        utils.storage_set("trakt_shows", "off");
    }
    utils.storage_set("plex_server_uri", plex_server_uri);

    utils.storage_set("debug", debug);
    utils.storage_set("debug_unfiltered", debug_unfiltered);
}

function restoreOptions() {
    utils.setDefaultOptions(function (settings) {
        utils.storage_get_all(function (results) {
            var imdb_movies_checkbox = document.getElementById("imdb_movies");
            if (results["imdb_movies"] === "on") {
                imdb_movies_checkbox.checked = true;
            }
            else {
                imdb_movies_checkbox.checked = false;
            }

            var imdb_shows_checkbox = document.getElementById("imdb_shows");
            if (results["imdb_shows"] === "on") {
                imdb_shows_checkbox.checked = true;
            }
            else {
                imdb_shows_checkbox.checked = false;
            }

            var themoviedb_link_radio_button = document.getElementById("themoviedb_" + results["themoviedb_link"]);
            themoviedb_link_radio_button.checked = true;

            var tvdb_link_radio_button = document.getElementById("tvdb_" + results["tvdb_link"]);
            tvdb_link_radio_button.checked = true;

            var missing_episodes_radio_button = document.getElementById("missing_episodes_" + results["missing_episodes"]);
            missing_episodes_radio_button.checked = true;

            var stats_link_radio_button = document.getElementById("stats_link_" + results["stats_link"]);
            stats_link_radio_button.checked = true;

            var trakt_movies_checkbox = document.getElementById("trakt_movies");
            if (results["trakt_movies"] === "on") {
                trakt_movies_checkbox.checked = true;
            }
            else {
                trakt_movies_checkbox.checked = false;
            }

            var trakt_shows_checkbox = document.getElementById("trakt_shows");
            if (results["trakt_shows"] === "on") {
                trakt_shows_checkbox.checked = true;
            }
            else {
                trakt_shows_checkbox.checked = false;
            }

            var plex_server_uri = document.getElementById("plex_server_uri");
            plex_server_uri.value = results["plex_server_uri"];

            var debug_radio_button = document.getElementById("debug_" + results["debug"]);
            debug_radio_button.checked = true;

            var debug_unfiltered_radio_button = document.getElementById("debug_unfiltered_" + results["debug_unfiltered"]);
            debug_unfiltered_radio_button.checked = true;
            refreshDebugExtraOptions();
        });
        document.getElementById("debug_on").addEventListener("click", refreshDebugExtraOptions, false);
        document.getElementById("debug_off").addEventListener("click", refreshDebugExtraOptions, false);
    });
}

function refreshDebugExtraOptions() {
    var debug_extra_options = document.querySelectorAll(".debug-extra");
    if (document.getElementById("debug_on").checked) {
        for (var i = 0; i < debug_extra_options.length; i++) {
            debug_extra_options[i].style.display = "block";
        }
    }
    else {
        for (var i = 0; i < debug_extra_options.length; i++) {
            debug_extra_options[i].style.display = "none";
        }
    }
}

// add click listener on all inputs to automatically save changes
var input_elements = document.getElementsByTagName('input');
for (var i = 0; i < input_elements.length; i++) {
    input_elements[i].addEventListener("click", saveOptions);

    var input_type = input_elements[i].getAttribute("type");
    if (input_type === "url" || input_type === "number") {
        input_elements[i].addEventListener("keyup", saveOptions);
    }
}

// add click listener to clear cache
document.getElementById("clear-cache").addEventListener("click", function (e) {
    this.innerHTML = "Cleared";
    utils.purgeStaleCaches(true);

    var button = this;
    setTimeout(function () {
        button.innerHTML = "Clear cache";
    }, 1500);
});

restoreOptions();