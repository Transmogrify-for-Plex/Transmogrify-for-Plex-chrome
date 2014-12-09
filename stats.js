var servers;
var sections = {};
var active_server;
var active_section;
var last_updated_string;

var resolution_mappings = {"1080" : "1080p",
                           "720" : "720p",
                           "480" : "480p",
                           "576" : "576p",
                           "sd" : "SD"
                           };

function formattedDateString(timestamp) {
    var date = new Date(timestamp);
    var formatted_date = date.toLocaleTimeString() + " " + date.toDateString();
    return formatted_date;
}

function showHeadings() {
    var movies_visible = document.getElementById("movies-container").style.display === "block";
    var shows_visible = document.getElementById("shows-container").style.display === "block";
    var music_visible = document.getElementById("music-container").style.display === "block";

    // there is probably a better way to do this
    if (movies_visible && shows_visible && music_visible) {
        document.getElementById("movies-heading").style.display = "block";
        document.getElementById("shows-heading").style.display = "block";
        document.getElementById("music-heading").style.display = "block";
    }
    else if (movies_visible && shows_visible) {
        document.getElementById("movies-heading").style.display = "block";
        document.getElementById("shows-heading").style.display = "block";
    }
    else if (movies_visible && music_visible) {
        document.getElementById("movies-heading").style.display = "block";
        document.getElementById("music-heading").style.display = "block";
    }
    else if (music_visible && shows_visible) {
        document.getElementById("music-heading").style.display = "block";
        document.getElementById("shows-heading").style.display = "block";
    }
}

function showDisplay(type) {
    document.getElementById("server-error-indicator").style.display = "none";
    document.getElementById("loading-indicator").style.display = "none";

    // show movies section if active_section type is movie or forced by passing type to showDisplay
    if (active_section || type) {
        if ((active_section && active_section["type"] === "movie") || type === "movies") {
            document.getElementById("movies-container").style.display = "block";
        }
        else if ((active_section && active_section["type"] === "show") || type === "shows") {
            document.getElementById("shows-container").style.display = "block";
        }
        else {
            document.getElementById("music-container").style.display = "block";
        }
    }

    showHeadings();
}

function hideDisplay() {
    document.getElementById("movies-container").style.display = "none";
    document.getElementById("shows-container").style.display = "none";
    document.getElementById("music-container").style.display = "none";
    document.getElementById("movies-heading").style.display = "none";
    document.getElementById("shows-heading").style.display = "none";
    document.getElementById("music-heading").style.display = "none";
    document.getElementById("server-error-indicator").style.display = "none";
    document.getElementById("server-updated").style.display = "none";

    document.getElementById("loading-indicator").style.display = "block";
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
        var title = directories[i].getAttribute("title");
        var type = directories[i].getAttribute("type");
        var scanner = directories[i].getAttribute("scanner");
        var key = directories[i].getAttribute("key");

        // only return movie or tv show libraries
        if (type === "movie" || type === "show" || type === "artist") {
            dir_metadata[key] = {"type": type, "title": title};
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

            movies.push(movie_data);
        }

        callback(movies);
    });
}

function getAllShows(address, port, plex_token, section_key, callback) {
    var library_section_url = "http://" + address + ":" + port + "/library/sections/" + section_key + "/all?X-Plex-Token=" + plex_token;
    utils.getXML(library_section_url, function(section_xml) {
        var shows_xml = section_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory");
        var shows = [];
        for (var i = 0; i < shows_xml.length; i++) {
            var show_data = {};
            show_data["content_rating"] = shows_xml[i].getAttribute("contentRating");
            show_data["rating"] = shows_xml[i].getAttribute("rating");
            show_data["year"] = shows_xml[i].getAttribute("year");
            show_data["duration"] = shows_xml[i].getAttribute("duration");

            shows.push(show_data);
        }

        callback(shows);
    });
}

function getAllEpisodes(address, port, plex_token, section, callback) {
    var library_section_episodes_url = "http://" + address + ":" + port + "/library/sections/" + section + "/all?type=4&X-Plex-Token=" + plex_token;
    utils.getXML(library_section_episodes_url, function(section_xml) {
        var episodes_xml = section_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video");
        var episodes = [];
        for (var i = 0; i < episodes_xml.length; i++) {
            var episode_data = {};
            episode_data["added_at"] = episodes_xml[i].getAttribute("addedAt");

            var metadata_xml = episodes_xml[i].getElementsByTagName("Media")[0];
            episode_data["video_resolution"] = metadata_xml.getAttribute("videoResolution");

            episodes.push(episode_data);
        }

        callback(episodes);
    });
}

function getAllSongs(address, port, plex_token, section, callback) {
    var library_section_songs_url = "http://" + address + ":" + port + "/library/sections/" + section + "/all?type=10&X-Plex-Token=" + plex_token;
    utils.getXML(library_section_songs_url, function(section_xml) {
        var songs_xml = section_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Track");
        var songs = [];
        for (var i = 0; i < songs_xml.length; i++) {
            var song_data = {};
            song_data["duration"] = songs_xml[i].getAttribute("duration");
            song_data["added_at"] = songs_xml[i].getAttribute("addedAt");

            var metadata_xml = songs_xml[i].getElementsByTagName("Media")[0];
            song_data["bitrate"] = metadata_xml.getAttribute("bitrate");

            songs.push(song_data);
        }

        callback(songs);
    });
}

function getAllAlbums(address, port, plex_token, section, callback) {
    var library_section_albums_url = "http://" + address + ":" + port + "/library/sections/" + section + "/all?type=9&X-Plex-Token=" + plex_token;
    utils.getXML(library_section_albums_url, function(section_xml) {
        var albums_xml = section_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory");
        var albums = [];
        for (var i = 0; i < albums_xml.length; i++) {
            var album_data = {};
            album_data["year"] = albums_xml[i].getAttribute("year");
            album_data["added_at"] = albums_xml[i].getAttribute("addedAt");

            albums.push(album_data);
        }

        callback(albums);
    });
}

function getSectionGenres(address, port, plex_token, section_key, callback) {
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

function getMoviesByGenre(address, port, plex_token, section_key, genre_key, callback) {
    var filtered_movies_url = "http://" + address + ":" + port + "/library/sections/" + section_key + "/all?genre=" + genre_key + "&X-Plex-Token=" + plex_token;
    utils.getXML(filtered_movies_url, function(movies_xml) {
        var movies = movies_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video");
        callback(movies);
    });
}

function getShowsByGenre(address, port, plex_token, section_key, genre_key, callback) {
    var filtered_shows_url = "http://" + address + ":" + port + "/library/sections/" + section_key + "/all?genre=" + genre_key + "&X-Plex-Token=" + plex_token;
    utils.getXML(filtered_shows_url, function(shows_xml) {
        var shows = shows_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory");
        callback(shows);
    });
}

function getAlbumsByGenre(address, port, plex_token, section_key, genre_key, callback) {
    var filtered_albums_url = "http://" + address + ":" + port + "/library/sections/" + section_key + "/all?genre=" + genre_key + "&X-Plex-Token=" + plex_token;
    utils.getXML(filtered_albums_url, function(albums_xml) {
        var albums = albums_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory");
        callback(albums);
    });
}

function generateMovieStats(movies, genre_count) {
    var content_rating_count = {};
    var movie_rating_count = {};
    var resolution_count = {};
    var year_count = {};
    var dates_added = [];

    for (var i = 0; i < movies.length; i++) {
        // content rating count
        var content_rating = movies[i]["content_rating"];
        if (content_rating_count[content_rating]) {
            content_rating_count[content_rating]++;
        }
        else {
            content_rating_count[content_rating] = 1;
        }

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

        // movies added over time
        // set date time to beginning of day to make it easy to work with
        var added_at = new Date(parseInt(movies[i]["added_at"]) * 1000).setHours(0, 0, 0, 0);
        dates_added.push(added_at);
    }

    // clean up, remove invalid data
    if (content_rating_count[null]) {
        content_rating_count["Unknown"] = content_rating_count[null];
        delete content_rating_count[null];
    }
    if (resolution_count[null]) {
        resolution_count["Unknown"] = resolution_count[null];
        delete resolution_count[null];
    }
    delete year_count[NaN];

    // add missing years
    var sorted_years = Object.keys(year_count).sort();
    for (var j = sorted_years[0]; j < sorted_years[sorted_years.length - 1]; j++) {
        if (!year_count[j]) {
            year_count[j] = 0;
        }
    }

    // collate movies added over time data
    var sorted_dates = dates_added.sort(function(a, b) {return a - b;});
    var today = new Date(Date.now());
    var start_date = new Date(sorted_dates[0]);
    var date_added_count = {};
    var total_count = 0;
    // iterate over dates from first movie added date added to today
    for (var d = start_date; d <= today; d.setDate(d.getDate() + 1)) {
        var current_timestamp = d.getTime();
        var day_count = 0;
        for (var i = 0; i < sorted_dates.length; i++) {
            if (sorted_dates[i] === current_timestamp) {
                day_count += 1;
            }
        }

        // only add date to array if movies were added that day
        if (day_count > 0) {
            total_count += day_count;

            var date_string = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
            date_added_count[date_string] = total_count;
        }
    }

    // format movie ratings data
    for (var rating in movie_rating_count) {
        if (isNaN(rating)) {
            movie_rating_count["No Rating"] = movie_rating_count[NaN];
        }
        else {
            var formatted_rating = rating + ".0 - " + rating + ".9";
            movie_rating_count[formatted_rating] = movie_rating_count[rating];
        }
        delete movie_rating_count[rating];
    }
    // group 9.0-10.0 ratings together
    if (movie_rating_count["9.0 - 9.9"] || movie_rating_count["10.0 - 10.9"]) {
        movie_rating_count["9.0 - 10.0"] = (movie_rating_count["9.0 - 9.9"] || 0) + (movie_rating_count["10.0 - 10.9"] || 0);
        delete movie_rating_count["9.0 - 9.9"];
        delete movie_rating_count["10.0 - 10.9"];
    }

    // format movie resolutions data
    for (var resolution in resolution_count) {
        if (resolution_mappings[resolution]) {
            resolution_count[resolution_mappings[resolution]] = resolution_count[resolution];
            delete resolution_count[resolution];
        }
    }

    return {
        "content_rating_count": content_rating_count,
        "movie_rating_count": movie_rating_count,
        "resolution_count": resolution_count,
        "year_count": year_count,
        "genre_count": genre_count,
        "date_added_count": date_added_count
        };
}

function generateShowStats(shows, episodes, genre_count) {
    var content_rating_count = {};
    var show_rating_count = {};
    var resolution_count = {};
    var year_count = {};
    var episodes_dates_added = [];

    for (var i = 0; i < shows.length; i++) {
        // content rating count
        var content_rating = shows[i]["content_rating"];
        if (content_rating_count[content_rating]) {
            content_rating_count[content_rating]++;
        }
        else {
            content_rating_count[content_rating] = 1;
        }

        // show ratings partioning
        // round down show rating so that ratings 4.0-4.9 = 4 etc
        var movie_rating = parseInt(shows[i]["rating"]);
        if (show_rating_count[movie_rating]) {
            show_rating_count[movie_rating]++;
        }
        else {
            show_rating_count[movie_rating] = 1;
        }

        // years count
        var year = parseInt(shows[i]["year"]);
        if (year_count[year]) {
            year_count[year]++;
        }
        else {
            year_count[year] = 1;
        }
    }

    // iterate over all episodes
    for (var j = 0; j < episodes.length; j++) {
        // resolutions count
        var resolution = episodes[j]["video_resolution"];
        if (resolution_count[resolution]) {
            resolution_count[resolution]++;
        }
        else {
            resolution_count[resolution] = 1;
        }

        // episodes added over time
        // set date time to beginning of day to make it easy to work with
        var added_at = new Date(parseInt(episodes[j]["added_at"]) * 1000).setHours(0, 0, 0, 0);
        episodes_dates_added.push(added_at);
    }

    // clean up, remove invalid data
    if (content_rating_count[null]) {
        content_rating_count["Unknown"] = content_rating_count[null];
        delete content_rating_count[null];
    }
    if (resolution_count[null]) {
        resolution_count["Unknown"] = resolution_count[null];
        delete resolution_count[null];
    }
    delete year_count[NaN];

    // add missing years
    var sorted_years = Object.keys(year_count).sort();
    for (var j = sorted_years[0]; j < sorted_years[sorted_years.length - 1]; j++) {
        if (!year_count[j]) {
            year_count[j] = 0;
        }
    }

    // collate episodes added over time data
    var sorted_dates = episodes_dates_added.sort(function(a, b) {return a - b;});
    var today = new Date(Date.now());
    var start_date = new Date(sorted_dates[0]);
    var episodes_date_added_count = {};
    var total_count = 0;
    // iterate over dates from first movie added date added to today
    for (var d = start_date; d <= today; d.setDate(d.getDate() + 1)) {
        var current_timestamp = d.getTime();
        var day_count = 0;
        for (var i = 0; i < sorted_dates.length; i++) {
            if (sorted_dates[i] === current_timestamp) {
                day_count += 1;
            }
        }

        // only add date to array if shows were added that day
        if (day_count > 0) {
            total_count += day_count

            var date_string = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
            episodes_date_added_count[date_string] = total_count;
        }
    }

    // format show ratings data
    for (var rating in show_rating_count) {
        if (isNaN(rating)) {
            show_rating_count["No Rating"] = show_rating_count[NaN];
        }
        else {
            var formatted_rating = rating + ".0 - " + rating + ".9";
            show_rating_count[formatted_rating] = show_rating_count[rating];
        }
        delete show_rating_count[rating];
    }
    // group 9.0-10.0 ratings together
    if (show_rating_count["9.0 - 9.9"] || show_rating_count["10.0 - 10.9"]) {
        show_rating_count["9.0 - 10.0"] = (show_rating_count["9.0 - 9.9"] || 0) + (show_rating_count["10.0 - 10.9"] || 0);
        delete show_rating_count["9.0 - 9.9"];
        delete show_rating_count["10.0 - 10.9"];
    }

    // format movie resolutions data
    for (var resolution in resolution_count) {
        if (resolution_mappings[resolution]) {
            resolution_count[resolution_mappings[resolution]] = resolution_count[resolution];
            delete resolution_count[resolution];
        }
    }

    return {
        "content_rating_count": content_rating_count,
        "show_rating_count": show_rating_count,
        "resolution_count": resolution_count,
        "year_count": year_count,
        "genre_count": genre_count,
        "episodes_date_added_count": episodes_date_added_count
        };
}

function generateMusicStats(songs, albums, genre_count) {
    var bitrate_count = {};
    var duration_count = {};
    var year_count = {};
    var songs_dates_added = [];
    var albums_dates_added = [];

    for (var i = 0; i < songs.length; i++) {
        // bitrates count
        var bitrate = songs[i]["bitrate"];
        if (bitrate_count[bitrate]) {
            bitrate_count[bitrate]++;
        }
        else {
            bitrate_count[bitrate] = 1;
        }

        // durations count
        // round down duration to lowest 30 seconds to make it easy to work with
        var duration = parseInt(parseInt(songs[i]["duration"]) / 1000);
        var nearest_duration_milestone = 30 * Math.round(duration / 30);
        if (duration_count[nearest_duration_milestone]) {
            duration_count[nearest_duration_milestone]++;
        }
        else {
            duration_count[nearest_duration_milestone] = 1;
        }


        // songs added over time
        // set date time to beginning of day to make it easy to work with
        var song_added_at = new Date(parseInt(songs[i]["added_at"]) * 1000).setHours(0, 0, 0, 0);
        songs_dates_added.push(song_added_at);
    }

    for (var i = 0; i < albums.length; i++) {
        // years count
        var year = parseInt(albums[i]["year"]);
        if (year_count[year]) {
            year_count[year]++;
        }
        else {
            year_count[year] = 1;
        }

        // albums added over time
        // set date time to beginning of day to make it easy to work with
        var album_added_at = new Date(parseInt(albums[i]["added_at"]) * 1000).setHours(0, 0, 0, 0);
        albums_dates_added.push(album_added_at);
    }

    // clean up, remove invalid data
    delete year_count[NaN];

    // add missing years
    var sorted_years = Object.keys(year_count).sort();
    for (var j = sorted_years[0]; j < sorted_years[sorted_years.length - 1]; j++) {
        if (!year_count[j]) {
            year_count[j] = 0;
        }
    }

    // collate songs added over time data
    var sorted_song_dates = songs_dates_added.sort(function(a, b) {return a - b;});
    var today = new Date(Date.now());
    var start_date = new Date(sorted_song_dates[0]);
    var songs_date_added_count = {};
    var total_count = 0;
    // iterate over dates from first song added date added to today
    for (var d = start_date; d <= today; d.setDate(d.getDate() + 1)) {
        var current_timestamp = d.getTime();
        var day_count = 0;
        for (var i = 0; i < sorted_song_dates.length; i++) {
            if (sorted_song_dates[i] === current_timestamp) {
                day_count += 1;
            }
        }

        // only add date to array if songs were added that day
        if (day_count > 0) {
            total_count += day_count;

            var date_string = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
            songs_date_added_count[date_string] = total_count;
        }
    }

    // collate albums added over time data
    var sorted_album_dates = albums_dates_added.sort(function(a, b) {return a - b;});
    var today = new Date(Date.now());
    var start_date = new Date(sorted_album_dates[0]);
    var albums_date_added_count = {};
    var total_count = 0;
    // iterate over dates from first album added date added to today
    for (var d = start_date; d <= today; d.setDate(d.getDate() + 1)) {
        var current_timestamp = d.getTime();
        var day_count = 0;
        for (var i = 0; i < sorted_album_dates.length; i++) {
            if (sorted_album_dates[i] === current_timestamp) {
                day_count += 1;
            }
        }

        // only add date to array if albums were added that day
        if (day_count > 0) {
            total_count += day_count;

            var date_string = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
            albums_date_added_count[date_string] = total_count;
        }
    }

    return {
        "bitrate_count": bitrate_count,
        "duration_count": duration_count,
        "year_count": year_count,
        "genre_count": genre_count,
        "songs_date_added_count": songs_date_added_count,
        "albums_date_added_count": albums_date_added_count
        };
}

function generateStats(address, port, plex_token, callback) {
    utils.debug("Generating stats for " + address + ":" + port);

    var all_movies = [];
    var all_shows = [];
    var all_episodes = [];
    var all_songs = [];
    var all_albums = [];
    var movie_genres_count = {};
    var show_genres_count = {};
    var album_genres_count = {};

    var section_movies = {};
    var section_shows = {};
    var section_episodes = {};
    var section_songs = {};
    var section_albums = {};
    var section_movie_genres_count = {};
    var section_show_genres_count = {};
    var section_album_genres_count = {};

    getSections(address, port, plex_token, function(sections_xml) {
        // check if no response from server
        if (!sections_xml) {
            callback(null);
            return;
        }
        var processed_sections = processLibrarySections(sections_xml);

        // set up counter to keep track of running tasks
        var task_counter = 0;
        var task_completed = function() {
            utils.debug("Data task finished");
            task_counter--;

            // check if all async tasks are finished
            if (task_counter === 0) {
                utils.debug("All data tasks finished");

                var movie_stats = generateMovieStats(all_movies, movie_genres_count);
                var show_stats = generateShowStats(all_shows, all_episodes, show_genres_count);
                var music_stats = generateMusicStats(all_songs, all_albums, album_genres_count);

                var per_section_movie_stats = {};
                for (var section_key in section_movies) {
                    var section_movie_stats = generateMovieStats(section_movies[section_key], section_movie_genres_count[section_key]);
                    per_section_movie_stats[section_key] = section_movie_stats;
                }

                var per_section_show_stats = {};
                for (var section_key in section_shows) {
                    var section_show_stats = generateShowStats(section_shows[section_key], section_episodes[section_key], section_show_genres_count[section_key]);
                    per_section_show_stats[section_key] = section_show_stats;
                }

                var per_section_music_stats = {};
                for (var section_key in section_albums) {
                    var section_music_stats = generateMusicStats(section_songs[section_key], section_albums[section_key], section_album_genres_count[section_key]);
                    per_section_music_stats[section_key] = section_music_stats;
                }

                callback(movie_stats, per_section_movie_stats, show_stats, per_section_show_stats, music_stats, per_section_music_stats);
            }
        };

        for (var section_key in processed_sections) {
            // use closures because of scoping issues
            (function (section_key) {
                if (processed_sections[section_key]["type"] === "movie") {
                    task_counter++;

                    section_movie_genres_count[section_key] = {};
                    // get all movies for section
                    getAllMovies(address, port, plex_token, section_key, function(movies) {
                        all_movies = all_movies.concat(movies);
                        section_movies[section_key] = movies;

                        // because the plex web api calls for library sections only returns the first two genres
                        // of each movie we need to get all the genre mappings first and count the number of movies
                        // returned by the api with that genre filtered out
                        getSectionGenres(address, port, plex_token, section_key, function(genres) {
                            task_counter += Object.keys(genres).length;

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
                                        if (section_movie_genres_count[section_key][genre_title]) {
                                            section_movie_genres_count[section_key][genre_title] += genre_movies.length;
                                        }
                                        else {
                                            section_movie_genres_count[section_key][genre_title] = genre_movies.length;
                                        }
                                        task_completed();
                                    });
                                }(genre_key));
                            }
                            task_completed();
                        });
                    });
                }

                else if (processed_sections[section_key]["type"] === "show") {
                    task_counter++;

                    section_show_genres_count[section_key] = {};
                    section_episodes[section_key] = [];
                    // get all tv shows for section
                    getAllShows(address, port, plex_token, section_key, function(shows) {
                        all_shows = all_shows.concat(shows);
                        section_shows[section_key] = shows;

                        // because the plex web api calls for library sections only returns the first two genres
                        // of each show we need to get all the genre mappings first and count the number of shows
                        // returned by the api with that genre filtered out
                        getSectionGenres(address, port, plex_token, section_key, function(genres) {
                            task_counter += Object.keys(genres).length;

                            for (var genre_key in genres) {
                                (function (genre_key) {
                                    var genre_title = genres[genre_key];
                                    getShowsByGenre(address, port, plex_token, section_key, genre_key, function(genre_shows) {
                                        if (show_genres_count[genre_title]) {
                                            show_genres_count[genre_title] += genre_shows.length;
                                        }
                                        else {
                                            show_genres_count[genre_title] = genre_shows.length;
                                        }
                                        if (section_show_genres_count[section_key][genre_title]) {
                                            section_show_genres_count[section_key][genre_title] += genre_shows.length;
                                        }
                                        else {
                                            section_show_genres_count[section_key][genre_title] = genre_shows.length;
                                        }
                                        task_completed();
                                    });
                                }(genre_key));
                            }
                            task_completed();
                        });
                    });

                    // get all tv show episodes for section
                    task_counter++;
                    getAllEpisodes(address, port, plex_token, section_key, function(episodes) {
                        all_episodes = all_episodes.concat(episodes);
                        section_episodes[section_key] = section_episodes[section_key].concat(episodes);
                        task_completed();
                    });
                }

                else if (processed_sections[section_key]["type"] === "artist") {
                    task_counter++;

                    section_album_genres_count[section_key] = {};
                    // get all songs for section
                    getAllSongs(address, port, plex_token, section_key, function(songs) {
                        all_songs = all_songs.concat(songs);
                        section_songs[section_key] = songs;

                        // because the plex web api calls for library sections only returns the first two genres
                        // of each album we need to get all the genre mappings first and count the number of albums
                        // returned by the api with that genre filtered out
                        getSectionGenres(address, port, plex_token, section_key, function(genres) {
                            task_counter += Object.keys(genres).length;

                            for (var genre_key in genres) {
                                (function (genre_key) {
                                    var genre_title = genres[genre_key];
                                    getAlbumsByGenre(address, port, plex_token, section_key, genre_key, function(genre_albums) {
                                        if (album_genres_count[genre_title]) {
                                            album_genres_count[genre_title] += genre_albums.length;
                                        }
                                        else {
                                            album_genres_count[genre_title] = genre_albums.length;
                                        }
                                        if (section_album_genres_count[section_key][genre_title]) {
                                            section_album_genres_count[section_key][genre_title] += genre_albums.length;
                                        }
                                        else {
                                            section_album_genres_count[section_key][genre_title] = genre_albums.length;
                                        }
                                        task_completed();
                                    });
                                }(genre_key));
                            }
                            task_completed();
                        });
                    });

                    task_counter++;
                    getAllAlbums(address, port, plex_token, section_key, function(albums) {
                        all_albums = all_albums.concat(albums);
                        section_albums[section_key] = albums;

                        task_completed();
                    });
                }
            }(section_key));
        }
    });
}

function getStats(server, section, force, callback) {
    var machine_identifier = server["machine_identifier"];
    var name = server["name"];
    var address = server["address"];
    var port = server["port"];
    var plex_token = server["access_token"];

    var cache_key;
    if (section) {
        // get section stats
        cache_key = "cache-stats-" + machine_identifier + "-" + section;
    }
    else {
        // get server stats
        cache_key = "cache-stats-" + machine_identifier;
    }

    utils.local_storage_get(cache_key, function(data) {
        // if force is true then we are recalculating stats
        if (data && !force) {
            utils.debug("Cache hit for " + cache_key);
            var timestamp = data["timestamp"];
            if (section) {
                var stats = data["stats"];
                callback(stats, timestamp);
            }
            else {
                var movie_stats = data["movie_stats"];
                var show_stats = data["show_stats"];
                var music_stats = data["music_stats"];
                callback({"movie_stats": movie_stats, "show_stats": show_stats, "music_stats": music_stats}, timestamp);
            }
        }
        else {
            utils.debug("Cache miss for " + cache_key);
            generateStats(address, port, plex_token, function(movie_stats, movie_section_stats, show_stats, show_section_stats, music_stats, music_section_stats) {
                if (movie_stats === null) {
                    // couldn't reach server to get data
                    utils.debug("Couldn't reach server " + address + ":" + port + " to get stat data");
                    callback(null);
                    return;
                }
                var timestamp = new Date().getTime();
                var hash = {"name": name, "movie_stats": movie_stats, "show_stats": show_stats, "music_stats": music_stats, "timestamp": timestamp};
                utils.local_storage_set(cache_key, hash);

                for (var section_key in movie_section_stats) {
                    var section_hash = {"stats": movie_section_stats[section_key], "timestamp": timestamp};
                    utils.local_storage_set("cache-stats-" + machine_identifier + "-" + section_key, section_hash);
                }

                for (var section_key in show_section_stats) {
                    var section_hash = {"stats": show_section_stats[section_key], "timestamp": timestamp};
                    utils.local_storage_set("cache-stats-" + machine_identifier + "-" + section_key, section_hash);
                }

                for (var section_key in music_section_stats) {
                    var section_hash = {"stats": music_section_stats[section_key], "timestamp": timestamp};
                    utils.local_storage_set("cache-stats-" + machine_identifier + "-" + section_key, section_hash);
                }

                callback({"movie_stats": movie_stats, "show_stats": show_stats, "music_stats": music_stats}, timestamp);
            });
        }
    });
}

function recalculateServerStats() {
    hideDisplay();
    switchToServer(servers[active_server], null, true);
}

function updateNav() {
    // set active server name on nav bar
    var server_name_element = document.getElementById("active-server-name");
    // clear what's already there
    while (server_name_element.firstChild) {
        server_name_element.removeChild(server_name_element.firstChild);
    }

    var server_name_text_node = document.createTextNode(servers[active_server]["name"]);
    server_name_element.appendChild(server_name_text_node);

    if (active_section) {
        var section_name = active_section["title"];
        var section_name_span = document.createElement("span");
        section_name_span.setAttribute("id", "active-section-name");
        var section_name_text_node = document.createTextNode("(" + section_name+ ")");
        section_name_span.appendChild(section_name_text_node);
        server_name_element.appendChild(section_name_span);
    }
}

function setServerSelections() {
    var server_list_element = document.getElementById("server-choices");

    // add all server choices
    for (var server in servers) {
        var li = document.createElement("li");
        var server_element = document.createElement("a");
        server_element.setAttribute("href", "#");
        server_element.setAttribute("class", "server-choice");
        server_element.setAttribute("data-machine_identifier", servers[server]["machine_identifier"]);
        var text_node = document.createTextNode(servers[server]["name"]);

        server_element.appendChild(text_node);
        li.appendChild(server_element);
        server_list_element.appendChild(li);
    }
}

function addSectionSelections() {
    for (var server in servers) {
        (function (server) {
            sections[server] = {};
            getSections(servers[server]["address"], servers[server]["port"], servers[server]["access_token"], function(sections_xml) {
                var server_picker;
                var server_choices = document.getElementsByClassName("server-choice");
                for (var i = 0; i < server_choices.length; i++) {
                    if (server_choices[i].getAttribute("data-machine_identifier") === servers[server]["machine_identifier"]) {
                        server_picker = server_choices[i].parentNode;
                        break;
                    }
                }

                var ul = document.createElement("ul");
                server_picker.appendChild(ul);

                // create All option, to select collated server stats
                var li = document.createElement("li");
                var all_section_element = document.createElement("a");
                all_section_element.setAttribute("href", "#");
                all_section_element.setAttribute("class", "section-choice");
                all_section_element.setAttribute("id", "server-all-choice");
                all_section_element.setAttribute("data-machine_identifier", servers[server]["machine_identifier"]);
                // no section_key data attribute so when clicked getStats() returns collated server stats
                var text_node = document.createTextNode("All");

                all_section_element.appendChild(text_node);
                li.appendChild(all_section_element);
                ul.appendChild(li);

                // add event handler
                all_section_element.addEventListener("click", switchSection, false);

                if (!sections_xml) {
                    // couldn't reach server to get sections data
                    utils.debug("Couldn't reach server " + servers[server]["name"] + " at " + servers[server]["address"] + ":" + servers[server]["port"]);
                    utils.debug("Skipping sections for this server");
                    return;
                }

                var processed_sections = processLibrarySections(sections_xml);
                // sort section keys by section type
                var sorted_keys = Object.keys(processed_sections).sort(function(a, b) {
                    return processed_sections[a]["type"] > processed_sections[b]["type"];
                });

                for (var i = 0; i < sorted_keys.length; i++) {
                    var section_key = sorted_keys[i];

                    utils.debug("Inserting section " + processed_sections[section_key]["title"] + " for " + servers[server]["name"]);

                    var title = processed_sections[section_key]["title"];
                    var type = processed_sections[section_key]["type"];
                    sections[server][section_key] = {"title": title, "type": type};

                    var li = document.createElement("li");
                    var section_element = document.createElement("a");
                    section_element.setAttribute("href", "#");
                    section_element.setAttribute("class", "section-choice");
                    section_element.setAttribute("data-machine_identifier", servers[server]["machine_identifier"]);
                    section_element.setAttribute("data-section_key", section_key);
                    var text_node = document.createTextNode(title);

                    section_element.appendChild(text_node);
                    li.appendChild(section_element);
                    ul.appendChild(li);

                    // add event handler
                    section_element.addEventListener("click", switchSection, false);
                }
            });
        }(server));
    }
}

function switchSection(e) {
    // show loading indicator and hide charts, last updated
    hideDisplay();

    var machine_identifier = e.target.getAttribute("data-machine_identifier");
    var section_key = e.target.getAttribute("data-section_key");
    switchToServer(servers[machine_identifier], section_key, false);
}

function switchToServer(server, section_key, refresh) {
    // hide all charts and show loading indicator
    hideDisplay();

    active_server = server["machine_identifier"];
    if (section_key) {
        active_section = sections[server["machine_identifier"]][section_key];
    }
    else {
        active_section = null;
    }

    // update the nav with new active server
    updateNav();

    getStats(server, section_key, refresh, function(stats, last_updated) {
        if (stats === null) {
            // couldn't reach server to get data
            document.getElementById("loading-indicator").style.display = "none";
            document.getElementById("server-error-indicator").style.display = "block";
            return;
        }

        var statsPresentForType = function(type) {
            var stats_type = stats[type + "_stats"]
            for (var key in stats_type) {
                if (Object.keys(stats_type[key]).length > 1) {
                    return true;
                }
            }
            return false;
        };

        var movies_present = statsPresentForType("movie");
        var shows_present = statsPresentForType("show");
        var music_present = statsPresentForType("music");

        setLastUpdated(last_updated);

        // draw charts
        if (active_section) {
            showDisplay();

            if (active_section["type"] === "movie") {
                // draw movie charts
                drawMovieYearsChart(stats["year_count"]);
                drawMovieGenreChart(stats["genre_count"]);
                drawMovieRatingChart(stats["movie_rating_count"]);
                drawMovieDateAddedChart(stats["date_added_count"]);
                drawMovieContentRatingChart(stats["content_rating_count"]);
                drawMovieResolutionChart(stats["resolution_count"]);
            }
            else if (active_section["type"] === "show") {
                // draw tv show charts
                drawShowYearsChart(stats["year_count"]);
                drawShowGenreChart(stats["genre_count"]);
                drawShowRatingChart(stats["show_rating_count"]);
                drawShowDateAddedChart(stats["episodes_date_added_count"]);
                drawShowContentRatingChart(stats["content_rating_count"]);
                drawShowResolutionChart(stats["resolution_count"]);
            }
            else {
                // draw music charts
                drawAlbumYearsChart(stats["year_count"]);
            }
        }
        else {
            // only display charts if library type exists for server
            if (movies_present) {
                showDisplay("movies");
            }
            if (shows_present) {
                showDisplay("shows");
            }
            if (music_present) {
                showDisplay("music");
            }

            // draw all charts
            drawMovieYearsChart(stats["movie_stats"]["year_count"]);
            drawMovieGenreChart(stats["movie_stats"]["genre_count"]);
            drawMovieRatingChart(stats["movie_stats"]["movie_rating_count"]);
            drawMovieDateAddedChart(stats["movie_stats"]["date_added_count"]);
            drawMovieContentRatingChart(stats["movie_stats"]["content_rating_count"]);
            drawMovieResolutionChart(stats["movie_stats"]["resolution_count"]);

            drawShowYearsChart(stats["show_stats"]["year_count"]);
            drawShowGenreChart(stats["show_stats"]["genre_count"]);
            drawShowRatingChart(stats["show_stats"]["show_rating_count"]);
            drawShowDateAddedChart(stats["show_stats"]["episodes_date_added_count"]);
            drawShowContentRatingChart(stats["show_stats"]["content_rating_count"]);
            drawShowResolutionChart(stats["show_stats"]["resolution_count"]);

            drawAlbumYearsChart(stats["music_stats"]["year_count"]);
        }
    });
}

function setLastUpdated(timestamp) {
    last_updated_string = "Last Updated: " + formattedDateString(timestamp);

    document.getElementById("server-updated").innerHTML = last_updated_string;
    document.getElementById("server-updated").style.display = "inline-block";
}


// init
utils.storage_get_all(function(settings) {
    getServerAddresses(function(pms_servers) {
        // check to make sure user has opened plex/web first so we can receive server addresses
        if (!pms_servers) {
            document.getElementById("loading-indicator").style.display = "none";
            document.getElementById("token-error-indicator").style.display = "block";
            return;
        }

        utils.debug("Server addresses fetched");
        for (var server in pms_servers) {
            utils.debug(pms_servers[server]);
        }

        servers = pms_servers;

        // override server addresses if defined in settings
        if (settings["plex_server_address"] !== "" && settings["plex_server_port"] !== "") {
            utils.debug("Plex servers manual override");
            utils.debug("Setting server addresses as " + settings["plex_server_address"] + " and server ports as " + settings["plex_server_port"]);

            for (var server in servers) {
                servers[server]["address"] = settings["plex_server_address"];
                servers[server]["port"] = settings["plex_server_port"];
            }
        }

        // just load first server from array on first page load
        active_server = Object.keys(servers)[0];
        utils.debug("set active server as " + active_server);
        switchToServer(servers[active_server]);

        // Create server list on nav bar and then asynchronously add sections to them
        setServerSelections();
        addSectionSelections();

        // add event handlers for last updated nav bar element
        var server_updated_element = document.getElementById("server-updated");
        server_updated_element.addEventListener("mouseover", function(e) {
            server_updated_element.innerHTML = "recalculate server stats";
            }, false
        );
        server_updated_element.addEventListener("mouseout", function(e) {
            server_updated_element.innerHTML = last_updated_string;
            }, false
        );
        server_updated_element.addEventListener("click", function(e) {
            recalculateServerStats();
            }, false
        );
    });
});