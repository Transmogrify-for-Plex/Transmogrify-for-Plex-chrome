function saveOptions() {
    var movie_trailers = document.querySelector("input[name='movie_trailers']:checked").value;
    var letterboxd_link = document.querySelector("input[name='letterboxd_link']:checked").value;
    var themoviedb_link = document.querySelector("input[name='themoviedb_link']:checked").value;
    var imdb_link = document.querySelector("input[name='imdb_link']:checked").value;
    var tvdb_link = document.querySelector("input[name='tvdb_link']:checked").value;
    var rotten_tomatoes_link = document.querySelector("input[name='rotten_tomatoes_link']:checked").value;
    var rotten_tomatoes_audience = document.querySelector("input[name='rotten_tomatoes_audience']:checked").value;
    var rotten_tomatoes_citizen = document.querySelector("input[name='rotten_tomatoes_citizen']:checked").value;
    var trakt_movies = document.querySelector("input[name='trakt_movies']").checked;
    var trakt_shows = document.querySelector("input[name='trakt_shows']").checked;
    var random_picker = document.querySelector("input[name='random_picker']:checked").value;
    var random_picker_only_unwatched = document.querySelector("input[name='random_picker_only_unwatched']:checked").value;
    var missing_episodes = document.querySelector("input[name='missing_episodes']:checked").value;
    var split_added_deck = document.querySelector("input[name='split_added_deck']:checked").value;
    var canistreamit = document.querySelector("input[name='canistreamit']:checked").value;
    var actor_profiles = document.querySelector("input[name='actor_profiles']:checked").value;
    var stats_link = document.querySelector("input[name='stats_link']:checked").value;
    var plex_server_address = document.querySelector("input[name='plex_server_address']").value;
    var plex_server_port = document.querySelector("input[name='plex_server_port']").value;

    var debug = document.querySelector("input[name='debug']:checked").value;
    var debug_unfiltered = document.querySelector("input[name='debug_unfiltered']:checked").value;

    utils.storage_set("movie_trailers", movie_trailers);
    utils.storage_set("letterboxd_link", letterboxd_link);
    utils.storage_set("themoviedb_link", themoviedb_link);
    utils.storage_set("imdb_link", imdb_link);
    utils.storage_set("tvdb_link", tvdb_link);
    utils.storage_set("random_picker", random_picker);
    utils.storage_set("random_picker_only_unwatched", random_picker_only_unwatched);
    utils.storage_set("rotten_tomatoes_link", rotten_tomatoes_link);
    utils.storage_set("rotten_tomatoes_audience", rotten_tomatoes_audience);
    utils.storage_set("rotten_tomatoes_citizen", rotten_tomatoes_citizen);
    utils.storage_set("missing_episodes", missing_episodes);
    utils.storage_set("split_added_deck", split_added_deck);
    utils.storage_set("canistreamit", canistreamit);
    utils.storage_set("actor_profiles", actor_profiles);
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
    utils.storage_set("plex_server_address", plex_server_address.replace(/^https?:\/\//, ""));
    utils.storage_set("plex_server_port", plex_server_port);

    utils.storage_set("debug", debug);
    utils.storage_set("debug_unfiltered", debug_unfiltered);
}

function restoreOptions() {
    utils.setDefaultOptions(function(settings) {
        utils.storage_get_all(function(results) {
            var movie_trailers_radio_button = document.getElementById("trailers_" + results["movie_trailers"]);
            movie_trailers_radio_button.checked = true;

            var letterboxd_link_radio_button = document.getElementById("letterboxd_" + results["letterboxd_link"]);
            letterboxd_link_radio_button.checked = true;

            var themoviedb_link_radio_button = document.getElementById("themoviedb_" + results["themoviedb_link"]);
            themoviedb_link_radio_button.checked = true;

            var imdb_link_radio_button = document.getElementById("imdb_" + results["imdb_link"]);
            imdb_link_radio_button.checked = true;

            var tvdb_link_radio_button = document.getElementById("tvdb_" + results["tvdb_link"]);
            tvdb_link_radio_button.checked = true;

            var random_picker_radio_button = document.getElementById("random_" + results["random_picker"]);
            random_picker_radio_button.checked = true;

            var random_picker_only_unwatched_radio_button = document.getElementById("random_picker_only_unwatched_" + results["random_picker_only_unwatched"]);
            random_picker_only_unwatched_radio_button.checked = true;
            refreshRandomPickerExtraOptions();

            var missing_episodes_radio_button = document.getElementById("missing_episodes_" + results["missing_episodes"]);
            missing_episodes_radio_button.checked = true;

            var split_added_deck_radio_button = document.getElementById("split_added_deck_" + results["split_added_deck"]);
            split_added_deck_radio_button.checked = true;

            var canistreamit_radio_button = document.getElementById("canistreamit_" + results["canistreamit"]);
            canistreamit_radio_button.checked = true;

            var actor_profiles_radio_button = document.getElementById("actor_profiles_" + results["actor_profiles"]);
            actor_profiles_radio_button.checked = true;

            var stats_link_radio_button = document.getElementById("stats_link_" + results["stats_link"]);
            stats_link_radio_button.checked = true;

            var rotten_tomatoes_link_radio_button = document.getElementById("rotten_tomatoes_" + results["rotten_tomatoes_link"]);
            rotten_tomatoes_link_radio_button.checked = true;
            refreshRottenTomatoesExtraOptions();

            var rotten_tomatoes_audience_radio_button = document.getElementById("rotten_tomatoes_audience_" + results["rotten_tomatoes_audience"]);
            rotten_tomatoes_audience_radio_button.checked = true;

            var rotten_tomatoes_citizen_radio_button = document.getElementById("rotten_tomatoes_citizen_" + results["rotten_tomatoes_citizen"]);
            rotten_tomatoes_citizen_radio_button.checked = true;

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

            var plex_server_address = document.getElementById("plex_server_address");
            var plex_server_port = document.getElementById("plex_server_port");
            plex_server_address.value = results["plex_server_address"];
            plex_server_port.value = results["plex_server_port"];

            var debug_radio_button = document.getElementById("debug_" + results["debug"]);
            debug_radio_button.checked = true;

            var debug_unfiltered_radio_button = document.getElementById("debug_unfiltered_" + results["debug_unfiltered"]);
            debug_unfiltered_radio_button.checked = true;
            refreshDebugExtraOptions();
        });

        document.getElementById("rotten_tomatoes_on").addEventListener("click", refreshRottenTomatoesExtraOptions, false);
        document.getElementById("rotten_tomatoes_off").addEventListener("click", refreshRottenTomatoesExtraOptions, false);
        document.getElementById("random_on").addEventListener("click", refreshRandomPickerExtraOptions, false);
        document.getElementById("random_off").addEventListener("click", refreshRandomPickerExtraOptions, false);
        document.getElementById("debug_on").addEventListener("click", refreshDebugExtraOptions, false);
        document.getElementById("debug_off").addEventListener("click", refreshDebugExtraOptions, false);
    });
}

function refreshRottenTomatoesExtraOptions() {
    var rotten_tomatoes_extra_options = document.querySelectorAll(".rotten-tomatoes-extra");
    if (document.getElementById("rotten_tomatoes_on").checked) {
        for (var i = 0; i < rotten_tomatoes_extra_options.length; i++) {
            rotten_tomatoes_extra_options[i].style.display = "block";
        }
    }
    else {
        for (var i = 0; i < rotten_tomatoes_extra_options.length; i++) {
            rotten_tomatoes_extra_options[i].style.display = "none";
        }
    }
}

function refreshRandomPickerExtraOptions() {
    var random_picker_extra_options = document.querySelectorAll(".random-picker-extra");
    if (document.getElementById("random_on").checked) {
        for (var i = 0; i < random_picker_extra_options.length; i++) {
            random_picker_extra_options[i].style.display = "block";
        }
    }
    else {
        for (var i = 0; i < random_picker_extra_options.length; i++) {
            random_picker_extra_options[i].style.display = "none";
        }
    }
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
document.getElementById("clear-cache").addEventListener("click", function(e) {
    this.innerHTML = "Cleared";
    utils.purgeStaleCaches(true);

    var button = this;
    setTimeout(function() {
        button.innerHTML = "Clear cache";
    }, 1500);
});

restoreOptions();