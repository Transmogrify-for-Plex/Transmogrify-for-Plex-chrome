Transmogrify for Plex
==============
**Transmogrify for Plex adds several features to the Plex/Web 2.0 client for Plex.**

Get it at https://chrome.google.com/webstore/detail/transmogrify-for-plex/jdogfefgaagaledbkgeffgbjlaaplpgo

Firefox version can be found at https://github.com/Moussekateer/Transmogrify-for-Plex-firefox

Features
--------------
- Adds link to view the trailer for movies within Plex/Web
- Adds link to view the letterboxd page for movies
- Adds link to view the IMDB page for movies, and displays ratings
- Adds link to view the trakt page for movies and tv shows, and displays ratings
- Adds link to view the rotten tomatoes page for movies, and displays ratings
- Adds a random tv show/movie picker
- Adds a missing seasons and episodes view
- Adds a Can I Stream It? widget for movies
- Adds a movie/tv show filter for the main dashboard
- Adds an actor profile for cast members on movie pages
- Adds a server statistics page

Version History
--------------
- **v1.1.0** - extension now tries to reach servers on local ip addresses and falls back to external address if unreachable, add loading icon, fixed bug with removing plex token script, added hover title for missing episodes/seasons switch, fixed update popup bug, added caching for plex token
- **v1.0.0** - added server stats plugin, fix server override address not being saved properly in extension options, fix plex token retrieval script being inserted multiple times into pages, tweaked options page styling, optimized extension settings retrieval code
- **v0.8.5** - rolled back changes to plex token retrieval
- **v0.8.4** - even better plex token retrieval (no longer inserts token into document), rewritten code for missing seasons/episodes plugin, fixes issue with seasons and episodes that don't start from Season/Episode 1
- **v0.8.3** - random picker button now only shows up when it's ready (needed for large libraries), use photo transcoder to generate poster images, fixes and better handling of shared servers, improved code for local/plex.tv extension usage, more reliable plex token retrieval (thanks to sam0)
- **v0.8.2** - separated API calls into separate modules, added caching for all API requests, added split_added_deck to options page, fixed rotten tomatoes button on options page not hiding correctly
- **v0.8.1** - fixed bug with extension not correctly fetching Plex token on first page load, stop missing_episodes plugin from inserting episode tiles on wrong pages
- **v0.8.0** - added actor profiles plugin, added option to only return unwatched movies in random picker plugin, automatically save changes on option page, fixed bug with unmatched agents
- **v0.7.4** - fixed split_added_deck after recent plex/web update, fix Rotten Tomatoes API sometimes not returning audience rating graphic, fix colour and position of missing_episodes switch
- **v0.7.3** - new api key for Rotten Tomatoes
- **v0.7.2** - enabled the extension for local Plex/Web
- **v0.7.1** - localized air dates for missing seasons and episodes views
- **v0.7.0** - added imdb plugin, added split_added_deck plugin, fixed bug with missing episodes view
- **v0.6.2** - added missing seasons view, added switch to show/hide missing seasons/episodes, removed unsafe innerHTML usage
- **v0.6.1** - added support for XBMCnfo agent, improved placement of Can I Stream it? widget
- **v0.6.0** - added Can I Stream it? widget to movie pages
- **v0.5.1** - extension now loads faster on plex pages, removed unnecessary code
- **v0.5.0** - added missing season episodes view, added support for manually defining server address
- **v0.4.1** - fixed bug with hardcoded server port
- **v0.4.0** - added rotten tomatoes support, added themoviedb api support (non visible for now), added update popup
- **v0.3.2** - improve youtube search api params, no longer returns non-embeddable videos
- **v0.3.1** - improve youtube search api params, return json
- **v0.3.0** - added trakt support, bundled images into extension
- **v0.2.5** - bug fix: add support for handling multiple servers/libraries
- **v0.2.4** - bug fix: stop options stylesheet being inserted into plex pages
- **v0.2.3** - added support for the tmdb agent for letterboxd links
- **v0.2.2** - added debug mode for console, improved script loop logic
- **v0.2.1** - improve handling of waiting for page to be ready
- **v0.2.0** - added options page
- **v0.1.1** - added random show/movie picker
- **v0.0.1** - initial release

![trailer and rotten tomatoes feature](http://i.imgur.com/61lCbn9.jpg)

![actor profile feature](http://i.imgur.com/zCmRb39.jpg)

![trailer feature](http://i.imgur.com/yl8sNUr.png)

![random picker feature](http://i.imgur.com/lLMw5Kk.jpg)

![missing episodes feature](http://i.imgur.com/6CKE3Bl.jpg)