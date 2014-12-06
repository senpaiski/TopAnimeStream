'use strict';

aniApp.config(function ($routeProvider, $compileProvider) {
    $routeProvider
        .when('/login', {
            templateUrl: 'views/login.html',
            controller: 'Login'
        })
        .when('/home', {
            templateUrl: 'views/home.html',
            controller: 'Home',
            resolve: {
                animes: function (aniDataFactory) {
                    return aniDataFactory.getAnimes(0, 12, 'all');
                }
            }
        })
        .when('/list', {
            templateUrl: 'views/list.html',
            controller: 'List'
        })
        .when('/detail/:animeId', {
            templateUrl: 'views/detail.html',
            controller: 'Detail',
            resolve: {
                detail: function (aniDataFactory, $route) {
                    return aniDataFactory.getAnimeDetail($route.current.params.animeId);
                }
            }
        })
        .when('/full-list', {
            templateUrl: 'views/full-list.html',
            controller: 'FullList'
        })
        .when('/settings', {
            templateUrl: 'views/settings.html',
            controller: 'Settings'
        })
        .when('/uploads', {
            templateUrl: 'views/uploads.html',
            controller: 'Uploads'
        })
        .otherwise({
            redirectTo: '/login'
        });

    //Fix href unsafe link (added app to the white list)
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|app):/);
});