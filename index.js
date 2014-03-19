/*--------------------------------------------------------------------------

﻿The MIT License (MIT)

Copyright (c) 2013 Haydn Paterson (sinclair) <haydn.developer@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

--------------------------------------------------------------------------*/

﻿var paths;
(function (paths) {
    paths.temp_directory = __dirname + '/temp/';
})(paths || (paths = {}));
var base64;
(function (base64) {
    var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

    function encode(input) {
        var output = "";

        var chr1 = 0;

        var chr2 = 0;

        var chr3 = 0;

        var enc1 = 0;

        var enc2 = 0;

        var enc3 = 0;

        var enc4 = 0;

        var i = 0;

        input = utf8_encode(input);

        while (i < input.length) {
            chr1 = input.charCodeAt(i++);

            chr2 = input.charCodeAt(i++);

            chr3 = input.charCodeAt(i++);

            enc1 = chr1 >> 2;

            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);

            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);

            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }

            output = output + characters.charAt(enc1) + characters.charAt(enc2) + characters.charAt(enc3) + characters.charAt(enc4);
        }

        return output;
    }
    base64.encode = encode;

    function decode(input) {
        var output = "";

        var chr1 = 0;

        var chr2 = 0;

        var chr3 = 0;

        var enc1 = 0;

        var enc2 = 0;

        var enc3 = 0;

        var enc4 = 0;

        var i = 0;

        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

        while (i < input.length) {
            enc1 = characters.indexOf(input.charAt(i++));

            enc2 = characters.indexOf(input.charAt(i++));

            enc3 = characters.indexOf(input.charAt(i++));

            enc4 = characters.indexOf(input.charAt(i++));

            chr1 = (enc1 << 2) | (enc2 >> 4);

            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);

            chr3 = ((enc3 & 3) << 6) | enc4;

            output = output + String.fromCharCode(chr1);

            if (enc3 != 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 != 64) {
                output = output + String.fromCharCode(chr3);
            }
        }

        output = utf8_decode(output);

        return output;
    }
    base64.decode = decode;

    function utf8_encode(input) {
        input = input.replace(/\r\n/g, "\n");

        var output = "";

        for (var n = 0; n < input.length; n++) {
            var c = input.charCodeAt(n);

            if (c < 128) {
                output += String.fromCharCode(c);
            } else if ((c > 127) && (c < 2048)) {
                output += String.fromCharCode((c >> 6) | 192);

                output += String.fromCharCode((c & 63) | 128);
            } else {
                output += String.fromCharCode((c >> 12) | 224);

                output += String.fromCharCode(((c >> 6) & 63) | 128);

                output += String.fromCharCode((c & 63) | 128);
            }
        }

        return output;
    }

    function utf8_decode(input) {
        var output = "";

        var i = 0;

        var c = 0;

        var c1 = 0;

        var c2 = 0;

        var c3 = 0;

        while (i < input.length) {
            c = input.charCodeAt(i);

            if (c < 128) {
                output += String.fromCharCode(c);

                i++;
            } else if ((c > 191) && (c < 224)) {
                c2 = input.charCodeAt(i + 1);

                output += String.fromCharCode(((c & 31) << 6) | (c2 & 63));

                i += 2;
            } else {
                c2 = input.charCodeAt(i + 1);

                c3 = input.charCodeAt(i + 2);

                output += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));

                i += 3;
            }
        }

        return output;
    }
})(base64 || (base64 = {}));

var Server = (function () {
    function Server(port, options) {
        var _this = this;
        this.port = port;
        this.options = options;
        this.prepare_server_options();

        this.prepare_temp_directory();

        this.server = require('http').createServer(function (request, response) {
            if (request.url == '/') {
                if (request.method.toLowerCase() == "post") {
                    _this.handler(request, response);

                    return;
                }
            }

            _this.error_handler(403, ['invalid request'], response);
        });

        this.server.listen(this.port);
    }
    Server.prototype.error_handler = function (statusCode, errors, response) {
        var json = JSON.stringify(errors, null, 4);

        response.writeHead(statusCode, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(json) });

        response.write(json);

        response.end();
    };

    Server.prototype.handler = function (request, response) {
        var _this = this;
        this.json(request, function (errors, parameter) {
            if (errors) {
                _this.error_handler(403, errors, response);

                return;
            }

            _this.validate(parameter, function (errors) {
                if (errors) {
                    _this.error_handler(403, errors, response);

                    return;
                }

                parameter.handle = paths.temp_directory + _this.create_file_handle(parameter.mime);

                _this.render(parameter, function (errors) {
                    if (errors) {
                        _this.error_handler(500, errors, response);

                        return;
                    }

                    require('fs').stat(parameter.handle, function (error, stat) {
                        if (error) {
                            _this.error_handler(500, ['phantomjs failed to render'], response);

                            return;
                        }

                        response.writeHead(200, { 'Content-Type': parameter.mime, 'Content-Length': stat.size });

                        var readstream = require('fs').createReadStream(parameter.handle);

                        readstream.pipe(response);

                        readstream.on('end', function () {
                            require('fs').unlink(parameter.handle, function (errors) {
                                response.end();
                            });
                        });
                    });
                });
            });
        });
    };

    Server.prototype.json = function (request, callback) {
        var buffer = [];

        request.setEncoding('utf8');

        request.on('data', function (data) {
            buffer.push(data);
        });

        request.on('end', function () {
            try  {
                var obj = JSON.parse(buffer.join(''));

                callback(null, obj);
            } catch (e) {
                callback([e.toString()], null);
            }
        });
    };

    Server.prototype.validate = function (parameter, callback) {
        if (!parameter) {
            callback(['parameter is null.']);

            return;
        }

        var errors = [];

        if (!parameter.url && !parameter.content) {
            errors.push('url or content is required.');
        }

        if (parameter.url && parameter.content) {
            errors.push('cannot supply both url and content in the same request.');
        }

        if (!parameter.mime) {
            errors.push('mime is required.');
        }

        if (parameter.wait) {
            if ((typeof parameter.wait === "number") && Math.floor(parameter.wait) === parameter.wait) {
                if (parameter.wait > this.options.maximum_wait) {
                    errors.push('wait exceeds maximum allowed wait time. maximum is ' + this.options.maximum_wait.toString() + '.');
                }

                if (parameter.wait < 0) {
                    errors.push('wait cannot be a negative value.');
                }
            } else {
                errors.push('wait is not a integer value.');
            }
        }

        if (parameter.mime) {
            switch (parameter.mime) {
                case 'application/pdf':
                    break;

                case 'image/jpeg':
                    break;

                case 'image/jpg':
                    break;

                case 'image/png':
                    break;

                case 'image/gif':
                    break;

                default:
                    errors.push('output mime is invalid.');

                    break;
            }
        }

        if (errors.length > 0) {
            callback(errors);

            return;
        }

        callback(null);
    };

    Server.prototype.render = function (parameter, callback) {
        console.log("twice???");
        var haserror = false;

        var json = JSON.stringify(parameter);

        var child = require("child_process").spawn('phantomjs', [(__dirname + '/render.js'), base64.encode(json)], {});

        child.stdout.setEncoding('utf8');

        child.stdout.on('data', function (data) {
            console.log(data);
        });

        child.stderr.setEncoding('utf8');

        child.stderr.on('data', function (data) {
            console.error('[error]', data);
            //haserror = true;

            //callback([data]);
        });

        child.on('close', function () {
            if (!haserror) {
                callback(null);
            }
        });

        child.on('error', function () {
            callback(['phantomjs not installed or not configured in PATH.']);
        });
    };

    Server.prototype.create_file_handle = function (mime) {
        var extension = '.jpg';

        switch (mime) {
            case 'application/pdf':
                extension = '.pdf';
                break;

            case 'image/png':
                extension = '.png';
                break;

            case 'image/jpg':
                extension = '.jpg';
                break;

            case 'image/jpeg':
                extension = '.jpg';
                break;

            case 'image/gif':
                extension = '.gif';
                break;
        }

        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);

            return v.toString(16);
        }) + extension;
    };

    Server.prototype.prepare_temp_directory = function () {
        var exists = require('fs').existsSync(paths.temp_directory);

        if (exists) {
            var filenames = require('fs').readdirSync(paths.temp_directory);

            for (var i = 0; i < filenames.length; i++) {
                require('fs').unlinkSync(paths.temp_directory + filenames[i]);
            }
        } else {
            require('fs').mkdirSync(paths.temp_directory);
        }
    };

    Server.prototype.prepare_server_options = function () {
        this.options = this.options || {};

        if (!this.options.maximum_wait) {
            this.options.maximum_wait = 4000;
        }
    };
    return Server;
})();
var Client = (function () {
    function Client(host) {
        this.host = host;
    }
    Client.prototype.render = function (parameter, callback) {
        var _this = this;
        var endpoint = require('url').parse(this.host);

        var json = JSON.stringify(parameter);

        var options = {
            host: endpoint.hostname,
            port: endpoint.port,
            path: endpoint.path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(json)
            }
        };

         console.log("request twice??")
        var request = require('http').request(options, function (response) {
            if (response.statusCode != 200) {
                var buffer = [];

                response.setEncoding('utf8');

                response.on('data', function (data) {
                    buffer.push(data);
                });

                response.on('end', function () {
                    var json = buffer.join('');

                    callback(JSON.parse(json), null);
                });

                return;
            }

            callback(null, response);
        });

        request.on('error', function () {
            callback(['error: cannot talk to phantom.net server at ' + _this.host], null);
        });

        request.write(json);

        request.end();
    };
    return Client;
})();
module.exports.Server = Server;

module.exports.Client = Client;
