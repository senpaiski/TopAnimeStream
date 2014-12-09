'use script';
aniApp.controller('App', function ($scope, aniDataFactory, $translate, $http, $modal, Window, GUI, account) {
    function loadUser() {
        $scope.isConnected = account.isConnected();
        $scope.user = account.getUser();

        $scope.headerUrl = null;
        $scope.headerUrl = 'public/partials/header.html';
    }

    //Load default
    loadUser();

    $scope.isLangActive = function (lang) {
        return lang === $translate.use();
    }

    $scope.getCurrentLanguageId = function () {
        switch ($translate.use()) {
        case "en":
            return 1;
        case "fr":
            return 2;
        case "es":
            return 4;
        default:
            return 1;
        }
    }

    $scope.$on("userLoggedOut", function (event, args) {
        account.clear();
        loadUser();
    });

    $scope.$on("userLoggedIn", function (event, args) {
        loadUser();
    });
});

//Header - toolbar
aniApp.controller('Toolbar', function ($scope, $modal, $translate, $location, Window, aniDataFactory, account) {
    var pkg = require('./package.json');
    $scope.appVersion = pkg.version;

    $scope.minimize = function () {
        Window.minimize();
    };

    $scope.toggleFullscreen = function () {
        Window.toggleKioskMode();
    };

    $scope.close = function () {
        Window.close();
    };

    $scope.isActive = function (route) {
        return route === $location.url();
    }

    $scope.showSignOut = function () {
        $modal.open({
            templateUrl: 'public/partials/sign-out-modal.html',
            controller: 'SignOutModal',
            size: "sm"
        });
    };

    $scope.animeSearch = [];
    $scope.searchValue;

    function searchAnimes(query, skip, top) {
        aniDataFactory.searchAnimes(query, skip, top)
            .then(function (data) {
                console.log(data.value);
                $scope.animeSearch = data.value;
            })
    }

    $scope.reset = function () {
        $scope.animeSearch = [];
    }

    $scope.search = function () {
        if ($scope.searchValue.length === 0) {
            $scope.animeSearch = [];
            return;
        }

        searchAnimes($scope.searchValue, 0, 50);
    }

    $scope.switchLanguage = function (lang) {
        $translate.use(lang);
    }

    $scope.showSettings = function () {
        var modalInstance = $modal.open({
            templateUrl: 'public/partials/settings-modal.html',
            controller: 'Settings',
            backdrop: 'static',
            keyboard: false
        });
    }
});

//Sign out modal
aniApp.controller('SignOutModal', function ($rootScope, $scope, $modalInstance, account, Window) {

    $scope.ok = function () {
        if (account.isConnected()) {
            account.logout().then(function () {
                Window.close();
            });
        } else {
            Window.close();
        }
    }

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    }
});

//Player episode modal
aniApp.controller('PlayerEpisodeModal', function ($scope, $sce, $modalInstance, aniDataFactory, episode, anime, source) {
    $scope.episode = episode;
    $scope.anime = anime;
    $scope.source = source;
    $scope.mp4 = "";

    var video;

    function getVideoMP4() {

        var url;
        for (var i = 0; i < episode.Mirrors.length; i++) {
            var mirror = episode.Mirrors[i];
            if (mirror.AnimeSourceId == source.AnimeSourceId) {
                if (mirror.Provider.Name === "MP4Star")
                    continue;

                if (mirror.Provider.Name === "AnimeUltima")
                    continue;

                if (mirror.Provider.Name === "NovaMov")
                    continue;

                if (mirror.Provider.Name === "Veevr")
                    continue;

                url = mirror.Source;
                break;
            }
        }

        console.log(mirror.Provider.Name);
        console.log(url);
        aniDataFactory.getMP4(url).then(function (data) {
            $scope.mp4 = $sce.trustAsResourceUrl(data.value);

            console.log(data.value);
            setTimeout(function () {
                //Load videojs
                video = videojs("player", {
                    "controls": true,
                    "autoplay": false,
                    "preload": "auto",
                    "techOrder": ["flash", "html5"]
                });



                //If video js is ready than play the video
                video.ready(function () {
                    video.play();
                });



                //Show video
                $("#player").removeClass("hide");
            }, 1000);
        });
    }

    //Get mp4 of embed link
    getVideoMP4();

    $scope.cancel = function () {
        if ((video !== undefined) && (video !== null)) {
            video.pause();
            video.dispose();
        }

        $modalInstance.dismiss('cancel');
    };
});

//Player movie modal
aniApp.controller('PlayerMovieModal', function ($scope, $sce, $modalInstance, aniDataFactory, anime, source, video) {
    $scope.anime = anime;
    $scope.source = source;
    $scope.video = video;
    $scope.mp4;

    //Get mp4 of embed link
    getVideoMP4();

    var video;

    function getVideoMP4() {
        aniDataFactory.getMP4(video.Source).then(function (data) {
            $scope.mp4 = $sce.trustAsResourceUrl(data.value);

            console.log(data.value);
            setTimeout(function () {
                //Load videojs
                video = videojs("player", {
                    "controls": true,
                    "autoplay": false,
                    "preload": "auto",
                    "techOrder": ["flash", "html5"]
                });

                //If video js is ready than play the video
                video.ready();

                //Show video
                $("#player").removeClass("hide");
            }, 1000);
        });
    }

    $scope.cancel = function () {
        if ((video !== undefined) && (video !== null)) {
            video.pause();
            video.dispose();
        }

        $modalInstance.dismiss('cancel');
    };
});


//Login
aniApp.controller('Login', function ($rootScope, $scope, updater, aniFactory, aniDataFactory, Browser, $location, $modal, $q, $filter, settings, $translate, account) {
    $scope.browser = Browser; //This is use to redirect external url page (register & forgot password)
    $scope.username;
    $scope.password;
    $scope.loggingIn = false;
    $scope.loginError;
    $scope.isServiceOnline;

    //Clear cache from disk (do not remove) This avoid caching update manifest file
    var gui = require('nw.gui');
    gui.App.clearCache();
    gui.Window.get().showDevTools();

    //Load default user language
    $translate.use(settings.data.defaultLanguage);

    aniDataFactory.checkForInternetConnection(function (online) {
        console.log('Internet access: ' + online);

        if (!online)
            $scope.loginError = $filter('translate')('NO_INTERNET_ACCESS');
    });

    //AnimeDataService
    aniDataFactory.isServiceOnline(function (online) {
        console.log('Is AnimeDataService online: ' + online);
        $scope.isServiceOnline = online;

        if (!online)
            $scope.loginError = $filter('translate')('SERVICE_OFFLINE');
    });

    //AnimeService (Profile)
    aniFactory.isServiceOnline(function (online) {
        console.log('Is AnimeService online: ' + online);
        $scope.isServiceOnline = online;

        if (!online)
            $scope.loginError = $filter('translate')('SERVICE_OFFLINE');
    });

    $scope.login = function () {
        if (!$scope.isServiceOnline)
            return;

        $scope.loginError = '';
        $scope.loggingIn = true;

        account.login($scope.username, $scope.password).then(function () {

            $rootScope.$broadcast('userLoggedIn', null);
            $location.path('/home');
        }, function (reason) {
            $scope.loggingIn = false;
            $scope.loginError = reason;
            console.log(reason);
        });
    }


    updater.checkNewVersion().then(function (info) {
        console.log(info);
        if (info.newVersionExists) {
            //Display update modal
            var modalInstance = $modal.open({
                templateUrl: 'public/partials/updater-modal.html',
                controller: 'Updater',
                backdrop: 'static',
                keyboard: false
            });
        }
    }, function (error) {
        console.log(error);
        //Error while retreiving manifest file
    });
});

//Full-list
aniApp.controller('FullList', function ($scope, aniDataFactory) {
    $scope.animes = [];

    $scope.busy = aniDataFactory.getFullList(($scope.skip * $scope.max), $scope.max)
        .then(function (data) {
            var items = data.value;
            for (var i = 0; i < items.length; i++) {
                $scope.animes.push(items[i]);
            }
            $scope.busy = false;
            $scope.skip++;
        });
});

//Detail
aniApp.controller('Detail', function ($scope, $routeParams, $modal, $location, aniDataFactory, detail) {
    $scope.episodes = [];
    $scope.totalAvailableEpisodes = 0;
    console.log(detail);
    $scope.anime = detail.data;
    $scope.sources = [];
    $scope.languages = [];
    $scope.selectedSource = {};

    $scope.goBack = function () {
        history.back();
    }

    $scope.anime.getAnimeInformation = function () {
        for (var i = 0; i < this.AnimeInformations.length; i++) {
            var animeInformation = this.AnimeInformations[i];
            if (animeInformation.LanguageId == $scope.getCurrentLanguageId()) {

                animeInformation.getOverview = function () {
                    if (this.Overview)
                        return this.Overview;

                    return this.Description;
                }

                return animeInformation;
            }
        }
    }

    getAvailableSource($routeParams.animeId);

    function getAvailableEpisodes(animeSourceId, skip, top) {
        $scope.busy = aniDataFactory.getAvailableEpisodes(animeSourceId, skip, top)
            .then(function (data) {
                $scope.totalAvailableEpisodes = data["odata.count"];
                $scope.episodes = data.value;
            });
    }

    $scope.loadMore = function () {
        console.log("Load more");
        //Get available episodes
        if (!$scope.anime.IsMovie)
            getAvailableEpisodes($scope.selectedSource.AnimeSourceId, 0, 50);
    }

    function getAvailableSource(animeId) {
        $scope.busy = aniDataFactory.getAnimeSources(animeId)
            .success(function (data) {
                $scope.sources = data.value;

                //Assign first source
                if ($scope.sources.length > 0)
                    $scope.selectedSource = $scope.sources[0];

                //Get available episodes
                if (!$scope.anime.IsMovie)
                    getAvailableEpisodes($scope.selectedSource.AnimeSourceId, 0, 50);

                //Add custom function to source object
                $.each($scope.sources, function (i, obj) {
                    //if its a movie get the video
                    if ($scope.anime.IsMovie) {
                        aniDataFactory.getMirrors(obj.AnimeSourceId, 0, 1)
                            .then(function (data) {
                                obj.Video = data.value[0];
                                console.log(obj.Video);
                            });
                    }

                    obj.getSourceType = function () {
                        if (this.IsSubbed)
                            return "subbed";

                        return "dubbed";
                    }

                    obj.getFlag = function () {
                        switch (this.Language.ISO639) {
                        case "en":
                            return "famfamfam-flag-us";
                        case "fr":
                            return "famfamfam-flag-fr";
                        case "es":
                            return "famfamfam-flag-es";
                        }

                        return "";
                    }

                    var canAdd = true;
                    $.each($scope.languages, function (a, o) {
                        if (o.Language.ISO639 == obj.Language.ISO639) {
                            canAdd = false;
                            return;
                        }
                    });

                    if (canAdd)
                        $scope.languages.push(obj);

                });
            })
            .error(function (error) {
                console.log(error);
            });
    }

    $scope.switchSource = function (source) {
        $scope.selectedSource = source;

        if (!$scope.anime.IsMovie)
            getAvailableEpisodes($scope.selectedSource.AnimeSourceId, 0, 50);
    }

    $scope.playEpisode = function (episode) {
        var modalInstance = $modal.open({
            templateUrl: 'public/partials/player-episode-modal.html',
            controller: 'PlayerEpisodeModal',
            backdrop: 'static',
            keyboard: false,
            resolve: {
                episode: function () {
                    return episode;
                },
                anime: function () {
                    return $scope.anime;
                },
                source: function () {
                    return $scope.selectedSource;
                }
            }
        });

        modalInstance.result.then(function (selectedItem) {
            $scope.selected = selectedItem;
        }, function (e) {
            console.log(e);
        });
    };

    $scope.playMovie = function (video) {
        console.log(video);
        var modalInstance = $modal.open({
            templateUrl: 'public/partials/player-movie-modal.html',
            controller: 'PlayerMovieModal',
            backdrop: 'static',
            keyboard: false,
            resolve: {
                anime: function () {
                    return $scope.anime;
                },
                source: function () {
                    return $scope.selectedSource;
                },
                video: function () {
                    return video;
                }
            }
        });
    };
});

//List
aniApp.controller('List', function ($scope, $location, aniDataFactory) {
    $scope.animes = [];
    $scope.max = 50;
    $scope.skip = 0;
    $scope.busy = false;
    $scope.totalCount;

    $scope.loadMore = function () {
        if ($scope.busy) return;

        if ($scope.totalCount) {
            if (($scope.skip * $scope.max) >= $scope.totalCount)
                return;
        }

        //Get type from querystring
        var type = 'all';
        if ($location.search().type)
            type = $location.search().type;

        //Set query as busy
        $scope.busy = true;
        aniDataFactory.getAnimes(($scope.skip * $scope.max), $scope.max, type).then(function (data) {
            var items = data.value;
            $scope.totalCount = data['odata.count'];
            console.log($scope.totalCount);
            for (var i = 0; i < items.length; i++) {
                $scope.animes.push(items[i]);
            }

            //Query is done then set busy to false and increment the skip value
            $scope.busy = false;
            $scope.skip++;
        });
    };
});

//Home
aniApp.controller('Home', function ($scope, aniDataFactory, animes) {
    $scope.animes = animes.value;
    /*   setTimeout(function () {
        $scope.busy = aniDataFactory.getAnimes(0, 15, 'all')
            .success(function (data) {
                $scope.animes = data.value;
            })
            .error(function (error) {
                console.log(error);
            });
    }, 700);*/
});

//Uploads
aniApp.controller('Uploads', function ($scope, aniDataFactory) {
    $scope.uploads = [];
    $scope.max = 10;
    $scope.skip = 0;
    $scope.busy = false;

    $scope.loadMore = function () {
        if ($scope.busy) return;

        $scope.busy = true;
        aniDataFactory.getLatestUploads(($scope.skip * $scope.max), $scope.max)
            .success(function (data) {
                var items = data.value;
                for (var i = 0; i < items.length; i++) {
                    $scope.uploads.push(items[i]);
                }
                $scope.busy = false;
                $scope.skip++;
                console.log($scope.uploads);
            })
            .error(function (error) {
                console.log(error);
            });
    };
});

//Updater
aniApp.controller('Updater', function ($scope, $modalInstance, $sanitize, $filter, updater, Browser) {
    //Do not remove $sanitize it's used for ng-bind-html
    var gui = require('nw.gui');
    var win = gui.Window.get();
    var pkg = require('./package.json');

    $scope.browser = Browser;
    $scope.currentVersion = pkg.version;
    $scope.newVersion;
    $scope.currentVersion;
    $scope.loaded = 0;
    $scope.percentage = 0;
    $scope.max = 0;
    $scope.status;
    $scope.isDownloading = false;
    $scope.meetsVersionRequirement = true;

    var downloader;

    updater.checkNewVersion().then(function (info) {
            if (info.newVersionExists) {
                $scope.newVersion = info.manifest.latestVersion;
                $scope.meetsVersionRequirement = info.meetsVersionRequirement;
                $scope.currentVersion = pkg.version;

                if (info.meetsVersionRequirement) {

                    $scope.isDownloading = true;
                    $scope.status = $filter('translate')('DOWNLOADING_APP_DATA');

                    //Start update 
                    downloader = updater.download(info.manifest, function (error, filename) {
                        console.log(error);
                        if (!error) {
                            $scope.$apply(function () {
                                $scope.isDownloading = false;
                                $scope.status = '<i class="fa fa-spinner fa-spin"></i>&nbsp;&nbsp;' + $filter('translate')('UNPACKAGING_APP_DATA');
                            });

                            //Unzip
                            updater.unpack(filename, function (error, path) {
                                $scope.$apply(function () {
                                    $scope.status = '<i class="fa fa-spinner fa-spin"></i>&nbsp;&nbsp;' + $filter('translate')('COPYING_FILES');
                                });

                                //Copy new file to the current app folder
                                updater.patch(path).then(function () {
                                        win.reloadDev();
                                    },
                                    function (error) {
                                        console.log(error);
                                    });
                            });
                        }
                    });

                    //Get download length
                    downloader.on('response', function (response) {
                        $scope.max = (downloader['content-length']);
                    });

                    downloader.on('data', function (chunk) {
                        $scope.$apply(function () {
                            $scope.loaded += chunk.length;
                            console.log($scope.loaded);
                            $scope.percentage = ($scope.loaded * 100 / $scope.max);
                        });
                    });
                }
            }
        },
        function (error) {
            console.log(error);
        });

    $scope.close = function () {
        if (downloader)
            downloader.abort();

        $modalInstance.dismiss('cancel');
    };
});

//Settings
aniApp.controller("Settings", function ($scope, $modal, $modalInstance, Browser, $translate, settings) {
    var pkg = require('./package.json');

    $scope.defaultLanguage = settings.data.defaultLanguage;
    $scope.useSecureConnection = settings.data.useSecureConnection;
    $scope.languageMatch = settings.data.languageMatch;

    $scope.browser = Browser;
    $scope.appVersion = pkg.version;

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    }

    $scope.saveChanges = function () {
        settings.data.useSecureConnection = $scope.useSecureConnection;
        settings.data.languageMatch = $scope.languageMatch;

        settings.save();
        $scope.cancel();
    }

    $scope.switchLanguage = function (lang) {
        settings.switchLanguage(lang);
    }

    $scope.showReleaseNotes = function () {
        var modalInstance = $modal.open({
            templateUrl: 'public/partials/release-notes-modal.html',
            controller: 'ReleaseNotes',
            backdrop: 'static',
            keyboard: false
        });
    }
});

//ReleaseNotes
aniApp.controller("ReleaseNotes", function ($scope, $modalInstance) {
    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
});