themoviedb = {
    getImdbId: function(tmdb_id) {
        debug("themoviedb plugin: Reading API key");
        var api_key = utils.readFile(chrome.extension.getURL("resources/api_keys/themoviedb_api_key.txt"));
        debug("themoviedb plugin: Successfully read API key");

        var api_url = "https://api.themoviedb.org/3/movie/" + tmdb_id + "?api_key=" + api_key;

        var themoviedb_json = utils.getJSON(api_url, false);

        return themoviedb_json["imdb_id"];
    }
}