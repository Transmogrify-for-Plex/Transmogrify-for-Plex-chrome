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

function getAllMovies(address, port, plex_token, section_key, callback) {
    var library_section_url = "http://" + address + ":" + port + "/library/sections/" + section_key + "/all?X-Plex-Token=" + plex_token;
    utils.getXML(library_section_url, function(section_xml) {
        var movies_xml = section_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video");

        var movies = [];
        for (i = 0; i < movies_xml.length; i++) {
            var movie_data = {};
            movie_data["title"] = movies_xml[i].getAttribute("title");
            movie_data["content_rating"] = movies_xml[i].getAttribute("contentRating");
            movie_data["rating"] = movies_xml[i].getAttribute("rating");
            movie_data["view_count"] = movies_xml[i].getAttribute("viewCount");
            movie_data["year"] = movies_xml[i].getAttribute("year");
            movie_data["added_at"] = movies_xml[i].getAttribute("addedAt");

            var metadata_xml = movies_xml[i].getElementsByTagName("Media")[0];
            movie_data["video_resolution"] = metadata_xml.getAttribute("videoResolution");
            movie_data["duration"] = parseInt(metadata_xml.getAttribute("duration"));
            // won't handle multiple copies of a movie gracefully

            var part_xml = metadata_xml.getElementsByTagName("Part")[0];
            movie_data["size"] = parseInt(part_xml.getAttribute("size"));

            movies.push(movie_data);
        }

        callback(movies);
    });
}

function generateStats() {
    getServerAddresses(function(response) {
        // make this into a proper loop later
        for (var machine_identifier in response) {
            var address = response[machine_identifier]["address"];
            var port = response[machine_identifier]["port"];
            var plex_token = response[machine_identifier]["access_token"];

            getSections(address, port, plex_token, function(sections_xml) {
                var processed_sections = processLibrarySections(sections_xml);

                var movies = {};
                var tv_shows = {};

                for (var key in processed_sections) {
                    if (processed_sections[key]["type"] === "movie" && processed_sections[key]["scanner"] === "Plex Movie Scanner") {
                        getAllMovies(address, port, plex_token, key, function(movies) {
                            console.log(movies);
                        });
                    }
                    else if (processed_sections[key]["type"] === "show" && processed_sections[key]["scanner"] === "Plex Series Scanner") {

                    }
                }
            });
            break;
        }
    });
}

generateStats();