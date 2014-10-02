var servers = {};
var active_server;

function counter(limit, callback) {
    return function() {
        if(--limit === 0) {
            callback();
        }
    }
}

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

        dir_metadata[key] = {"type": type, "scanner": scanner};
    }
    return dir_metadata;
}

function getAllMovies(address, port, plex_token, section_key) {
    var library_section_url = "http://" + address + ":" + port + "/library/sections/" + section_key + "/all?X-Plex-Token=" + plex_token;
    var section_xml = utils.getSyncXML(library_section_url);

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

    return movies;
}

function generateMovieStats(movies) {
    var total_duration = 0;
    var total_size = 0;
    var content_rating_count = {};
    var movie_rating_count = {};
    var resolution_count = {};
    var year_count = {};
    var genre_count = {};
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
        // remove movies with no rating
        delete movie_rating_count[NaN];

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

        // genre count
        var genres = movies[i]["genres"];
        for (var k = 0; k < genres.length; k++) {
            if (genre_count[genres[k]]) {
                genre_count[genres[k]]++;
            }
            else {
                genre_count[genres[k]] = 1;
            }
        }
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
    getSections(address, port, plex_token, function(sections_xml) {
        var processed_sections = processLibrarySections(sections_xml);

        var all_movies = [];
        var tv_shows = [];

        for (var key in processed_sections) {
            if (processed_sections[key]["type"] === "movie" && processed_sections[key]["scanner"] === "Plex Movie Scanner") {
                var movies = getAllMovies(address, port, plex_token, key);
                all_movies = all_movies.concat(movies);
            }
            else if (processed_sections[key]["type"] === "show" && processed_sections[key]["scanner"] === "Plex Series Scanner") {
                // get stats for tv shows
            }
        }

        var movie_stats = generateMovieStats(all_movies);
        // add tv show stats here
        callback(movie_stats);
    });
}

function getStats(callback) {
    getServerAddresses(function(pms_servers) {
        // make this into a proper loop later

        // stat aggregation is all done when our counter reaches the number of servers
        var done = counter(Object.keys(pms_servers).length, function() {
            // all done!
            callback();
        });

        for (var machine_identifier in pms_servers) {
            // if cache
            // fetch cache
            // else

            // use closure otherwise due to generateStats being async value of machine_identifier will go out of scope
            // on each loop, and you only end up with values of last server in loop
            (function (machine_identifier) {
                var name = pms_servers[machine_identifier]["name"];
                var address = pms_servers[machine_identifier]["address"];
                var port = pms_servers[machine_identifier]["port"];
                var plex_token = pms_servers[machine_identifier]["access_token"];

                // need to pass in machine_identifier too to prevent race condition when it changes
                generateStats(address, port, plex_token, function(stats) {
                    servers[machine_identifier] = {"name": name, "stats": stats};
                    done();
                });
            }(machine_identifier));
        }
    });
}

getStats(function() {
    if (active_server) {
        drawYearsChart(active_server["stats"]["year_count"]);
        drawGenreChart(active_server["stats"]["genre_count"]);
    }
    else {
        // temp set active server
        active_server = servers[Object.keys(servers)[0]];
        drawYearsChart(active_server["stats"]["year_count"]);
        drawGenreChart(active_server["stats"]["genre_count"]);
    }
});