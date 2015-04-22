'use strict';

var aniApp = angular.module('aniApp', ['ngRoute', 'ngResource', 'ngAnimate', 'ngSanitize', 'ui.bootstrap', 'wu.masonry', 'infinite-scroll', 'angular-data.DSCacheFactory', 'pascalprecht.translate', 'angularMoment', 'hc.marked']);

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
    //Set default language
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

//Angular busy (for loading)
aniApp.value('cgBusyDefaults', {
    message: 'Loading',
    backdrop: false
});

//Developer shorcuts
window.addEventListener("keyup", function (e) {
    //Crtl + F12 = showDevTools
    if (e.ctrlKey && e.keyCode == 123) {
        win.showDevTools();
    }

    //Crtl + F5 = reload
    if (e.ctrlKey && e.keyCode == 116) {
        win.reload();
    }
}, false);

//Fix carousel animation
aniApp.directive('disableAnimation', function ($animate) {
    return {
        restrict: 'A',
        link: function ($scope, $element, $attrs) {
            $attrs.$observe('disableAnimation', function (value) {
                $animate.enabled(!value, $element);
            });
        }
    }
});

//Scrolling down directive (Infinite Scroll)
aniApp.directive('whenScrolledDown', function () {
    return function (scope, elm, attr) {
        var raw = elm[0];
        var offset = 300;
        elm.bind('scroll', function () {
            if (raw.scrollTop + raw.offsetHeight >= (raw.scrollHeight - offset)) {
                scope.$apply(attr.whenScrolledDown);
            }
        });
    };
});

//Scrolling top directive (Infinite Scroll)
aniApp.directive('whenScrolledTop', function () {
    return function (scope, elm, attr) {
        var raw = elm[0];
        var offset = 300;
        elm.bind('scroll', function () {
            if (raw.scrollTop <= offset) {
                scope.$apply(attr.whenScrolledTop);
            }
        });
    };
});

//Show refrech when changing route (page)
aniApp.directive('showDuringResolve', function ($rootScope) {

    return {
        link: function (scope, element) {
              
            $rootScope.$on('$routeChangeStart', function () {
                 console.log("change start");
                element.removeClass('ng-hide');
            });

            $rootScope.$on('$viewContentLoaded', function () {
                console.log("Loaded");
                element.addClass('ng-hide');
            });

        }
    };
});

process.on('uncaughtException', function (error) {
    console.log(error);
});

//Check if user is not already logged in
//Is token empty?
//Is token valid?