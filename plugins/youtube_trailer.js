youtube_trailer = {
    metadata_xml: null,
    overlay: null,

    init: function(metadata_xml) {
        youtube_trailer.metadata_xml = metadata_xml;

        var trailer_button = document.createElement("button");
        trailer_button.setAttribute("class", "btn btn-lg btn-primary btn-trailer");
        trailer_button.setAttribute("id", "btn-trailer");

        var button_text = document.createTextNode("Watch Trailer");
        trailer_button.appendChild(button_text);

        // insert trailer button after play button and before audio codecs container
        utils.debug("youtube_trailer plugin: Inserting movie trailer button into details-poster-container");
        var audio_container = document.getElementsByClassName("video-audio-flags-container")[0];
        document.getElementsByClassName("details-poster-container")[0].insertBefore(trailer_button, audio_container);

        // attach click event listener to play trailer
        utils.debug("youtube_trailer plugin: Attaching event listener to btn-trailer button");
        document.getElementById("btn-trailer").addEventListener("click", youtube_trailer.openTrailer, false);

        // insert dark overlay for when trailer plays
        youtube_trailer.overlay = utils.insertOverlay();
    },

    openTrailer: function() {
        utils.debug("youtube_trailer plugin: Trailer button clicked");
        var movie_title = youtube_trailer.metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0].getAttribute("title");
        var movie_year = youtube_trailer.metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0].getAttribute("year");
        utils.debug("youtube_trailer plugin: Got movie year and title - " + movie_title + " (" + movie_year + ")");

        youtube_trailer.getYoutubeEmbedLink(movie_title, movie_year);
    },

    closeTrailer: function() {
        utils.debug("youtube_trailer plugin: Close trailer clicked. Removing YouTube video");
        var trailer = document.getElementById("trailer");
        trailer.parentNode.removeChild(trailer);

        youtube_trailer.overlay.style.display = "none";
        youtube_trailer.overlay.removeEventListener("click", youtube_trailer.closeTrailer, false);
    },

    getYoutubeEmbedLink: function(movie_title, movie_year) {
        var youtube_api_url = "https://gdata.youtube.com/feeds/api/videos";
        var search_params = encodeURIComponent(movie_title + " (" + movie_year + ") official trailer");
        utils.debug("youtube_trailer plugin: Search query - " + search_params);

        youtube_api.getYoutubeId(search_params, function(youtube_id) {
            utils.debug("youtube_trailer plugin: Video ID - " + youtube_id);
            var youtube_url = "//www.youtube.com/embed/" + youtube_id + "?rel=0&iv_load_policy=3&vq=hd1080&autoplay=1";
            utils.debug("youtube_trailer plugin: YouTube embed link - " + youtube_url);

            youtube_trailer.insertTrailer(youtube_url);
        });
    },

    insertTrailer: function(youtube_url) {
        youtube_trailer.overlay.style.display = "block";
        // attach click event listener on overlay to close trailer
        youtube_trailer.overlay.addEventListener("click", youtube_trailer.closeTrailer, false);

        // create youtube embed iframe
        var youtube_embed = document.createElement("iframe");
        youtube_embed.setAttribute("id", "trailer");
        youtube_embed.setAttribute("src", youtube_url);
        youtube_embed.setAttribute("frameborder", 0);
        youtube_embed.setAttribute("allowFullScreen", "");

        document.body.appendChild(youtube_embed);
    }
}