'use strict';

aniApp.config(['$httpProvider',
    function ($httpProvider) {
        $httpProvider.interceptors.push(function ($q, $location, $rootScope) {
            return {
                'request': function (config) {
                    if (sessionStorage.token) {
                        config.headers['Authentication'] = sessionStorage.token;
                    }
                    return config;
                },
                'response': function (response) {
                    //Will only be called for HTTP up to 300
                    return response;
                },
                'responseError': function (rejection) {
                    if (rejection.status === 401) {
                        $rootScope.$broadcast('userLoggedOut', null);
                        $location.path("/login");
                    }
                    return $q.reject(rejection);
                }
            };
        });
}]);

aniApp.factory('account', function ($q, aniFactory, aniDataFactory) {
    var account = {};

    account.login = function (username, password) {
        var deferred = $q.defer();
        aniFactory.login(username, password).then(function (token) {
            sessionStorage.token = token;
            sessionStorage.username = username;

            aniDataFactory.getUserInfo(username)
                .success(function (data) {
                    sessionStorage.user = JSON.stringify(data.value[0]);
                    console.log(sessionStorage.user);
                    deferred.resolve();
                })
                .error(function (error) {
                    deferred.reject(error);
                });

        }, function (error) {
            deferred.reject(error);
        });

        return deferred.promise;
    }

    account.logout = function () {
        return aniFactory.logout().then(function () {
            account.clear();
        })
    }

    account.clear = function () {
        sessionStorage.clear();
    }

    account.getToken = function () {
        return sessionStorage.token;
    }

    account.getUsername = function () {
        return sessionStorage.username;
    }

    account.getUser = function () {
        if (sessionStorage.user) {
            return JSON.parse(sessionStorage.user);
        } else
            return null;
    }

    account.isConnected = function () {
        if (sessionStorage.token)
            return true;

        return false;
    }

    return account;
});

//AnimeDataService API
aniApp.factory('aniDataFactory', function ($http, $sce, $cacheFactory, $q, DSCacheFactory) {
    var baseUrl = 'http://www.topanimestream.com/AnimeServices/AnimeDataService.svc',
        //var baseUrl = 'http://localhost:3772/AnimeDataService.svc',
        dataFactory = {};

    //Prepare caching for better user experience
    DSCacheFactory('dataCache', {
        maxAge: 900000, // Items added to this cache expire after 15 minutes.
        cacheFlushInterval: 6000000, // This cache will clear itself every hour.
        deleteOnExpire: 'aggressive', // Items will be deleted from this cache right when they expire.
        storageMode: 'memory' // [default: memory] sessionStorage, localStorage
    });

    dataFactory.checkForInternetConnection = function (callback) {
        $http.get('http://www.google.com/').success(function (data) {
            callback(true);
        }).error(function (e) {
            callback(false);
        });
    }

    dataFactory.isServiceOnline = function (callback) {
        $http.get(baseUrl).success(function (data) {
            callback(true);
        })
            .error(function (data, status) {
                if (status == 401)
                    callback(true);
                else
                    callback(false);
            });
    }

    /*    dataFactory.setToken = function (token) {
        $http.defaults.headers.common.Authentication = token;
    }*/

    dataFactory.getMP4 = function (embed) {
        //Get provider name with embed domain link
        var list = new URL(embed).hostname.split('.');
        var hostname = list[list.length - 2];
        var deferred = $q.defer();

        //Download page from the embed link
        $http.get(embed).success(function (data) {
            //Extract mp4 with the service
            $http.post(baseUrl + '/GetMp4Url?provider=%27' + hostname + '%27', window.btoa(data))
                .success(function (d) {
                    deferred.resolve(d);
                })
                .error(function (error) {
                    console.log(error);
                    deferred.reject();
                });
        });

        return deferred.promise;
    }

    dataFactory.getAnimes = function (skip, top, type) {
        var filter,
            deferred = $q.defer(),
            dataCache = DSCacheFactory.get('dataCache');

        switch (type) {
        case 'movie':
            filter = '&$filter=IsMovie%20eq%20true';
            break;
        case 'serie':
            filter = '&$filter=IsMovie%20eq%20false';
            break;
        case 'all':
            filter = '';
            break;
        }

        var start = new Date().getTime();

        //var query = baseUrl + '/Animes?$expand=AnimeInformations&$format=json&$inlinecount=allpages&$skip=' + skip + '&$top=' + top + '&$orderby=Rating%20desc&$filter=AnimeSources/any(as:as/vks/any(vk:vk/Id%20gt%200))' + filter;

        //Will just use the standard providers
        var query = baseUrl + '/Animes?$expand=AnimeInformations&$format=json&$inlinecount=allpages&$skip=' + skip + '&$top=' + top + '&$orderby=Rating%20desc' + filter;

        if (dataCache.get(query)) {
            console.log('from cache');
            deferred.resolve(dataCache.get(query));
        } else {
            //Only animes with vk available
            $http.get(query)
                .success(function (data) {
                    dataCache.put(query, data);
                    deferred.resolve(data);
                }).error(function (error) {
                    console.log(error);
                    deferred.reject();
                });
        }

        return deferred.promise;
    }

    dataFactory.getAnimeDetail = function (animeId) {
        var promise = $http.get(baseUrl + '/Animes(' + animeId + ')?$format=json&$expand=AnimeSources/Mirrors,Episodes/Mirrors,AnimeInformations,Genres,Themes')
            .success(function (data) {
                return data;
            })
            .error(function (error) {
                console.log(error);
            });

        return promise;
    }

    dataFactory.getUserInfo = function (username) {
        return $http.get(baseUrl + '/Accounts?$filter=Username%20eq%20%27' + username + '%27');
    }

    dataFactory.getEpisodes = function (animeId) {
        return $http.get(baseUrl + '/Episodes()?$filter=AnimeId%20eq%20' + animeId + '%20and%20Mirrors/any(m:m/AnimeSource/LanguageId%20eq%20' + 1 + ')&$expand=Mirrors/AnimeSource,Mirrors/Provider,EpisodeInformations&$format=json');
    }

    dataFactory.getFullList = function (skip, top) {
        var deferred = $q.defer(),
            dataCache = DSCacheFactory.get('dataCache');

        var query = baseUrl + '/Animes?$format=json&$select=OriginalName,AnimeId&$orderby=OriginalName';

        if (dataCache.get(query)) {
            console.log('from cache');
            deferred.resolve(dataCache.get(query));
        } else {
            $http.get(query).success(function (data) {
                dataCache.put(query, data);
                deferred.resolve(data);
            }).error(function (error) {
                console.log(error);
                deferred.reject();
            });
        }

        return deferred.promise;
    }

    dataFactory.getAnimeSources = function (animeId) {
        return $http.get(baseUrl + '/AnimeSources()?$format=json&$filter=AnimeId eq ' + animeId + '&$expand=Language');
    }

    dataFactory.getAvailableEpisodes = function (animeSourceId, skip, top) {
        var deferred = $q.defer(),
            dataCache = DSCacheFactory.get('dataCache');

        var query = baseUrl + '/Episodes()?$format=json&$filter=Mirrors/any(m:m/AnimeSource/AnimeSourceId%20eq%20' + animeSourceId + ')&$expand=Mirrors/AnimeSource/Language,EpisodeInformations,Mirrors/Provider&$orderby=Order&$inlinecount=allpages';

        if (dataCache.get(query)) {
            console.log('from cache');
            deferred.resolve(dataCache.get(query));
        } else {
            $http.get(query).success(function (data) {
                dataCache.put(query, data);
                deferred.resolve(data);
            }).error(function (error) {
                console.log(error);
                deferred.reject();
            });
        }

        return deferred.promise;
    }

    dataFactory.getMirrors = function (animeSourceId) {
        var deferred = $q.defer(),
            dataCache = DSCacheFactory.get('dataCache');

        var query = baseUrl + '/Mirrors()?$format=json&$filter=AnimeSource/AnimeSourceId%20eq%20' + animeSourceId + '&$expand=AnimeSource/Language,Provider';

        if (dataCache.get(query)) {
            console.log('from cache');
            deferred.resolve(dataCache.get(query));
        } else {
            $http.get(query).success(function (data) {
                dataCache.put(query, data);
                deferred.resolve(data);
            }).error(function (error) {
                console.log(error);
                deferred.reject();
            });
        }

        return deferred.promise;
    }

    dataFactory.searchAnimes = function (query, skip, top) {
        var deferred = $q.defer(),
            dataCache = DSCacheFactory.get('dataCache');

        var query = baseUrl + '/Search?query=\'' + query + '\'&$format=json';
        console.log(query);
        if (dataCache.get(query)) {
            console.log('from cache');
            deferred.resolve(dataCache.get(query));
        } else {
            $http.get(query).success(function (data) {
                dataCache.put(query, data);
                deferred.resolve(data);
            }).error(function (error) {
                console.log(error);
                deferred.reject();
            });
        }

        return deferred.promise;
    }

    dataFactory.getLatestUploads = function (skip, top) {
        //return $http.get(baseUrl + '/vks?$format=json&$orderby=AddedDate%20desc&$expand=AnimeSource/Anime,Episode&$skip=' + skip + '&$top=' + top);

        return $http.get(baseUrl + '/Mirrors?$format=json&$orderby=AddedDate%20desc&$expand=AnimeSource/Anime,Episodes&$skip=' + skip + '&$top=' + top);
    }

    return dataFactory;
});

//AnimeService API - WCF
aniApp.factory('aniFactory', function ($http, $translate, $q) {
    //Initializing properties
    var parseString = require('xml2js').parseString;
    var BasicHttpBinding = require('wcf.js').BasicHttpBinding,
        Proxy = require('wcf.js').Proxy;

    var baseUrl = 'http://www.topanimestream.com/AnimeServices/AnimeService.svc',
        //var baseUrl = 'http://localhost:3772/AnimeService.svc',
        baseInterface = 'http://tempuri.org/IAnimeService',
        envelope = '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Header><Lang>{0}</Lang></s:Header><s:Body>{1}</s:Body></s:Envelope>',
        binding = new BasicHttpBinding({
            SecurityMode: "None"
        }),
        proxy = new Proxy(binding, baseUrl),
        wcfFactory = {};

    //WCF Helper functions
    function getFaultString(error) {
        if (error['s:Envelope']) {
            return error['s:Envelope']['s:Body'][0]['s:Fault'][0]['faultstring'][0]['_'];
        }

        return "";
    }

    function getValue(result, tag) {
        if (result['s:Envelope']) {
            return result['s:Envelope']['s:Body'][0][tag + 'Response'][0][tag + 'Result'];
        }

        return "";
    }

    //Login 
    wcfFactory.login = function (username, password) {
        var tag = 'Login';
        var message = '<Login xmlns="http://tempuri.org/">' + '<username>' + username + '</username>' + '<password>' + password + '</password><application>Desktop</application></Login>';
        var deferred = $q.defer();

        //Send login
        proxy.send(envelope.format($translate.use(), message), baseInterface + '/' + tag, function (response, context) {
            console.log(envelope.format($translate.use(), message));

            //Parse xml result into json (Easier to parse)
            parseString(response, function (error, result) {
                console.log(response);
                //Check if the login was a success
                if (context.statusCode == 200) {
                    var result = getValue(result, tag);
                    console.log(result);
                    deferred.resolve(result);
                } else {
                    var faultError = getFaultString(result)
                    console.log(faultError);
                    deferred.reject(faultError);
                }
            });
        });

        return deferred.promise;
    }

    //LogOut
    wcfFactory.logout = function () {
        var deferred = $q.defer();
        var tag = 'LogOut';
        var message = '<LogOut xmlns="http://tempuri.org/"><token>' + sessionStorage.token + '</token></LogOut>';

        //Send logOut
        proxy.send(envelope.format($translate.use(), message), baseInterface + '/' + tag, function (response, context) {
            deferred.resolve();
        });

        return deferred.promise;
    }

    //Check if service is available
    wcfFactory.isServiceOnline = function (callback) {
        $http.get(baseUrl).success(function (data) {
            callback(true);
        })
            .error(function (data, status) {
                callback(false);
            });
    }

    return wcfFactory;
});