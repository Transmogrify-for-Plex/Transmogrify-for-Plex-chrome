function getYoutubeEmbedLink(title, year) {
    debug("movie_trailers plugin: Getting YouTube embed link");
    var search_params = encodeURIComponent(title + " (" + year + ") official trailer");
    debug("movie_trailers plugin: Search query - " + search_params);

    var search_results_json = getJSON("https://gdata.youtube.com/feeds/api/videos?alt=json&q=" + search_params + "&paid_content=false&max-results=1");
    var first_entry = search_results_json["feed"]["entry"][0];
    var id = first_entry["id"]["$t"];
    debug("movie_trailers plugin: First result id field - " + id);

    var youtube_id = id.match(/^http:\/\/gdata\.youtube\.com\/feeds\/api\/videos\/(.+)/)[1];
    var youtube_link = "//www.youtube.com/embed/" + youtube_id + "?rel=0&iv_load_policy=3&vq=hd1080&autoplay=1";
    debug("movie_trailers plugin: YouTube embed link - " + youtube_link);

    return youtube_link;
}

function openTrailer(xml) {
    debug("movie_trailers plugin: Trailer button clicked");
    var movie_title = xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0].getAttribute("title");
    var movie_year = xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0].getAttribute("year");
    debug("movie_trailers plugin: Got movie year and title - " + movie_title + " (" + movie_year + ")");
    var youtube_link = getYoutubeEmbedLink(movie_title, movie_year);

    document.getElementById("overlay").style.display = "block";
    // attach click event listener on overlay to close trailer
    document.getElementById("overlay").addEventListener("click", closeTrailer, false);

    // create youtube embed iframe
    var youtube_embed = document.createElement("iframe");
    youtube_embed.setAttribute("id", "trailer");
    youtube_embed.setAttribute("src", youtube_link);
    youtube_embed.setAttribute("frameborder", 0);
    youtube_embed.setAttribute("allowFullScreen", "");

    document.getElementsByTagName("body")[0].appendChild(youtube_embed);
}

function closeTrailer() {
    debug("random_picker plugin: Close trailer clicked. Removing YouTube video");
    var trailer = document.getElementById("trailer");
    trailer.parentNode.removeChild(trailer);

    document.getElementById("overlay").style.display = "none";
}

function createTrailerButton(xml) {
    // don't run if element already exists on page
    debug("movie_trailers plugin: Checking if #btn-trailer element already exists before creating");
    if (document.getElementById("btn-trailer")) {
        debug("movie_trailers plugin: #btn-trailer element already exists. Passing");
        return;
    }

    var trailer_button = document.createElement("button");
    trailer_button.setAttribute("class", "btn btn-lg btn-primary btn-trailer");
    trailer_button.setAttribute("id", "btn-trailer");

    var button_text = document.createTextNode("Watch Trailer");
    trailer_button.appendChild(button_text);

    // insert trailer button after play button and before audio codecs container
    debug("movie_trailers plugin: Inserting movie trailer button into video-audio-flags-container");
    var audio_container = document.getElementsByClassName("video-audio-flags-container")[0];
    document.getElementsByClassName("details-poster-container")[0].insertBefore(trailer_button, audio_container);

    // attach click event listener to play trailer
    debug("movie_trailers plugin: Attaching event listener to btn-trailer button");
    document.getElementById("btn-trailer").addEventListener("click", function(){openTrailer(xml);}, false);

    // insert dark overlay for when trailer plays
    insertOverlay();
}