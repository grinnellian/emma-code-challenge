var Hapi = require("hapi");
var urlValidator = require("./lib/url-validator.js");

var server = new Hapi.Server();
server.connection({ port: 3000, host: 'localhost' });

server.route({
    method: 'GET',
    path: '/validateUrls',
    handler: function (request, reply) {
        // This is very quick and dirty, so not doing any input validation at this time.
        if (request.query.urls) {
            urlValidator.validateUrlList(JSON.parse(request.query.urls), function(err, badUrls) {
                if (err) {
                    reply(JSON.stringify(err));
                } else {
                    reply(JSON.stringify(badUrls));
                }
            });

        } else {
            reply("Try adding a urls paramater like ?urls=%5B\"http%3A%2F%2Fwww.google.com\"%5D");
        }
    }
});

server.start((err) => {
    if (err) {
        throw err;
    }
    console.log(`Server running at: ${server.info.uri}`);
});
