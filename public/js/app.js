'use strict';

var aniApp = angular.module('aniApp', ['ngRoute', 'ngResource', 'ngAnimate', 'ngSanitize', 'ui.bootstrap', 'wu.masonry', 'infinite-scroll', 'angular-data.DSCacheFactory', 'pascalprecht.translate', 'cgBusy']);

var fs = require('fs');
var gui = require('nw.gui');
var win = gui.Window.get();

//Language
aniApp.config(function ($translateProvider) {

    //Get language data files
    var en = JSON.parse(fs.readFileSync('./public/lang/locale-en.json', 'utf8'));
    var fr = JSON.parse(fs.readFileSync('./public/lang/locale-fr.json', 'utf8'));
    var es = JSON.parse(fs.readFileSync('./public/lang/locale-es.json', 'utf8'));

    //Initialize language with angular-translate
    $translateProvider.translations('en', en);
    $translateProvider.translations('fr', fr);
    $translateProvider.translations('es', es);

    //Set default language
    $translateProvider.preferredLanguage('en');

});

//Disable file drop over the application
window.addEventListener("dragover", function (e) {
    e = e || event;
    e.preventDefault();
}, false);

//Disable file drop over the application
window.addEventListener("drop", function (e) {
    e = e || event;
    e.preventDefault();
}, false);

//Disable file dragstart
window.addEventListener("dragstart", function (e) {
    e = e || event;
    e.preventDefault();
}, false);

////Angular busy (for loading)
aniApp.value('cgBusyDefaults', {
    message: 'Loading',
    backdrop: false
});

/*process.on('uncaughtException', function (error) {
    console.log(error);
});*/

//Check if user is not already logged in
//Is token empty?
//Is token valid?