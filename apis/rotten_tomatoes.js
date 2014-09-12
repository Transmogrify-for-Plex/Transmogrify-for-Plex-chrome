rotten_tomatoes_api = {
    api_key: utils.getApiKey("rotten_tomatoes"),

    getMovie: function(imdb_id, callback) {
        var api_url = "http://api.rottentomatoes.com/api/public/v1.0/movie_alias.json?apikey=" + rotten_tomatoes_api.api_key + "&type=imdb&id=" + imdb_id;

        utils.getJSON(api_url, true, function(movie_data) {
            callback(movie_data);
        });
    }
}