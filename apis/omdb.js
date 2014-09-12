omdb_api = {
    searchByImdbId: function(query, callback) {
        var api_url = "http://www.omdbapi.com/?i=" + query;

        utils.getJSON(api_url, true, function(omdb_json) {
            callback(omdb_json);
        });
    },

    searchByMovieTitle: function(query, movie_year, callback) {
        var api_url = "http://www.omdbapi.com/?t=" + encodeURIComponent(query) + "&y=" + movie_year;

        utils.getJSON(api_url, true, function(omdb_json) {
            callback(omdb_json);
        });
    },
}