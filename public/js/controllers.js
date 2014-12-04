'use script';
aniApp.controller('App', function ($scope, aniDataFactory, $translate, $http, $modal) {
    $scope.isConnected = false;
    $scope.user;
    $scope.headerUrl = 'public/partials/header.html';

    //Get userInfo from sessions
    if (sessionStorage.token)
        $scope.isConnected = true;

    if (sessionStorage.user)
        $scope.user = JSON.parse(sessionStorage.user);

    $scope.loadUser = function () {
        if (sessionStorage.token)
            $scope.isConnected = true;

        if (sessionStorage.username) {
            //Load user information
            getUserInfo(sessionStorage.username, function (data) {
                console.log(data);
                sessionStorage.user = JSON.stringify(data);
                //Refresh header            
                $scope.headerUrl = null;
                $scope.headerUrl = 'public/partials/header.html';
            });
        }
    }

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

    function getUserInfo(username, callback) {
        aniDataFactory.getUserInfo(username)
            .success(function (data) {
                $scope.user = data.value[0];
                callback($scope.user);
            })
            .error(function (error) {
                console.log(error);
            });
    }
});

//Header - toolbar
aniApp.controller('Toolbar', function ($scope, $modal, $translate, $location, Window, aniDataFactory) {
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
        if ($scope.searchValue.length == 0) {
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
aniApp.controller('SignOutModal', function ($scope, $modalInstance, Window) {
    $scope.ok = function () {
        Window.close();
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
});

//Player episode modal
aniApp.controller('PlayerEpisodeModal', function ($scope, $sce, $modalInstance, aniDataFactory, episode, anime, source) {
    $scope.episode = episode;
    $scope.anime = anime;
    $scope.source = source;
    $scope.mp4;

    //Get mp4 of embed link
    getVideoMP4();

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
aniApp.controller('Login', function ($scope, aniFactory, aniDataFactory, Browser, $location, $modal, $q, $filter) {
    $scope.browser = Browser; //This is use to redirect external url page (register & forgot password)
    $scope.username;
    $scope.password;
    $scope.loggingIn = false;
    $scope.loginError;
    $scope.isServiceOnline;

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

        aniFactory.login($scope.username, $scope.password).then(function (data) {
            //Login was successful
            //Save user login token in session
            console.log(data);
            sessionStorage.token = data;
            sessionStorage.username = $scope.username;
            aniDataFactory.setToken(sessionStorage.token);
            $scope.loadUser();

            //Redirect the user to default page
            $location.path('/home');
            console.log(data);
        }, function (reason) {
            $scope.loggingIn = false;
            $scope.loginError = reason;
            console.log(reason);
        });
    }

    //Check for updates only in the login page
    var pkg = require('./package.json');
    var updater = require('node-webkit-updater');
    var upd = new updater(pkg);

    upd.checkNewVersion(function (error, newVersionExists, manifest) {
        if (!error && newVersionExists) {
            var modalInstance = $modal.open({
                templateUrl: 'public/partials/updater-modal.html',
                controller: 'Updater',
                backdrop: 'static',
                keyboard: false
            });
        }
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
aniApp.controller('Updater', function ($scope, $modalInstance, $filter) {
    var pkg = require('./package.json');
    var updater = require('node-webkit-updater');
    var upd = new updater(pkg);
    var copyPath, execPath;

    $scope.currentVersion = pkg.version;
    $scope.newVersion = "...";
    $scope.loaded = 0;
    $scope.percentage = 0;
    $scope.max = 0;
    $scope.status;
    $scope.isDownloading = false;

    // Args passed when new app is launched from temp dir during update
    if (gui.App.argv.length) {
        copyPath = gui.App.argv[0];
        execPath = gui.App.argv[1];

        // Replace old app, Run updated app from original location and close temp instance
        upd.install(copyPath, function (err) {
            if (!err) {
                upd.run(execPath, null);
                gui.App.quit();
            }
        });
    } else {
        //Check the manifest for version
        $scope.status = $filter('translate')('LOADING_MANIFEST_FILES');
        upd.checkNewVersion(function (error, newVersionExists, manifest) {
            $scope.newVersion = manifest.version;

            console.log(error);
            if (!error && newVersionExists) {

                $scope.$apply(function () {
                    $scope.isDownloading = true;
                    $scope.status = $filter('translate')('DOWNLOADING_APP_DATA');
                });

                //If the version is different from the running one, download new package to a temp directory.
                var downloader = upd.download(function (error, filename) {
                    console.log(error);
                    if (!error) {

                        $scope.$apply(function () {
                            $scope.isDownloading = false;
                            $scope.status = $filter('translate')('UNPACKAGING_APP_DATA');
                        });

                        console.log(filename);
                        //Unpack the package in temp.
                        upd.unpack(filename, function (error, newAppPath) {
                            if (!error) {
                                $scope.$apply(function () {
                                    $scope.status = $filter('translate')('STARTING_INSTALLATION');
                                });

                                //Run new app from temp and kill the old one
                                upd.runInstaller(newAppPath, [upd.getAppPath(), upd.getAppExec()], {});
                                gui.App.quit();
                            } else
                                $scope.cantUpdate();
                        }, manifest);
                    } else
                        $scope.cantUpdate();
                }, manifest);

                //Get download length
                downloader.on('response', function (response) {
                    $scope.max = (downloader['content-length']);
                });

                downloader.on('data', function (chunk) {
                    $scope.$apply(function () {
                        $scope.loaded += chunk.length;
                        $scope.percentage = ($scope.loaded * 100 / $scope.max);
                    });
                });
            } else
                $scope.cantUpdate();
        });
    }

    $scope.cantUpdate = function () {
        $scope.$apply(function () {
            $scope.status = $filter('translate')('UNABLE_TO_UPDATE');
        });
    }

    $scope.close = function () {
        $modalInstance.dismiss('cancel');
    };
});

//Settings
aniApp.controller("Settings", function ($scope, $modal, $modalInstance, Browser) {
    var pkg = require('./package.json');
    $scope.browser = Browser;
    $scope.appVersion = pkg.version;

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };

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