function saveOptions() {
    var movie_trailers = document.querySelector("input[name='movie_trailers']:checked").value;
    var letterboxd_link = document.querySelector("input[name='letterboxd_link']:checked").value;
    var imdb_link = document.querySelector("input[name='imdb_link']:checked").value;
    var rotten_tomatoes_link = document.querySelector("input[name='rotten_tomatoes_link']:checked").value;
    var rotten_tomatoes_audience = document.querySelector("input[name='rotten_tomatoes_audience']").checked;
    var rotten_tomatoes_citizen = document.querySelector("input[name='rotten_tomatoes_citizen']:checked").value;
    var trakt_movies = document.querySelector("input[name='trakt_movies']").checked;
    var trakt_shows = document.querySelector("input[name='trakt_shows']").checked;
    var random_picker = document.querySelector("input[name='random_picker']:checked").value;
    var missing_episodes = document.querySelector("input[name='missing_episodes']:checked").value;
    var canistreamit = document.querySelector("input[name='canistreamit']:checked").value;
    var plex_server_address = document.querySelector("input[name='plex_server_address']").value;
    var plex_server_port = document.querySelector("input[name='plex_server_port']").value;

    var debug = document.querySelector("input[name='debug']:checked").value;

    utils.storage_set("movie_trailers", movie_trailers);
    utils.storage_set("letterboxd_link", letterboxd_link);
    utils.storage_set("imdb_link", imdb_link);
    utils.storage_set("random_picker", random_picker);
    utils.storage_set("rotten_tomatoes_link", rotten_tomatoes_link);
    utils.storage_set("rotten_tomatoes_citizen", rotten_tomatoes_citizen);
    utils.storage_set("missing_episodes", missing_episodes);
    utils.storage_set("canistreamit", canistreamit);
    if (rotten_tomatoes_audience) {
        utils.storage_set("rotten_tomatoes_audience", "on");
    }
    else {
        utils.storage_set("rotten_tomatoes_audience", "off");
    }
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

    var save_button = document.getElementById("save");

    save_button.innerHTML = "Saved";
    setTimeout(function() {
        save_button.innerHTML = "Save";
    }, 1500);
}

function restoreOptions() {
    utils.setDefaultOptions(function() {
        utils.storage_get_all(function(results) {
            var movie_trailers_radio_button = document.getElementById("trailers_" + results["movie_trailers"]);
            movie_trailers_radio_button.checked = true;

            var letterboxd_link_radio_button = document.getElementById("letterboxd_" + results["letterboxd_link"]);
            letterboxd_link_radio_button.checked = true;

            var imdb_link_radio_button = document.getElementById("imdb_" + results["imdb_link"]);
            imdb_link_radio_button.checked = true;

            var random_picker_radio_button = document.getElementById("random_" + results["random_picker"]);
            random_picker_radio_button.checked = true;

            var missing_episodes_radio_button = document.getElementById("missing_episodes_" + results["missing_episodes"]);
            missing_episodes_radio_button.checked = true;

            var canistreamit_radio_button = document.getElementById("canistreamit_" + results["canistreamit"]);
            canistreamit_radio_button.checked = true;

            var rotten_tomatoes_link_radio_button = document.getElementById("rotten_tomatoes_" + results["rotten_tomatoes_link"]);
            rotten_tomatoes_link_radio_button.checked = true;
            refreshExtraOptions();

            var rotten_tomatoes_audience_checkbox = document.getElementById("rotten_tomatoes_audience");
            if (results["rotten_tomatoes_audience"] === "on") {
                rotten_tomatoes_audience_checkbox.checked = true;
            }
            else {
                rotten_tomatoes_audience_checkbox.checked = false;
            }

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

document.getElementById("save").addEventListener("click", saveOptions);

restoreOptions();