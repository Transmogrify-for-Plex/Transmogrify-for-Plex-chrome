themoviedb = {
    getImdbId: function(tmdb_id, callback) {
        debug("themoviedb plugin: Reading API key");
        var api_key = utils.getApiKey("themoviedb");
        debug("themoviedb plugin: Successfully read API key");

        var api_url = "https://api.themoviedb.org/3/movie/" + tmdb_id + "?api_key=" + api_key;

        utils.getJSON(api_url, true, function(themoviedb_json) {
            var imdb_id = themoviedb_json["imdb_id"];
            callback(imdb_id);
        });
    }
}