var config = require("./config/main.json")
var https = require('https');
var url = require('url');
var path = require('path');
var fs = require('fs');
var pk = fs.readFileSync('./server.key');
var pc = fs.readFileSync('./server.crt');
var optss = {
    key: pk,
    cert: pc
};

var gradient = require("gradient-string");
let date_ob = new Date();
let date = ("0" + date_ob.getDate()).slice(-2);
let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
let year = date_ob.getFullYear();
let hours = date_ob.getHours();
let minutes = date_ob.getMinutes();
let seconds = date_ob.getSeconds();

function warn(text) {
    var colour = gradient('red', 'red', 'red')(`[${year}-${month}-${date} ${hours}:${minutes}:${seconds} | WARN]: `)
    console.log(colour + text)
}

function info(text) {
    var colour = gradient('cyan', 'pink', 'purple')(`[${year}-${month}-${date} ${hours}:${minutes}:${seconds}]: `)
    console.log(colour + text)
}

var blacklist = new Map();
var timeout = 100 * 10;

function add_address(address) {
    blacklist.set(address, Date.now() + timeout);
}
add_address();

var port = process.argv[2] || 443;
require('events').EventEmitter.prototype._maxListeners = 100;

var packet = `server|${config.ip}\nport|${config.port}\ntype|1\n#maint|Server is currently initializing or re-syncing with sub servers. Please try again in a minute.\nloginurl|login.reprivateserver.xyz\n\n\nbeta_server|127.0.0.1\nbeta_port|17091\nbeta_type|1\nbeta2_server|127.0.0.1\nbeta2_port|17099\nbeta2_type|1\nmeta|${Math.floor(Date.now() / 1000)}\nRTENDMARKERBS1001`;

var server = https.createServer(optss, function (req, res) {
    var parsedUrl = url.parse(req.url);
    let pathname = `.${parsedUrl.pathname}`;
    var ext = path.parse(pathname).ext;
    var ipds = ((req.headers['cf-connecting-ip'] && req.headers['cf-connecting-ip'].split(', ').length) ? req.headers['cf-connecting-ip'].split(', ')[0] : req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress).split(/::ffff:/g).filter(i => i).join('');

    var map = {
        '.ico': 'image/x-icon',
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.json': 'application/json',
        '.css': 'text/css',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.wav': 'audio/wav',
        '.mp3': 'audio/mpeg',
        '.svg': 'image/svg+xml',
        '.pdf': 'application/pdf',
        '.doc': 'application/msword'
    };

    if (req.url === "/growtopia/server_data.php") {
        res.write(packet, function (err) {
            if (err)
                warn(err);
        });
        res.end();
    } else {
        if (req.url.indexOf("/cache") !== -1) {
            info(`Connection from: ${ipds} | Downloading: ${req.url}`);
            fs.exists(pathname, function (exist) {
                if (!exist) {
                    res.statusCode = 301;
                    res.writeHead(301, {
                        Location: `https://ubistatic-a.akamaihd.net/${config.cdn}${req.url}`
                    }).end();
                    return;
                }

                fs.readFile(pathname, function (err, data) {
                    if (err) {
                        res.statusCode = 404;
                        res.end(`error from loading`);
                    } else {
                        res.setHeader('Content-type', map[ext] || 'text/plain');
                        res.end(data);
                    }
                });
            });

        } else if (req.url.indexOf("/0098") !== -1) {
            info(`Connection from: ${ipds} | Downloading:${req.url}`);

            fs.exists(pathname, function (exist) {
                if (!exist) {
                    res.statusCode = 301;
                    res.writeHead(301, {
                        Location: `https://ubistatic-a.akamaihd.net/${config.cdn}${req.url}`
                    }).end();
                    return;
                }

                fs.readFile(pathname, function (err, data) {
                    if (err) {
                        res.statusCode = 404;
                        res.end(`error`);
                    } else {
                        res.setHeader('Content-type', map[ext] || 'text/plain');
                        res.end(data);
                    }
                });
            });
        } else {
            if (!blacklist.has(ipds)) {
                add_address(ipds);
            } else {
                var not_allowed = blacklist.get(ipds);
                if (Date.now() > not_allowed) {
                    blacklist.delete(ipds);
                } else
                    blacklist.delete();
                process.env.BLACKLIST
                res.writeHead(302, "Moved Temporarily", {
                    "Server": "DaFaFlare/1.2"
                });
                res.end('Me-Night Private Server\nDaFaFlare/1.2 LTS SSL');
                res.destroy();
                req.socket.destroy();
                req.connection.destroy();
                req.connection.setMaxListeners(1);
            }
        }
    }
});
server.listen(parseInt(port), {
    backlog: 512
});


server.on("listening", function () {
    return info("Server Started\nThis Source was fixed by @LyCellioX\nyou can setting your own loginurl in index.js \nThanks");
});

info(`Server listening on port ${port}`);