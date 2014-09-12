trakt_api = {
    api_key: utils.getApiKey("trakt"),

    getShow: function(title, callback) {
        var api_url = "http://api.trakt.tv/search/shows.json/" + trakt_api.api_key + "?query=" + encodeURIComponent(title) + "&limit=1";

        utils.getJSON(api_url, true, function(trakt_json) {
            callback(trakt_json[0]);
        });
    },

    getMovie: function(title, callback) {
        var api_url = "http://api.trakt.tv/search/movies.json/" + trakt_api.api_key + "?query=" + encodeURIComponent(title) + "&limit=1";

        utils.getJSON(api_url, true, function(trakt_json) {
            callback(trakt_json[0]);
        });
    },

    getAllEpisodes: function(tvdb_id, season_num, callback) {
        var api_url = "http://api.trakt.tv/show/season.json/" + trakt_api.api_key + "/" + tvdb_id + "/" + season_num;

        utils.getJSON(api_url, true, function(trakt_json) {
            callback(trakt_json);
        });
    },

    getAllSeasons: function(tvdb_id, callback) {
        var api_url = "http://api.trakt.tv/show/seasons.json/" + trakt_api.api_key + "/" + tvdb_id;

        utils.getJSON(api_url, true, function(trakt_json) {
            callback(trakt_json);
        });
    }
}