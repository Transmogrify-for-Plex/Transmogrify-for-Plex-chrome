split_added_deck = {
    show_movies: true,
    show_tv_shows: true,

    init: function() {
        var header_elements = document.getElementsByTagName("h3");
        for (var i = 0; i < header_elements.length; i++) {
            var header_text = header_elements[i].innerHTML;

            if (header_text === "On Deck" || header_text === "Recently Added") {
                header_elements[i].innerHTML = header_text + " <span class='split-text split-show split-movie'>Movies</span> <span class='split-text split-show split-tv-show'>TV Shows</span>";
            }
        }

        var movie_buttons = document.getElementsByClassName("split-movie");
        for (var i = 0; i < movie_buttons.length; i++) {
            movie_buttons[i].addEventListener("click", split_added_deck.toggleMovies, false);
        }

        var tv_show_buttons = document.getElementsByClassName("split-tv-show");
        for (var i = 0; i < tv_show_buttons.length; i++) {
            tv_show_buttons[i].addEventListener("click", split_added_deck.toggleTVShows, false);
        }
    },

    toggleMovies: function() {
        var movie_posters = document.getElementsByClassName("movie");
        for (var i = 0; i < movie_posters.length; i++) {
            if (split_added_deck.show_movies) {
                movie_posters[i].style.opacity = "0.1";
            }
            else {
                movie_posters[i].style.opacity = "1.0";
            }
        }

        var movie_buttons = document.getElementsByClassName("split-movie");
        for (var i = 0; i < movie_buttons.length; i++) {
            if (split_added_deck.show_movies) {
                movie_buttons[i].setAttribute("class", "split-text split-hide split-movie");
            }
            else {
                movie_buttons[i].setAttribute("class", "split-text split-show split-movie");
            }
        }

        // flip value
        split_added_deck.show_movies = !split_added_deck.show_movies;
    },

    toggleTVShows: function() {
        var tv_show_posters = document.querySelectorAll('.episode, .season');
        for (var i = 0; i < tv_show_posters.length; i++) {
            if (split_added_deck.show_tv_shows) {
                tv_show_posters[i].style.opacity = "0.1";
            }
            else {
                tv_show_posters[i].style.opacity = "1.0";
            }
        }

        var tv_show_buttons = document.getElementsByClassName("split-tv-show");
        for (var i = 0; i < tv_show_buttons.length; i++) {
            if (split_added_deck.show_tv_shows) {
                tv_show_buttons[i].setAttribute("class", "split-text split-hide split-tv-show");
            }
            else {
                tv_show_buttons[i].setAttribute("class", "split-text split-show split-tv-show");
            }
        }

        // flip value
        split_added_deck.show_tv_shows = !split_added_deck.show_tv_shows;
    }
}