youtube_api = {
    api_key: utils.getApiKey("youtube"),

    getYoutubeId: function(search_params, callback) {
        var api_url = "https://www.googleapis.com/youtube/v3/search?part=id&q=" + search_params + "&type=video&maxResults=1&videoEmbeddable=true&key=" + youtube_api.api_key;
        utils.getJSONWithCache(api_url, function(youtube_json) {
            var youtube_id = youtube_json["items"][0]["id"]["videoId"];
            callback(youtube_id);
        });
    }
};
