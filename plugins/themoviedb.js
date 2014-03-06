function getImdbId(tmdb_id) {
    debug("themoviedb plugin: Reading API key");
    var api_key = readFile(chrome.extension.getURL("resources/themoviedb_api_key.txt"));
    debug("themoviedb plugin: Successfully read API key");

    var api_url = "https://api.themoviedb.org/3/movie/" + tmdb_id + "?api_key=" + api_key;

    var themoviedb_json = getJSON(api_url);

    return themoviedb_json["imdb_id"];
}