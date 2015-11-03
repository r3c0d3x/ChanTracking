(function() {
'use strict';

var request = require('request');
var jsBeautify = require('js-beautify');
var prettyCss = require('PrettyCSS');
var fs = require('fs');
var htmlBeautify = require('html');
var cheerio = require('cheerio');
var FileCookieStore = require('tough-cookie-filestore');

try {
    fs.statSync('cookies.json');
} catch(e) {
    fs.writeFileSync('cookies.json', '');
}

var cookieJar = request.jar(new FileCookieStore('cookies.json'));

var state = {};

var log = function(e) {
    console.log(e);
}

var error = function(e) {
    console.error(e);
    console.trace();
}

var loadState = function() {
    try {
        var fileState = fs.readFileSync('state.json');
        if (fileState) {
            state = JSON.parse(fileState);
        }
    } catch(e) {
        error(e);
    }
}

var saveState = function() {
    fs.writeFileSync('state.json', JSON.stringify(state));
}

var get = function(url, callback) {
    log('Getting ' + url);
    request({
        url: url,
        jar: cookieJar
    }, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            log('Got ' + url);
            callback(body);
        } else {
            error('Error loading ' + url + ': ' + error);
        }
    });
}

var loadJsonAndBeautify = function(url, name) {
    get(url, function(body) {
        log('Beautifying ' + name);
        var nice = jsBeautify.js_beautify(body, { "preserve_newlines": false });

        fs.writeFileSync(name, nice);
    });
}

var loadCssAndBeautify = function(url, name) {
    get(url, function(body) {
        log('Beautifying ' + name + '.css');
        var nice = prettyCss.parse(body);

        fs.writeFileSync('css/' + name + '.css', nice);
    });
}

var loadFile = function(url, name) {
    get(url, function(body) {
        fs.writeFileSync(name, body);
    });
}

var load = function() {
    loadState();

    var now = Date.now();

    get('https://boards.4chan.org/g/', function(body) {
        var dom = cheerio.load(body);
        var sticky = dom('#t39894014');
        var stickyHtml = sticky.html();
        // Force 0
        stickyHtml = stickyHtml.replace(/\d.t.4cdn.org/gi, '0.t.4cdn.org');
        fs.writeFileSync('html/post.html', htmlBeautify.prettyPrint(stickyHtml));

        var newThread = dom('form[name=post]');
        fs.writeFileSync('html/form_thread.html', htmlBeautify.prettyPrint(newThread.html()));

        var globalMessage = dom('div.globalMessage').html();
        fs.writeFileSync('html/global_message.html', globalMessage === null ? 'No global message' : htmlBeautify.prettyPrint(globalMessage));
    });

    loadJsonAndBeautify('https://a.4cdn.org/boards.json', 'api/boards.json');

    get('https://www.4chan.org/', function(body) {
        body = body.replace(/<script type="text\/javascript">\n.+PostList[\s\S]+?<\/script>/gi, 'PostList script snip');
        body = body.replace(/<h2>Recent Images[\s\S]+?<\/ul>/gi, 'Recent Images snip');
        body = body.replace(/<h2>Latest Posts[\s\S]+?<\/ul>/gi, 'Latest Posts snip');
        body = body.replace(/<h2>Popular Threads[\s\S]+?<\/ul>/gi, 'Popular Threads snip');
        body = body.replace(/<li>Total Posts:.+?<\/li>/gi, 'Total Posts snip');
        body = body.replace(/<li>Current Users:.+?<\/li>/gi, 'Current Users snip');
        body = body.replace(/<li>Active Content:.+?<\/li>/gi, 'Active Content snip');

        fs.writeFileSync('pages/home.html', body);
    });

    loadFile('https://www.4chan.org/faq', 'pages/faq.html');
    loadFile('https://www.4chan.org/rules', 'pages/rules.html');
    loadFile('https://www.4chan.org/news', 'pages/news.html');
    loadFile('https://www.4chan.org/blotter', 'pages/blotter.html');
    loadFile('https://www.4chan.org/legal', 'pages/legal.html');
    loadFile('https://www.4chan.org/security', 'pages/security.html');
    loadFile('https://www.4chan.org/feedback', 'pages/feedback.html');

    loadFile('https://s.4cdn.org/js/core.' + now + '.js', 'javascripts/core.js');
    loadFile('https://s.4cdn.org/js/extension.' + now + '.js', 'javascripts/extension.js');

    loadCssAndBeautify('https://s.4cdn.org/css/yotsubluenew.' + now + '.css', 'yotsubluenew');
    loadCssAndBeautify('https://s.4cdn.org/css/yotsubanew.' + now + '.css', 'yotsubanew');
    loadCssAndBeautify('https://s.4cdn.org/css/futabanew.' + now + '.css', 'futubanew');
    loadCssAndBeautify('https://s.4cdn.org/css/burichannew.' + now + '.css', 'burichannew');
    loadCssAndBeautify('https://s.4cdn.org/css/photon.' + now + '.css', 'photon');
    loadCssAndBeautify('https://s.4cdn.org/css/tomorrow.' + now + '.css', 'tomorrow');
    loadCssAndBeautify('https://s.4cdn.org/css/yotsubluemobile.' + now + '.css', 'yotsubluemobile');
    loadCssAndBeautify('https://s.4cdn.org/css/yui.' + now + '.css', 'yui');
    loadCssAndBeautify('https://s.4cdn.org/css/janichan.' + now + '.css', 'janichan');
    loadCssAndBeautify('https://s.4cdn.org/css/global.' + now + '.css', 'global');
    loadCssAndBeautify('https://s.4cdn.org/css/spooky.' + now + '.css', 'spooky');
}

load();

})();
