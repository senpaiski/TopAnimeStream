aniApp.factory('settings', function ($translate) {
    var fs = require('fs');
    var path = './settings.json';
    var settings = {};

    settings.defaults = {
        defaultLanguage: 'en',
        useSecureConnection: false,
        languageMatch: false
    }

    if (fs.existsSync(path)) {
        settings.data = JSON.parse(fs.readFileSync(path));
    } else {
        fs.writeFileSync(path, JSON.stringify(settings.defaults, null, "\t"));
        settings.data = settings.defaults;
    }
    
    settings.switchLanguage = function (lang) {
        $translate.use(lang);
        settings.data.defaultLanguage = lang;
    }

    settings.save = function () {
        fs.writeFileSync(path, JSON.stringify(settings.data, null, "\t"));
    }

    console.log(settings);
    return settings;
});