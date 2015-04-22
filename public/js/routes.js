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
                    return aniDataFactory.getNewAvailableAnimes(0, 12);
                },
                links: function (aniDataFactory) {
                    return aniDataFactory.getNewAddedLink(0, 12);
                },
                board: function (aniDataFactory) {
                    return aniDataFactory.getTopics("&$filter=DisplayOnBoard%20eq%20true&$orderby=AddedDate%20desc");
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
        }).when('/my-list', {
            templateUrl: 'views/my-list.html',
            controller: 'MyList'
        }).when('/player', {
            templateUrl: 'views/player.html',
            controller: 'Player'
        })
        .when('/friend-list', {
            templateUrl: 'views/friend-list.html',
            controller: 'FriendList'
        })
        .otherwise({
            redirectTo: '/login'
        });

    //Fix href unsafe link (added app to the white list)
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|app):/);
});