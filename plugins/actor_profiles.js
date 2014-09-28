actor_profiles = {
    actor_overlay: null,
    movie_cast: null,
    cast_bios: {},

    init: function(metadata_xml) {
        actor_profiles.insertActorOverlay();

        // grab tmdb/imdb id
        var imdb_id;
        var tmdb_id;
        var agent = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0].getAttribute("guid");
        // check if using the freebase metadata agent
        if (/com\.plexapp\.agents\.imdb/.test(agent)) {
            imdb_id = agent.match(/^com\.plexapp\.agents\.imdb:\/\/(.+)\?/)[1];
            utils.debug("actor_profiles plugin: imdb id found - " + imdb_id);
        }
        // check if using the movie database metadata agent
        else if (/com\.plexapp\.agents\.themoviedb/.test(agent)) {
            tmdb_id = agent.match(/^com\.plexapp\.agents\.themoviedb:\/\/(.+)\?/)[1];
            utils.debug("actor_profiles plugin: tmdb id found - " + tmdb_id);
        }
        // check if using the XBMCnfoMoviesImporter agent
        else if (/com\.plexapp\.agents\.xbmcnfo/.test(agent)) {
            imdb_id = agent.match(/^com\.plexapp\.agents\.xbmcnfo:\/\/(.+)\?/)[1];
            utils.debug("actor_profiles plugin: imdb id found - " + imdb_id);
        }
        // agent not recognized
        else {
            utils.debug("actor_profiles plugin: Movie agent not recognized, aborting");
            return;
        }

        if (imdb_id) {
            // need to retrieve tmdb_id first through tmdb API, then get movie cast
            themoviedb_api.getTmdbId(imdb_id, "movie", actor_profiles.getMovieCast);
        }
        else if (tmdb_id) {
            // get movie cast
            actor_profiles.getMovieCast(tmdb_id);
        }
    },

    insertActorOverlay: function() {
        // don't run if overlay exists on page
        utils.debug("actor_profiles plugin: Checking if overlay already exists before creating");
        var existing_overlay = document.getElementById("actor-overlay");
        if (existing_overlay) {
            utils.debug("actor_profiles plugin: Overlay already exists. Passing");
            return;
        }

        // container div
        var actor_overlay = document.createElement("div");
        actor_overlay.setAttribute("id", "actor-overlay");

        // left aligned actor image
        var actor_overlay_img = document.createElement("img");
        actor_overlay_img.setAttribute("id", "actor-overlay-img");
        actor_overlay.appendChild(actor_overlay_img);

        // right aligned text container div
        var actor_overlay_text = document.createElement("div");
        actor_overlay_text.setAttribute("id", "actor-text");

        var actor_overlay_text_name = document.createElement("h2");
        actor_overlay_text_name.setAttribute("id", "actor-text-name");
        actor_overlay_text.appendChild(actor_overlay_text_name);

        var actor_overlay_text_role = document.createElement("div");
        actor_overlay_text_role.setAttribute("id", "actor-text-role");
        actor_overlay_text.appendChild(actor_overlay_text_role);

        var actor_overlay_text_born = document.createElement("div");
        actor_overlay_text_born.setAttribute("id", "actor-text-born");
        actor_overlay_text.appendChild(actor_overlay_text_born);

        var actor_overlay_text_died = document.createElement("div");
        actor_overlay_text_died.setAttribute("id", "actor-text-died");
        actor_overlay_text.appendChild(actor_overlay_text_died);

        var actor_overlay_text_birthplace = document.createElement("div");
        actor_overlay_text_birthplace.setAttribute("id", "actor-text-birthplace");
        actor_overlay_text.appendChild(actor_overlay_text_birthplace);

        var actor_overlay_text_biography = document.createElement("div");
        actor_overlay_text_biography.setAttribute("id", "actor-text-biography");
        actor_overlay_text.appendChild(actor_overlay_text_biography);

        // insert overlay into document
        actor_overlay.appendChild(actor_overlay_text);
        document.body.appendChild(actor_overlay);

        // hide overlay when mouse leaves div
        actor_overlay.addEventListener("mouseleave", (function(e) {
            actor_overlay.style.display = "none";
        }), false);

        actor_profiles.actor_overlay = actor_overlay;

        utils.debug("actor_profiles plugin: Inserted actor_profile overlay");
    },

    getMovieCast: function(tmdb_id) {
        themoviedb_api.getMovieCast(tmdb_id, function(cast_json) {
            actor_profiles.movie_cast = cast_json;
            actor_profiles.createHoverEvents();
        })
    },

    createHoverEvents: function() {
        // find actors list element on page
        var cast_list_elements = document.getElementsByClassName("item-cast")[0].getElementsByClassName("metadata-tag-list")[0].getElementsByTagName("a");

        // add mouseover event on each actor name to show actor overlay
        for (var i = 0; i < cast_list_elements.length; i++) {
            cast_list_elements[i].addEventListener("mouseover", (function(e) {
                var actor_name = e.target.text;
                actor_profiles.showActorOverlay(e, actor_name);
            }), false);

            // add mouseleave event on each actor name to hide actor overlay
            // but only if mouse doesn't move to actor overlay div
            cast_list_elements[i].addEventListener("mouseleave", (function(e) {
                var newtarget = e.toElement || e.relatedTarget;
                if (newtarget.id != "actor-overlay") {
                    actor_profiles.actor_overlay.style.display = "none";
                }
            }), false);

            // also remove actor overlay on name click
            cast_list_elements[i].addEventListener("click", (function(e) {
                actor_profiles.actor_overlay.style.display = "none";
            }), false);
        }
    },

    showActorOverlay: function(e, actor_name) {
        // if actor bio already hovered on before, then use previously fetched info
        if (actor_name in actor_profiles.cast_bios) {
            actor_profiles.constructActorOverlayText(actor_name);
            actor_profiles.showOverlay(e);
        }
        // get actor bio from tmdb API
        else {
            // match actor name from page list to movie cast list from tmdb
            var actor;
            for (var i = 0; i < actor_profiles.movie_cast.length; i++) {
                if (actor_profiles.movie_cast[i]["name"] === actor_name) {
                    actor = actor_profiles.movie_cast[i];
                    break;
                }
            }
            // use tmdb actor id to fetch bio from tmdb, and then cache information
            themoviedb_api.getActorDetails(actor["id"], function(actor_json) {
                actor_json["character"] = actor["character"];
                actor_profiles.cast_bios[actor_name] = actor_json;
                
                actor_profiles.constructActorOverlayText(actor_name);
                actor_profiles.showOverlay(e);
            });
        }
    },

    constructActorOverlayText: function(actor_name) {
        var actor_json = actor_profiles.cast_bios[actor_name];

        // construct profile image url, otherwise use placeholder image
        var actor_image;
        if (actor_json["profile_path"]) {
            actor_image = "https://image.tmdb.org/t/p/w185" + actor_json["profile_path"];
        }
        else {
            actor_image = utils.getResourcePath("actor_profiles/actor_no_image.png");
        }

        var character = actor_json["character"];
        var birthday = (actor_json["birthday"]) ? actor_json["birthday"] : "Unknown";
        var deathday = (actor_json["deathday"] && actor_json["deathday"] !== "") ? actor_json["deathday"] : null;
        var place_of_birth = (actor_json["place_of_birth"]) ? actor_json["place_of_birth"] : "Unknown";
        var biography = actor_json["biography"];

        document.getElementById("actor-overlay-img").setAttribute("src", actor_image);
        document.getElementById("actor-text-name").textContent = actor_name;
        document.getElementById("actor-text-role").textContent = "as " + character;
        document.getElementById("actor-text-born").textContent = "Born: " + birthday;
        // don't show death info if actor still alive
        if (deathday) {
            document.getElementById("actor-text-died").textContent = "Died: " + deathday;
            document.getElementById("actor-text-died").style.display = "block";
        }
        else {
            document.getElementById("actor-text-died").style.display = "none";
        }
        document.getElementById("actor-text-birthplace").textContent = "Place of birth: " + place_of_birth;
        document.getElementById("actor-text-biography").textContent = biography;
    },

    showOverlay: function(e) {
        // show actor overlay slightly to right and below mouse hover coordinates
        actor_profiles.actor_overlay.style.top = (e.pageY + 5) + "px";
        actor_profiles.actor_overlay.style.left = (e.pageX + 5) + "px";
        actor_profiles.actor_overlay.style.display = "block";
    }
}