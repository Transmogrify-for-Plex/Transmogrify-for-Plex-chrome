var globals = {};

chrome.runtime.onMessage.addListener(
    function(request, sender, send_response) {
        if (request.type === "set") {
            globals[request.key] = request.value;
        }
        else if (request.type === "get") {
            send_response({value: globals[request.key]});
        }
});