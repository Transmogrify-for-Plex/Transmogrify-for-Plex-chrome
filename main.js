function getXML(xml_link) {
    var request = new XMLHttpRequest;
    request.open('GET', xml_link, false);
    request.send();

    var xml_doc = request.responseXML;
    return xml_doc;
}

function runOnReady() {
    var interval = window.setInterval(function() {
        // page is ready when container with class 'metadata-right' exists.
        // otherwise check again in 1000ms
        if (document.getElementsByClassName('metadata-right').length > 0) {
            main();
            window.clearInterval(interval);
        }
    }, 1000);
}

function main() {
    // get parent_item_id
    var page_url = document.URL
    var res = page_url.match(/metadata%2F(\d+)$/);
    var parent_item_id = res[1];

    // get server address and plex token
    var download_link = document.querySelectorAll('.download-btn')[0].getAttribute('href');
    var res2 = download_link.match(/^(.+)\/library\/.+\?X-Plex-Token=(.+)$/);
    var server_address = res2[1];
    var plex_token = res2[2];

    // construct xml link
    var xml_link = server_address + '/library/metadata/' + parent_item_id + '?X-Plex-Token=' + plex_token;

    // fetch xml
    var xml = getXML(xml_link);

    // check if movie
    if (xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0].getAttribute('type') == 'movie') {
        // create letterboxd link
        createLetterboxdLink(xml);
        // create youtube trailer button
        createTrailerButton(xml);
    }
}

// plex.tv uses a lot of JS to manipulate the DOM so the only way to tell when
// plex's JS has finished is to check for the existance of certain elements.
runOnReady();

// because plex.tv uses JS to change pages Chrome extensions don't run on every
// page load as expected. To fix this we run the script every time the window
// url hash changes.

if ("onhashchange" in window) { // event supported
    window.onhashchange = function () {
        runOnReady();
    }
}
else { // event not supported
    var storedHash = window.location.hash;
    window.setInterval(function () {
        if (window.location.hash != storedHash) {
            storedHash = window.location.hash;
            runOnReady();
        }
    }, 100);
}