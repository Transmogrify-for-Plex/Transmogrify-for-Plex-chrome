trakt_api = {
    api_key: utils.getApiKey("trakt"),
    custom_headers: {
        'Content-Type': 'application/json',
        'trakt-api-version': '2',
        'trakt-api-key': utils.getApiKey("trakt")
    },

    doSearch: function (query, search_type, year, callback) {
        var search_critera = search_type == "imdb" ? "id_type=imdb&id=" : "type=movie&year=" + year + "&query=";
        var api_url = "https://api.trakt.tv/search?" + search_critera + encodeURIComponent(query);

        utils.getJSONWithCache(api_url, function (trakt_json) {
            callback(trakt_json[0]);
        }, trakt_api.custom_headers);
    },

    getMovieRating: function (query, callback) {
        var api_url = "https://api.trakt.tv/movies/" + encodeURIComponent(query) + "/ratings";

        utils.getJSONWithCache(api_url, function (trakt_json) {
            callback(trakt_json);
        }, trakt_api.custom_headers);
    },

    getShowRating: function (query, callback) {
        var api_url = "https://api.trakt.tv/shows/" + encodeURIComponent(query) + "/ratings";

        utils.getJSONWithCache(api_url, function (trakt_json) {
            callback(trakt_json);
        }, trakt_api.custom_headers);
    },

    getSeasonRating: function (query, season_num, callback) {
        var api_url = "https://api.trakt.tv/shows/" + encodeURIComponent(query) + "/seasons/" + season_num + "/ratings";

        utils.getJSONWithCache(api_url, function (trakt_json) {
            callback(trakt_json);
        }, trakt_api.custom_headers);
    },

    getEpisodeRating: function (query, season_num, episode_num, callback) {
        var api_url = "https://api.trakt.tv/shows/" + encodeURIComponent(query) + "/seasons/" + season_num + "/episodes/" + episode_num + "/ratings";

        utils.getJSONWithCache(api_url, function (trakt_json) {
            callback(trakt_json);
        }, trakt_api.custom_headers);
    },

    getAllEpisodes: function (show_name, season_num, callback) {
        var api_url = "https://api.trakt.tv/shows/" + encodeURIComponent(show_name) + "/seasons/" + season_num;

        utils.getJSONWithCache(api_url, function (trakt_json) {
            callback(trakt_json);
        }, trakt_api.custom_headers);
    },

    getAllSeasons: function (show_name, callback) {
        var api_url = "https://api.trakt.tv/shows/" + encodeURIComponent(show_name) + "/seasons?extended=episodes";

        utils.getJSONWithCache(api_url, function (trakt_json) {
            callback(trakt_json);
        }, trakt_api.custom_headers);
    }
}