var servers;

function msToString(duration) {
    var seconds = parseInt((duration / 1000) % 60)
        , minutes = parseInt((duration / (1000 * 60)) % 60)
        , hours = parseInt((duration / (1000 * 60 * 60)) % 24)
        , days = parseInt((duration / (1000 * 60 * 60 * 24)) % 7)
        , weeks = parseInt((duration / (1000 * 60 * 60 * 24 * 7)));

    var weeks_string = (weeks === 1) ? " week, " : " weeks, ";
    var days_string = (days === 1) ? " day, " : " days, ";
    var hours_string = (hours === 1) ? " hour, " : " hours, ";
    var minutes_string = (minutes === 1) ? " minute, and " : " minutes, and ";

    return weeks + weeks_string + days + days_string + hours + hours_string + minutes + minutes_string + seconds + " seconds";
}

function getServerAddresses(callback) {
    utils.background_storage_get("server_addresses", function(response) {
        callback(response["value"]);
    });
}

function getSections(address, port, plex_token, callback) {
    var library_sections_url = "http://" + address + ":" + port + "/library/sections?X-Plex-Token=" + plex_token;
    utils.getXML(library_sections_url, function(sections_xml) {
        callback(sections_xml);
    });
}

function processLibrarySections(sections_xml) {
    var directories = sections_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory");
    var dir_metadata = {};
    for (var i = 0; i < directories.length; i++) {
        var type = directories[i].getAttribute("type");
        var scanner = directories[i].getAttribute("scanner");
        var key = directories[i].getAttribute("key");

        // only return movie or tv show libraries
        if ((type === "movie" && scanner === "Plex Movie Scanner") || (type === "show" && scanner === "Plex Series Scanner")) {
            dir_metadata[key] = {"type": type};
        }
    }
    return dir_metadata;
}

function getAllMovies(address, port, plex_token, section_key, callback) {
    var library_section_url = "http://" + address + ":" + port + "/library/sections/" + section_key + "/all?X-Plex-Token=" + plex_token;
    utils.getXML(library_section_url, function(section_xml) {
        var movies_xml = section_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video");
        var movies = [];
        for (var i = 0; i < movies_xml.length; i++) {
            var movie_data = {};
            movie_data["content_rating"] = movies_xml[i].getAttribute("contentRating");
            movie_data["rating"] = movies_xml[i].getAttribute("rating");
            movie_data["year"] = movies_xml[i].getAttribute("year");
            movie_data["added_at"] = movies_xml[i].getAttribute("addedAt");

            var metadata_xml = movies_xml[i].getElementsByTagName("Media")[0];
            movie_data["video_resolution"] = metadata_xml.getAttribute("videoResolution");
            movie_data["duration"] = metadata_xml.getAttribute("duration");
            // won't handle multiple copies of a movie properly

            var part_xml = metadata_xml.getElementsByTagName("Part")[0];
            movie_data["size"] = part_xml.getAttribute("size");

            var genre_xml = movies_xml[i].getElementsByTagName("Genre");
            movie_data["genres"] = [];
            for (var j = 0; j < genre_xml.length; j++) {
                var genre = genre_xml[j].getAttribute("tag");
                movie_data["genres"].push(genre);
            }

            movies.push(movie_data);
        }

        callback(movies);
    });
}

function getSectionGenres(address, port, plex_token, section_key, callback){
    var library_section_genres_url = "http://" + address + ":" + port + "/library/sections/" + section_key + "/genre?X-Plex-Token=" + plex_token;
    utils.getXML(library_section_genres_url, function(genres_xml) {
        var genre_nodes = genres_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory");

        var genres = {};
        for (var i = 0; i < genre_nodes.length; i++) {
            var genre_key = genre_nodes[i].getAttribute("key");
            var genre_title = genre_nodes[i].getAttribute("title");
            genres[genre_key] = genre_title;
        }

        callback(genres);
    });
}

function getMoviesByGenre(address, port, plex_token, section_key, genre_key, callback){
    var filtered_movies_url = "http://" + address + ":" + port + "/library/sections/" + section_key + "/all?genre=" + genre_key + "&X-Plex-Token=" + plex_token;
    utils.getXML(filtered_movies_url, function(movies_xml) {
        var movies = movies_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video");
        callback(movies);
    });
}

function generateMovieStats(movies, genre_count) {
    var total_duration = 0;
    var total_size = 0;
    var content_rating_count = {};
    var movie_rating_count = {};
    var resolution_count = {};
    var year_count = {};
    for (var i = 0; i < movies.length; i++) {
        total_duration += parseInt(movies[i]["duration"]);
        total_size += parseInt(movies[i]["size"]);

        // content rating count
        var content_rating = movies[i]["content_rating"];
        if (content_rating_count[content_rating]) {
            content_rating_count[content_rating]++;
        }
        else {
            content_rating_count[content_rating] = 1;
        }
        // remove movies with no content rating
        delete content_rating_count[null];

        // movie ratings partioning
        // round down movie rating so that ratings 4.0-4.9 = 4 etc
        var movie_rating = parseInt(movies[i]["rating"]);
        if (movie_rating_count[movie_rating]) {
            movie_rating_count[movie_rating]++;
        }
        else {
            movie_rating_count[movie_rating] = 1;
        }

        // resolutions count
        var resolution = movies[i]["video_resolution"];
        if (resolution_count[resolution]) {
            resolution_count[resolution]++;
        }
        else {
            resolution_count[resolution] = 1;
        }

        // years count
        var year = parseInt(movies[i]["year"]);
        if (year_count[year]) {
            year_count[year]++;
        }
        else {
            year_count[year] = 1;
        }
        //add missing years
        var sorted_years = Object.keys(year_count).sort();
        for (var j = sorted_years[0]; j < sorted_years[sorted_years.length - 1]; j++) {
            if (!year_count[j]) {
                year_count[j] = 0;
            }
        }

        // clean up, remove invalid data
        delete movie_rating_count[NaN];
        delete year_count[NaN];
    }

    return {
        "total_duration": total_duration,
        "total_size": total_size,
        "content_rating_count": content_rating_count,
        "movie_rating_count": movie_rating_count,
        "resolution_count": resolution_count,
        "year_count": year_count,
        "genre_count": genre_count
        };
}

function generateStats(address, port, plex_token, callback) {
    var all_movies = [];
    var all_tv_shows = [];

    getSections(address, port, plex_token, function(sections_xml) {
        var processed_sections = processLibrarySections(sections_xml);

        // set up counters to keep track of running tasks
        var counters = {"movies": 0, "movie_genres": 0}
        var reduce_counter = function(key) {
            counters[key]--;

            // check if all async tasks are finished
            if (counters["movies"] === 0 && counters["movie_genres"] === 0) {
                var movie_stats = generateMovieStats(all_movies, movie_genres_count);
                callback(movie_stats);
            }
        };

        var movie_genres_count = {};
        for (var section_key in processed_sections) {
            // use closures because of scoping issues
            (function (section_key) {
                if (processed_sections[section_key]["type"] === "movie") {
                    counters["movies"]++;
                    getAllMovies(address, port, plex_token, section_key, function(movies){
                        all_movies = all_movies.concat(movies);

                        // because the plex web api for a library section only returns the first two genres
                        // of each movie we need to get all the genre mappings and count the number of movies
                        // returned by the api with that genre filtered out
                        getSectionGenres(address, port, plex_token, section_key, function(genres) {
                            counters["movie_genres"] += Object.keys(genres).length;
                            for (var genre_key in genres) {
                                (function (genre_key) {
                                    var genre_title = genres[genre_key];
                                    getMoviesByGenre(address, port, plex_token, section_key, genre_key, function(genre_movies) {
                                        if (movie_genres_count[genre_title]) {
                                            movie_genres_count[genre_title] += genre_movies.length;
                                        }
                                        else {
                                            movie_genres_count[genre_title] = genre_movies.length;
                                        }
                                        reduce_counter("movie_genres");
                                    });
                                }(genre_key));
                            }
                            reduce_counter("movies");
                        })
                    });
                }
                else if (processed_sections[section_key]["type"] === "show") {
                    // get stats for tv shows
                }
            }(section_key));
        }
    });
}

function getStats(server, callback) {
    var machine_identifier = server["machine_identifier"];
    var name = server["name"];
    var address = server["address"];
    var port = server["port"];
    var plex_token = server["access_token"];

    utils.local_storage_get("cache-stats-" + machine_identifier, function(data) {
        var timestamp = data["timestamp"];
        var stats = data["stats"];

        if (stats) {
            callback(stats, timestamp);
        }
        else {
            generateStats(address, port, plex_token, function(stats) {
                var hash = {"name": name, "stats": stats, "timestamp": new Date().getTime()};
                utils.local_storage_set("cache-stats-" + machine_identifier, hash);
                callback(stats);
            });
        }
    });
}

function setServerSelections() {
    // set active server name on nav bar
    document.getElementById("active-server-name").innerHTML = servers[active_server]["name"];

    var server_list_element = document.getElementById("server-choices");

    // remove all previous server choices
    while (server_list_element.firstChild){
        server_list_element.removeChild(server_list_element.firstChild);
    }

    // add all server choices
    for (var server in servers) {
        if (active_server === server) {
            continue;
        }

        var li = document.createElement("li");
        var server_element = document.createElement("a");
        server_element.setAttribute("href", "#");
        server_element.setAttribute("class", "server-choice");
        server_element.setAttribute("data-machine_identifier", servers[server]["machine_identifier"]);
        var text_node = document.createTextNode(servers[server]["name"]);

        server_element.appendChild(text_node);
        li.appendChild(server_element);
        server_list_element.appendChild(li);

        // add event handler
        server_element.addEventListener("click", switchServer, false);
    }
}

function setLastUpdated(timestamp){
    // show last updated time in nav bar
}

function switchServer(e) {
    var machine_identifier = e.target.getAttribute("data-machine_identifier");
    switchToServer(servers[machine_identifier]);
}

function switchToServer(server){
    active_server = server["machine_identifier"];
    setServerSelections();

    getStats(server, function(server_stats, last_updated) {
        drawYearsChart(server_stats["year_count"]);
        drawGenreChart(server_stats["genre_count"]);
        drawContentRatingChart(server_stats["content_rating_count"]);

        setLastUpdated(last_updated);
    });
}

// start stuff
getServerAddresses(function(pms_servers) {
    servers = pms_servers;

    active_server = Object.keys(servers)[0];
    var server_data = servers[active_server];
    switchToServer(server_data);
});