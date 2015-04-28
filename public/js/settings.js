aniApp.factory('settings', function ($translate) {
    var fs = require('fs');
    var path = './settings.json';
    var settings = {};

    settings.defaults = {
        applicationLanguage: 'en',
        preferredVideoQuality: 1080,
        preferredAudioLanguage: 'en',
        preferredSubtitleLanguage: 'en'
    }

    if (fs.existsSync(path)) {
        settings.data = JSON.parse(fs.readFileSync(path));
    } else {
        fs.writeFileSync(path, JSON.stringify(settings.defaults, null, "\t"));
        settings.data = settings.defaults;
    }
    
    settings.changeVideoQuality = function (quality) {
        settings.data.preferredVideoQuality = quality;
    }
        
    settings.changeSubtitleLanguage = function (lang) {
        settings.data.preferredSubtitleLanguage = lang;
    }
    
    settings.changeAudioLanguage = function (lang) {
        settings.data.preferredAudioLanguage = lang;
    }
    
    settings.switchLanguage = function (lang) {
        $translate.use(lang);
        settings.data.applicationLanguage = lang;
    }

    settings.save = function () {
        fs.writeFileSync(path, JSON.stringify(settings.data, null, "\t"));
    }

    return settings;
});