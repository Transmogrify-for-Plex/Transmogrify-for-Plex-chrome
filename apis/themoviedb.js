themoviedb_api = {
    api_key: utils.getApiKey("themoviedb"),

    getImdbId: function(tmdb_id, callback) {
        var api_url = "https://api.themoviedb.org/3/movie/" + tmdb_id + "?api_key=" + themoviedb_api.api_key;

        utils.getJSONWithCache(api_url, function(themoviedb_json) {
            var imdb_id = themoviedb_json["imdb_id"];
            callback(imdb_id);
        });
    },

    getTmdbId: function(imdb_id, type, callback) {
        var api_url = "https://api.themoviedb.org/3/find/" + imdb_id + "?external_source=imdb_id&api_key=" + themoviedb_api.api_key;

        utils.getJSONWithCache(api_url, function(themoviedb_json) {
            var tmdb_id = themoviedb_json[type + "_results"][0]["id"];
            callback(tmdb_id);
        });
    },

    getMovieCast: function(tmdb_id, callback) {
        var api_url = "https://api.themoviedb.org/3/movie/" + tmdb_id + "/credits?api_key=" + themoviedb_api.api_key;

        utils.getJSON(api_url, function(themoviedb_json) {
            var cast = themoviedb_json["cast"];
            callback(cast);
        });
    },

    getActorDetails: function(actor_id, callback){
        var api_url = "https://api.themoviedb.org/3/person/" + actor_id + "?api_key=" + themoviedb_api.api_key;

        utils.getJSON(api_url, function(themoviedb_json) {
            callback(themoviedb_json);
        });
    }
}