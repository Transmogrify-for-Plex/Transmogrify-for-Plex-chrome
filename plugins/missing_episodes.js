missing_episodes = {
    server: null,
    metadata_xml: null,

    init: function (metadata_xml, server, type) {
        missing_episodes.server = server;
        missing_episodes.metadata_xml = metadata_xml;

        missing_episodes.insertSwitch();
        if (type === "episodes") {
            missing_episodes.processEpisodes();
        }
        else if (type === "seasons") {
            missing_episodes.processSeasons();
        }
    },

    processEpisodes: function () {
        var directory_metadata = missing_episodes.metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0];
        var season_metadata_id = directory_metadata.getAttribute("ratingKey");
        var agent = directory_metadata.getAttribute("guid");
        var season_num = directory_metadata.getAttribute("index");

        utils.debug("missing_episodes plugin: Finding all present and all existing episodes");

        var show_name = missing_episodes.metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0].getAttribute("parentTitle");
        show_name = show_name.replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, "-");

        // store current page hash so plugin doesn't insert tiles if page changed
        var current_hash = location.hash;

        missing_episodes.getPresentEpisodes(season_metadata_id, function (present_episodes) {
            trakt_api.getAllEpisodes(show_name, season_num, function (all_episodes) {
                var tiles_to_insert = {};
                for (var i = 0; i < all_episodes.length; i++) {
                    var episode = all_episodes[i];
                    if (present_episodes.indexOf(episode["episode"]) === -1) {
                        var episode_tile = missing_episodes.createEpisodeTile(show_name, episode);
                        tiles_to_insert[episode["number"]] = episode_tile;
                    }
                }

                // check if page changed before inserting tiles
                if (current_hash === location.hash) {
                    missing_episodes.insertEpisodeTiles(tiles_to_insert);
                }
                else {
                    utils.debug("missing_episodes plugin: Page changed before episode tiles could be inserted");
                }
            });
        });
    },

    processSeasons: function () {
        var directory_metadata = missing_episodes.metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0];
        var show_metadata_id = directory_metadata.getAttribute("ratingKey");
        var agent = directory_metadata.getAttribute("guid");

        var show_name;
        utils.debug("missing_episodes plugin: Finding all present and all existing seasons");
        if (missing_episodes.metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0].getAttribute("originalTitle") != null) {
            show_name = missing_episodes.metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0].getAttribute("originalTitle");
        }
        else {
            show_name = missing_episodes.metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0].getAttribute("title");
        }
        show_name = show_name.replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, "-");

        // store current page hash so plugin doesn't insert tiles if page changed
        var current_hash = location.hash;
        missing_episodes.getPresentSeasons(show_metadata_id, function (present_seasons) {
            trakt_api.getAllSeasons(show_name, function (all_seasons) {
                var tiles_to_insert = {};
                for (var i = 0; i < all_seasons.length; i++) {
                    var season = all_seasons[i];
                    if (present_seasons.indexOf(season["number"]) === -1) {
                        if (season["number"] == 0) {
                            // ignore specials
                            continue;
                        }
                        var season_tile = missing_episodes.createSeasonTile(show_name, season);
                        tiles_to_insert[season["number"]] = season_tile;
                    }
                }

                // check if page changed before inserting tiles
                if (current_hash === location.hash) {
                    missing_episodes.insertSeasonTiles(tiles_to_insert);
                }
                else {
                    utils.debug("missing_episodes plugin: Page changed before season tiles could be inserted");
                }
            });
        });
    },

    getPresentEpisodes: function (season_metadata_id, callback) {
        utils.debug("missing_episodes plugin: Fetching season episodes xml");
        var episodes_metadata_xml_url = missing_episodes.server["uri"] + "/library/metadata/" + season_metadata_id + "/children?X-Plex-Token=" + missing_episodes.server["access_token"];
        utils.getXML(episodes_metadata_xml_url, function (episodes_metadata_xml) {
            var episodes_xml = episodes_metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video");
            var episodes = [];
            for (var i = 0; i < episodes_xml.length; i++) {
                episodes.push(parseInt(episodes_xml[i].getAttribute("index")));
            }
            callback(episodes);
        });
    },

    getPresentSeasons: function (show_metadata_id, callback) {
        utils.debug("missing_episodes plugin: Fetching seasons xml");
        var seasons_metadata_xml_url = missing_episodes.server["uri"] + "/library/metadata/" + show_metadata_id + "/children?X-Plex-Token=" + missing_episodes.server["access_token"];
        utils.getXML(seasons_metadata_xml_url, function (seasons_metadata_xml) {
            var seasons_xml = seasons_metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory");
            var seasons = [];
            for (var i = 0; i < seasons_xml.length; i++) {
                var season_index = parseInt(seasons_xml[i].getAttribute("index"));
                if (!isNaN(season_index)) {
                    seasons.push(season_index);
                }
            }
            callback(seasons);
        });
    },

    createEpisodeTile: function (show_name, episode) {
        var orig_episode_tile = document.querySelectorAll("[class*=MetadataPosterListItem-card-]")[1].parentNode
        var orig_poster_container = document.querySelectorAll("[class*=MetadataPosterListItem-card-]")[1]
        var orig_poster_tile = document.querySelectorAll("[class*=MetadataPosterListItem-card-]")[1].childNodes[0]
        var orig_poster = document.querySelectorAll("[class*=MetadataPosterCard-image-]")[1]
        var orig_poster_badge = document.querySelectorAll("[class*=MetadataPosterListItem-card-]")[1].childNodes[1]
        var orig_poster_link = document.querySelectorAll("[class*=MetadataPosterListItem-card-]")[1].childNodes[2]
        var orig_episode_link = document.querySelectorAll("[class*=MetadataPosterListItem-card-]")[1].parentNode.childNodes[1]
        var orig_episode_number = document.querySelectorAll("[class*=MetadataPosterListItem-card-]")[1].parentNode.childNodes[2]

        var episode_tile = document.createElement("div");
        var poster_container = document.createElement("div");
        var poster_tile = document.createElement("div");
        var poster = document.createElement("div");
        var poster_badge = document.createElement("div");
        var poster_link = document.createElement("a");
        var episode_link = document.createElement("a");
        var episode_number = document.createElement("span");

        episode_tile.setAttribute("class", "missing_episode_tile");
        poster_container.id = "poster_container";
        poster_tile.id = "poster_tile";
        poster.id = "poster";
        poster_badge.id = "poster_badge";
        poster_link.id = "poster_link";
        episode_link.id = "episode_link";
        episode_number.id = "episode_number";

        episode_tile.appendChild(poster_container);
        episode_tile.appendChild(episode_link);
        episode_tile.appendChild(episode_number);
        poster_container.appendChild(poster_tile);
        poster_container.appendChild(poster_badge);
        poster_container.appendChild(poster_link);
        poster_tile.appendChild(poster);

        episode_tile.style.cssText = orig_episode_tile.style.cssText
        poster_container.style.cssText = orig_poster_container.style.cssText
        poster_tile.style.cssText = orig_poster_tile.style.cssText
        poster.style.cssText = orig_poster.style.cssText
        poster_badge.style.cssText = orig_poster_badge.style.cssText
        poster_link.style.cssText = orig_poster_link.style.cssText
        episode_link.style.cssText = orig_episode_link.style.cssText
        episode_number.style.cssText = orig_episode_number.style.cssText

        poster_container.setAttribute("class", orig_poster_container.getAttribute("class"));
        poster.setAttribute("class", orig_poster.getAttribute("class"));
        poster_badge.setAttribute("class", orig_poster_badge.getAttribute("class"));
        poster_link.setAttribute("class", orig_poster_link.getAttribute("class"));
        episode_link.setAttribute("class", orig_episode_link.getAttribute("class"));
        episode_number.setAttribute("class", orig_episode_number.getAttribute("class"));

        episode_tile.style.position = "relative";
        episode_tile.style.float = "left";
        episode_tile.style.marginRight = "20px";
        episode_tile.style.marginBottom = "20px";
        episode_tile.style.transform = "";

        poster_link.setAttribute("href", "https://trakt.tv/shows/" + show_name + "/seasons/" + episode["season"] + "/episodes/" + episode["number"]);
        poster_link.setAttribute("target", "_blank");

        episode_link.innerText = episode["title"] || "TBA"
        episode_link.setAttribute("href", "https://trakt.tv/shows/" + show_name + "/seasons/" + episode["season"] + "/episodes/" + episode["number"]);
        episode_link.setAttribute("target", "_blank");

        poster.setAttribute("style", "background-image: url(" + (episode["screen"] || utils.getResourcePath("trakt/trakt_episode_background.png")) + "); width: 100%; height: 100%; background-size: cover; background-position: center center; background-repeat: no-repeat;");

        episode_number.innerText = "Episode " + episode["number"]

        return episode_tile;
    },

    createSeasonTile: function (show_name, season) {
        var orig_season_tile = document.querySelectorAll("[class*=MetadataPosterListItem-card-]")[1].parentNode
        var orig_poster_container = document.querySelectorAll("[class*=MetadataPosterListItem-card-]")[1]
        var orig_poster_tile = document.querySelectorAll("[class*=MetadataPosterListItem-card-]")[1].childNodes[0]
        var orig_poster = document.querySelectorAll("[class*=MetadataPosterCard-image-]")[1]
        var orig_poster_badge = document.querySelectorAll("[class*=MetadataPosterListItem-card-]")[1].childNodes[1]
        var orig_poster_link = document.querySelectorAll("[class*=MetadataPosterListItem-card-]")[1].childNodes[2]
        var orig_season_link = document.querySelectorAll("[class*=MetadataPosterListItem-card-]")[1].parentNode.childNodes[1]
        var orig_season_episodes = document.querySelectorAll("[class*=MetadataPosterListItem-card-]")[1].parentNode.childNodes[2]

        var season_tile = document.createElement("div");
        var poster_container = document.createElement("div");
        var poster_tile = document.createElement("div");
        var poster = document.createElement("div");
        var poster_badge = document.createElement("div");
        var poster_link = document.createElement("a");
        var season_link = document.createElement("a");
        var season_episodes = document.createElement("span");

        season_tile.setAttribute("class", "missing_season_tile");
        poster_container.id = "poster_container";
        poster_tile.id = "poster_tile";
        poster.id = "poster";
        poster_badge.id = "poster_badge";
        poster_link.id = "poster_link";
        season_link.id = "season_link";
        season_episodes.id = "season_episodes";

        season_tile.appendChild(poster_container);
        season_tile.appendChild(season_link);
        season_tile.appendChild(season_episodes);
        poster_container.appendChild(poster_tile);
        poster_container.appendChild(poster_badge);
        poster_container.appendChild(poster_link);
        poster_tile.appendChild(poster);

        season_tile.style.cssText = orig_season_tile.style.cssText
        poster_container.style.cssText = orig_poster_container.style.cssText
        poster_tile.style.cssText = orig_poster_tile.style.cssText
        poster.style.cssText = orig_poster.style.cssText
        poster_badge.style.cssText = orig_poster_badge.style.cssText
        poster_link.style.cssText = orig_poster_link.style.cssText
        season_link.style.cssText = orig_season_link.style.cssText
        season_episodes.style.cssText = orig_season_episodes.style.cssText

        poster_container.setAttribute("class", orig_poster_container.getAttribute("class"));
        poster.setAttribute("class", orig_poster.getAttribute("class"));
        poster_badge.setAttribute("class", orig_poster_badge.getAttribute("class"));
        poster_link.setAttribute("class", orig_poster_link.getAttribute("class"));
        season_link.setAttribute("class", orig_season_link.getAttribute("class"));
        season_episodes.setAttribute("class", orig_season_episodes.getAttribute("class"));

        season_tile.style.position = "relative";
        season_tile.style.float = "left";
        season_tile.style.marginRight = "20px";
        season_tile.style.marginBottom = "20px";
        season_tile.style.transform = "";

        poster_link.setAttribute("href", "https://trakt.tv/shows/" + show_name + "/seasons/" + season["number"]);
        poster_link.setAttribute("target", "_blank");

        season_link.innerText = "Season " + season["number"]
        season_link.setAttribute("href", "https://trakt.tv/shows/" + show_name + "/seasons/" + season["number"]);
        season_link.setAttribute("target", "_blank");

        poster.setAttribute("style", "background-image: url(" + (season["poster"] || utils.getResourcePath("trakt/trakt_season_background.png")) + "); width: 100%; height: 100%; background-size: cover; background-position: center center; background-repeat: no-repeat;");

        season_episodes.innerText = season["episodes"].length + " episodes"

        return season_tile;
    },

    insertEpisodeTiles: function (episode_tiles) {
        var episode_tile_list = document.querySelectorAll("[class*=MetadataPosterListItem-card-]")[0].parentElement.parentElement;
        episode_tile_list.style.padding = "0 50px 20px";
        var episode_tile_list_elements = episode_tile_list.children;

        // remove episode tile list node first
        var parent_node = episode_tile_list.parentNode;
        parent_node.removeChild(episode_tile_list);

        // insert already present episodes into episode_tiles array
        for (var i = 0; i < episode_tile_list_elements.length; i++) {
            var episode_num = episode_tile_list_elements[i].querySelectorAll("[class*=MetadataPosterCardTitle-isSecondary]")[0].innerText.match(/\d+/);
            episode_tile_list_elements[i].style.position = "relative";
            episode_tile_list_elements[i].style.float = "left";
            episode_tile_list_elements[i].style.marginRight = "20px";
            episode_tile_list_elements[i].style.marginBottom = "20px";
            episode_tile_list_elements[i].style.transform = "";
            episode_tiles[episode_num] = episode_tile_list_elements[i];
        }

        // iterate over all episode tiles, present and missing, to reinsert back into episode tile list in order
        var j = 0;
        for (var episode_number in episode_tiles) {
            var episode_tile = episode_tiles[episode_number];

            episode_tile_list.insertBefore(episode_tile, episode_tile_list_elements[j]);
            j++;
        }

        // reinsert episode tile list node
        parent_node.appendChild(episode_tile_list);
    },

    insertSeasonTiles: function (season_tiles) {
        var season_tile_list = document.querySelectorAll("[class*=MetadataPosterListItem-card-]")[0].parentElement.parentElement;
        season_tile_list.style.padding = "0 50px 20px";
        var season_tile_list_elements = season_tile_list.children;

        // remove season tile list node first
        var parent_node = season_tile_list.parentNode;
        parent_node.removeChild(season_tile_list);

        // insert already present seasons into season_tiles array
        for (var i = 0; i < season_tile_list_elements.length; i++) {
            var season_num = season_tile_list_elements[i].querySelectorAll("[class*=MetadataPosterCardTitle-singleLineTitle]")[0].innerHTML.match(/\d+/);
            season_tile_list_elements[i].style.position = "relative";
            season_tile_list_elements[i].style.float = "left";
            season_tile_list_elements[i].style.marginRight = "20px";
            season_tile_list_elements[i].style.marginBottom = "20px";
            season_tile_list_elements[i].style.transform = "";
            if (season_num) {
                season_tiles[season_num] = season_tile_list_elements[i];
            }
            else {
                season_tiles["specials"] = season_tile_list_elements[i];
            }
        }

        // iterate over all season tiles, present and missing, to reinsert back into season tile list in order
        var j = 0;
        for (var season_number in season_tiles) {
            var season_tile = season_tiles[season_number];

            // Stick specials season first
            if (season_number === "specials") {
                season_tile_list.insertBefore(season_tile, season_tile_list_elements[0]);
            }
            else {
                season_tile_list.insertBefore(season_tile, season_tile_list_elements[j]);
                j++;
            }
        }

        // reinsert season tile list node
        parent_node.appendChild(season_tile_list);
    },

    insertSeasonAirdates: function (tvdb_id, season_tiles) {
        // TODO: Unused with new trakt.tv API
        Object.keys(season_tiles).forEach(function (season_number) {
            var season_tile = season_tiles[season_number];

            // skip if not missing season
            if (!season_tiles[season_number].classList.contains("missing-season")) {
                return;
            }

            trakt_api.getAllEpisodes(tvdb_id, season_number, function (all_episodes) {
                var first_episode = all_episodes[0];

                var date_text;
                if (first_episode["first_aired_utc"] === 0 || first_episode["first_aired_utc"] === null) {
                    date_text = "TBA";
                }
                else {
                    var local_utc_offset = new Date().getTimezoneOffset() * 60000;
                    var utc_air_date = first_episode["first_aired_utc"] * 1000;
                    var localized_air_date = new Date(utc_air_date - local_utc_offset);
                    date_text = localized_air_date.toDateString();
                }

                var overlay_text_element_text_node = document.createTextNode("Air Date:");
                var overlay_text_element_linebreak = document.createElement("br");
                var overlay_text_element_date_text_node = document.createTextNode(date_text);

                var overlay_text_element = season_tile.getElementsByClassName("overlay-missing-season-text")[0];
                overlay_text_element.appendChild(overlay_text_element_text_node);
                overlay_text_element.appendChild(overlay_text_element_linebreak);
                overlay_text_element.appendChild(overlay_text_element_date_text_node);
            });
        });
    },

    insertSwitch: function () {
        button_template = document.body.querySelectorAll("[class*=ActionButton-iconActionButton-]")[0];
        action_bar = document.body.querySelectorAll("[class*=PrePlayActionBar-container]")[0];
        var switch_container = document.createElement("button");

        switch_container.style.cssText = button_template.style.cssText
        switch_container.setAttribute("class", button_template.getAttribute("class"));
        switch_container.setAttribute("id", "missing-switch");
        switch_container.setAttribute("data-state", "show");
        switch_container.setAttribute("data-original-title", "Hide missing episodes/seasons");
        switch_container.addEventListener("click", missing_episodes.switchState, false);

        var glyph = document.createElement("i");
        glyph.setAttribute("class", "glyphicon eye-open");

        switch_container.appendChild(glyph);
        // insert switch before secondary actions dropdown
        action_bar.insertBefore(switch_container, document.querySelectorAll("[id*=plex-icon-toolbar-more]")[1].parentElement);


    },

    switchState: function () {
        var missing_switch = document.getElementById("missing-switch");
        var glyph = missing_switch.getElementsByTagName("i")[0];
        var state = missing_switch.getAttribute("data-state");

        var missing_episodes = document.getElementsByClassName("missing_episode_tile");
        for (var i = 0; i < missing_episodes.length; i++) {
            if (state === "show") {
                missing_episodes[i].style.display = "none";
            }
            else {
                missing_episodes[i].style.display = "block";
            }
        }

        var missing_seasons = document.getElementsByClassName("missing_season_tile");
        for (var i = 0; i < missing_seasons.length; i++) {
            if (state === "show") {
                missing_seasons[i].style.display = "none";
            }
            else {
                missing_seasons[i].style.display = "block";
            }
        }

        if (state === "show") {
            glyph.setAttribute("class", "glyphicon eye-close");
            missing_switch.setAttribute("data-state", "hide");
            missing_switch.setAttribute("data-original-title", "Show missing episodes/seasons");
        }
        else {
            glyph.setAttribute("class", "glyphicon eye-open");
            missing_switch.setAttribute("data-state", "show");
            missing_switch.setAttribute("data-original-title", "Hide missing episodes/seasons");
        }
    }
}