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

var system = require('system');

var page = require('webpage').create();

var json = base64.decode(system.args[1]);

var parameter = JSON.parse(json);

if (!parameter.wait) {
    parameter.wait = 200;
}

if (parameter.viewportSize) {
    page.viewportSize = parameter.viewportSize;
}

if (parameter.paperSize) {
    page.paperSize = parameter.paperSize;
}

if (parameter.zoomFactor) {
    page.zoomFactor = parameter.zoomFactor;
}

if (parameter.clipRect) {
    page.clipRect = parameter.clipRect;
}

var resources = [];

page.onResourceRequested = function (request) {
    resources[request.id] = request.stage;
};

page.onResourceReceived = function (response) {
    resources[response.id] = response.stage;
};
/*
page.onInitialized = function () {
    window.setTimeout(function () {
        page.render(parameter.handle);

        phantom.exit(1);
    }, parameter.wait);
};
*/

if (parameter.content) {
    page.content = parameter.content;
}

if (parameter.url) {
    page.open(parameter.url, function (status) {
        if (status !== 'success') {
            system.stderr.write('unable to load url ' + parameter.url);

            phantom.exit(1);

            return;
        } else {
            window.setTimeout(function () {
                page.render(parameter.handle);
                phantom.exit();
            }, parameter.wait); 
        }
    });
}
