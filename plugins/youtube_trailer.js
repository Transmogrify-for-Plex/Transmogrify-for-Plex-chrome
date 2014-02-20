function getYoutubeEmbedLink(title, year) {
    var search_params = title + " (" + year + ") official trailer";

    var search_results_xml = getXML("https://gdata.youtube.com/feeds/api/videos?q=" + search_params);
    var first_entry = search_results_xml.getElementsByTagName("feed")[0].getElementsByTagName("entry")[0];
    var id = first_entry.getElementsByTagName("id")[0].childNodes[0].nodeValue;

    var youtube_id = id.match(/^http:\/\/gdata\.youtube\.com\/feeds\/api\/videos\/(.+)/)[1];

    return "//www.youtube.com/embed/" + youtube_id + "?rel=0&iv_load_policy=3&vq=hd1080&autoplay=1";
}

function openTrailer(xml) {
    var movie_title = xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0].getAttribute("title");
    var movie_year = xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0].getAttribute("year");
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
    var trailer = document.getElementById("trailer");
    trailer.parentNode.removeChild(trailer);

    document.getElementById("overlay").style.display = "none";
}

function createTrailerButton(xml) {
    // don"t run if element already exists on page
    if (document.getElementById("btn-trailer")) {
        return;
    }

    var trailer_button = document.createElement("button");
    trailer_button.setAttribute("class", "btn btn-lg btn-primary btn-trailer");
    trailer_button.setAttribute("id", "btn-trailer");

    var button_text = document.createTextNode("Watch Trailer");
    trailer_button.appendChild(button_text);

    // insert trailer button after play button and before audio codecs container
    var audio_container = document.getElementsByClassName("video-audio-flags-container")[0];
    document.getElementsByClassName("details-poster-container")[0].insertBefore(trailer_button, audio_container);

    // attach click event listener to play trailer
    document.getElementById("btn-trailer").addEventListener("click", function(){openTrailer(xml);}, false);

    // insert dark overlay for when trailer plays
    insertOverlay();
}