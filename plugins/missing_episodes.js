missing_episodes = {
    server: null,

    init: function(metadata_xml, server) {
        missing_episodes.server = server;

        var directory_metadata = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0];
        var show_id = directory_metadata.getAttribute("ratingKey");
        var agent = directory_metadata.getAttribute("guid");
        var season_num = directory_metadata.getAttribute("index");

        var tvdb_id;
        if (/com\.plexapp\.agents\.thetvdb/.test(agent)) {
            tvdb_id = agent.match(/^com\.plexapp\.agents\.thetvdb:\/\/(\d+)\//)[1];
            debug("missing_episodes plugin: tvdb id found - " + tvdb_id);
        }
        else {
            debug("missing_episodes plugin: Agent is not tvdb. Aborting");
            return;
        }

        debug("missing_episodes plugin: Finding all present and all existing episodes");
        var present_episodes = missing_episodes.getPresentEpisodes(show_id);
        var all_episodes = missing_episodes.getAllEpisodes(tvdb_id, season_num);

        var tiles_to_insert = {};
        for (var i = 0; i < all_episodes.length; i++) {
            var episode = all_episodes[i];
            if (present_episodes.indexOf(episode["episode"]) === -1) {
                var episode_tile = missing_episodes.createEpisodeTile(episode);
                tiles_to_insert[episode["number"]] = episode_tile;
            }
        }
        missing_episodes.insertEpisodeTiles(tiles_to_insert);
    },

    getPresentEpisodes: function(show_id) {
        debug("missing_episodes plugin: Fetching season episodes xml");
        var episodes_metadata_xml_url = "http://" + missing_episodes.server["address"] + ":" + missing_episodes.server["port"] + "/library/metadata/" + show_id + "/children?X-Plex-Token=" + missing_episodes.server["access_token"];
        var episodes_metadata_xml = utils.getXML(episodes_metadata_xml_url, false);

        var episodes_xml = episodes_metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video");
        var episodes = [];
        for (var i = 0; i < episodes_xml.length; i++) {
            episodes.push(parseInt(episodes_xml[i].getAttribute("index")));
        }

        return episodes;
    },

    getAllEpisodes: function(tvdb_id, season_num) {
        debug("missing_episodes plugin: Reading API key");
        var api_key = utils.readFile(chrome.extension.getURL("resources/api_keys/trakt_api_key.txt"));
        debug("missing_episodes plugin: Successfully read API key");

        var api_url = "http://api.trakt.tv/show/season.json/" + api_key + "/" + tvdb_id + "/" + season_num;
        var trakt_json = utils.getJSON(api_url, false);

        return trakt_json;
    },

    createEpisodeTile: function(episode) {
        var episode_tile_list = document.getElementsByClassName("episode-tile-list")[0];

        var episode_tile = document.createElement("li");
        episode_tile.setAttribute("class", "poster-item media-tile-list-item episode");

        var episode_tile_link = document.createElement("a");
        episode_tile_link.setAttribute("class", "media-poster-container");
        episode_tile_link.setAttribute("href", episode["url"]);
        episode_tile_link.setAttribute("target", "_blank");

        var episode_tile_poster = document.createElement("div");
        episode_tile_poster.setAttribute("class", "media-poster");
        episode_tile_poster.setAttribute("style", "background-image: url(" + episode["screen"] + ");");

        var episode_tile_overlay = document.createElement("div");
        episode_tile_overlay.setAttribute("class", "media-poster-overlay-missing-episode");

        var episode_title_overlay_text = document.createElement("div");
        episode_title_overlay_text.setAttribute("class", "overlay-missing-episode-text");
        var date_text;
        if (episode["first_aired"] === 0) {
            date_text = "TBA";
        }
        else {
            var d = new Date(episode["first_aired"] * 1000);
            date_text = d.toDateString();
            debug("missing_episodes plugin: Episode air date - " + d);
        }
        episode_title_overlay_text.innerHTML = "Air Date: " + date_text;

        var episode_tile_title = document.createElement("div");
        episode_tile_title.setAttribute("class", "media-title media-heading");
        episode_tile_title.innerHTML = episode["title"];

        var episode_tile_number = document.createElement("div");
        episode_tile_number.setAttribute("class", "media-subtitle media-heading secondary");
        episode_tile_number.innerHTML = "Episode " + episode["number"];

        episode_tile.appendChild(episode_tile_link);
        episode_tile_link.appendChild(episode_tile_poster);
        episode_tile_link.appendChild(episode_tile_title);
        episode_tile_link.appendChild(episode_tile_number);
        episode_tile_poster.appendChild(episode_tile_overlay);
        episode_tile_overlay.appendChild(episode_title_overlay_text);

        return episode_tile;
    },

    insertEpisodeTiles: function(episode_tiles) {
        var episode_tile_list = document.getElementsByClassName("episode-tile-list")[0];
        var episode_tile_list_elements = episode_tile_list.getElementsByTagName("li");

        // remove episode tile list node first
        var parent_node = episode_tile_list.parentNode;
        parent_node.removeChild(episode_tile_list);

        for (var episode_number in episode_tiles) {
            var episode_tile = episode_tiles[episode_number];
            episode_number = parseInt(episode_number);
            if (episode_number === 1) {
                // insert into beginning of tile list
                episode_tile_list.insertBefore(episode_tile, episode_tile_list_elements[0]);
            }
            else {
                // insert after last episode tile
                episode_tile_list.insertBefore(episode_tile, episode_tile_list_elements[episode_number-2].nextSibling);
            }
        }

        // reinsert episode tile list node
        parent_node.appendChild(episode_tile_list);
    }
}