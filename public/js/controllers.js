'use script';
aniApp.controller('App', function ($rootScope, $scope, aniDataFactory, $translate, $http, $modal, Window, GUI, account) {

    //Load default
    loadUser();

    function loadUser() {
        $scope.isConnected = account.isConnected();
        $scope.user = account.getUser();

        $scope.headerUrl = null;
        $scope.headerUrl = 'public/partials/header.html';
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

    $scope.$on("userLoggedOut", function (event, args) {
        account.clear();
        loadUser();
    });

    $scope.$on("userLoggedIn", function (event, args) {
        loadUser();
        $scope.friendWindow = gui.Window.open('app://host/index.html#/friend-list', {
            position: "center",
            focus: true,
            toolbar: false,
            frame: false,
            width: 300,
            height: 700,
            min_width: 300,
            min_height: 500,
            show: false
        });
    });

    var friendWindowShown = false;
    $rootScope.toggleFriendWindow = function () {
        if (friendWindowShown) {
            $scope.friendWindow.hide();
            friendWindowShown = false;
        } else {
            $scope.friendWindow.show();
            friendWindowShown = true;
        }
    }

    win.on('close', function () {
        this.hide(); // Pretend to be closed already

        if (account.isConnected()) {
            account.logout().then(function () {
                gui.App.closeAllWindows();
            });
        }

        this.close(true);
    });
});

//Header - toolbar
aniApp.controller('Toolbar', function ($rootScope, $scope, $modal, $translate, $location, Window, aniDataFactory, account) {
    var pkg = require('./package.json');
    $scope.appVersion = pkg.version;

    $scope.minimize = function () {
        Window.minimize();
    };

    $scope.toggleFullscreen = function () {
        Window.toggleFullscreen();
    };

    $scope.close = function () {
        Window.close();
    };

    $scope.isActive = function (route) {
        return route === $location.url();
    }

    $scope.openFriendList = function () {
        $rootScope.toggleFriendWindow();
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
                if (query == $scope.searchValue) {
                    console.log(data.value);
                    $scope.animeSearch = data.value;
                }
            })
    }

    $scope.reset = function () {
        $scope.animeSearch = [];
    }

    $scope.search = function () {
        console.log($scope.searchValue);
        if ($scope.searchValue.length <= 3) {
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
                gui.App.closeAllWindows();
            });
        } else {
            gui.App.closeAllWindows();
        }
    }

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    }
});

aniApp.controller('FriendList', function ($rootScope, $scope, account, aniDataFactory) {
    document.getElementById("header").remove();
    $scope.chatInfo = {};

    // Configurations
    $.connection.hub.logging = true;
    $.connection.hub.transportConnectTimeout = 3000;
    //$.connection.hub.url = 'http://localhost:3772/signalr';
    $.connection.hub.url = 'http://www.topanimestream.com/AnimeServices/signalr';
    $.connection.hub.qs = {
        "Authentication": account.getToken()
    };

    // Declare a proxy to reference the hub.
    var chatHub = $.connection.chatHub;

    //Subscribe to Chat
    chatHub.client.receivedChatInfo = function (chatInfo) {
        $scope.$apply(function () {
            $scope.chatInfo = JSON.parse(chatInfo);
        });
        console.log($scope.chatInfo);
    };

    //Start service (login)
    $.connection.hub.start({
        transport: 'longPolling'
    }).done(function () {
        console.log("Success!"); //YES SUCCESS!!
    });

    //This will be triggered every we received data from any hubs
    $.connection.hub.received(function (data) {
        console.log("Received data!");
    });

    $scope.token = account.getToken();
    $scope.friends = [];

    /*    aniDataFactory.getFriends(account.getUser().AccountId).then(function (data) {
        $scope.friends = data;
        console.log(data);
    });*/

    $scope.hide = function () {
        $rootScope.toggleFriendWindow();
    }

    $scope.minimize = function () {
        win.minimize();
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
aniApp.controller('Detail', function ($scope, $routeParams, $modal, $location, Browser, Window, aniFactory, aniDataFactory, detail, $sce, settings, helper) {
    $scope.browser = Browser; //This is use to redirect external url page
    $scope.episodes = [];
    $scope.totalAvailableEpisodes = 0;
    $scope.isPlayer = false;
    $scope.anime = detail.data;
    console.log($scope.anime);
    $scope.sources = [];
    $scope.selectedEpisode = {};
    $scope.skip = 0;
    $scope.video;
    $scope.availableAudio = [];
    $scope.availableSubtitles = [];
    $scope.episodesBusy = false;
    $scope.audioBusy = false;
    $scope.subtitlesBusy = false;

    $scope.goBack = function () {
        history.back();
    }

    $scope.closePlayer = function () {
        $scope.isPlayer = false;
        $scope.disposePlayer();

        //Remove fullscreen style css if the player is currently fullscreen
        setTimeout(function () {
            if (Window.isFullscreen) {
                Window.toggleFullscreen();
                $("#div-player").removeClass("div-fullscreen");
                $(".blue-header").removeClass("div-fullscreen");
                $("#header").css("display", "block");
                $(".video-js").removeClass("vjs-fullscreen");
            }
        }, 500);
    }
    
    $scope.getAnimeUrl = function() {
        return "http://www.topanimestream.com/en/anime/" + helper.encodeUrl($scope.anime.OriginalName) + "-" + $scope.anime.AnimeId + "/";
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

    //    getAvailableSource($routeParams.animeId);

    getAvailableEpisodes($scope.anime.AnimeId, $scope.skip, 50);

    function getAvailableEpisodes(animeId, skip, top) {
        $scope.episodesBusy = true;
        aniDataFactory.getAvailableEpisodes(animeId, skip, top)
            .then(function (data) {
                $scope.totalAvailableEpisodes = data["odata.count"];

                for (var i = 0; i < data.value.length; i++) {
                    $scope.episodes.push(data.value[i]);

                    $scope.episodes[i].getEpisodeInformation = function () {
                        for (var i = 0; i < this.EpisodeInformations.length; i++) {
                            var episodeInformation = this.EpisodeInformations[i];

                            if (episodeInformation.LanguageId == $scope.getCurrentLanguageId()) {

                                episodeInformation.getOverview = function () {
                                    if (this.Overview)
                                        return this.Overview;

                                    return "No overview / description for this episode.";

                                }

                                return episodeInformation;
                            }
                        }

                        return;
                    }
                }

                if ($scope.totalAvailableEpisodes > 0)
                    $scope.selectedEpisode = $scope.episodes[0];

                $scope.episodesBusy = false;
            });
    }

    getAvailableLanguages($scope.anime.AnimeId);

    function getAvailableLanguages(animeId) {
        $scope.subtitlesBusy = true;
        $scope.audioBusy = true;

        aniDataFactory.getAvailableSubtitleLanguages(animeId)
            .then(function (data) {
                var subs = data.value;
                for (var i = 0; i < subs.length; i++) {
                    subs[i].getFlag = function () {
                        switch (this.ISO639) {
                        case "en":
                            return "famfamfam-flag-us";
                        case "fr":
                            return "famfamfam-flag-fr";
                        case "es":
                            return "famfamfam-flag-es";
                        case "ja":
                            return "famfamfam-flag-jp";
                        case "ro":
                            return "famfamfam-flag-ro";
                        }


                        return "";
                    }
                }

                $scope.availableSubtitles = subs;
                $scope.subtitlesBusy = false;
            });

        aniDataFactory.getAvailableAudioLanguages(animeId)
            .then(function (data) {
                var audio = data.value;
                for (var i = 0; i < audio.length; i++) {
                    audio[i].getFlag = function () {
                        switch (this.ISO639) {
                        case "en":
                            return "famfamfam-flag-us";
                        case "fr":
                            return "famfamfam-flag-fr";
                        case "es":
                            return "famfamfam-flag-es";
                        case "ja":
                            return "famfamfam-flag-jp";
                        }

                        return "";
                    }
                }

                $scope.availableAudio = audio;
                $scope.audioBusy = false;
            });
    }


    $scope.selectEpisode = function (episode) {
        $scope.selectedEpisode = episode;
    }

    $scope.isSelectedEpisode = function (episode) {
        if ($scope.selectedEpisode.EpisodeId == episode.EpisodeId)
            return true;

        return false;
    }

    $scope.$on('$locationChangeStart', function (event) {
        $scope.disposePlayer();
    });

    $scope.disposePlayer = function () {
        if ($scope.video) {
            $scope.video.pause();
            setTimeout(function () {
                $scope.video.dispose();
                $scope.video = null;
            }, 0);
        }
    }

    $scope.playEpisode = function (episode) {
        $scope.isPlayer = true;
        $scope.selectedEpisode = episode;
        $scope.disposePlayer(); //Dispose player correctly

        document.getElementById('video-player').innerHTML = "<video id='videojs-player' class='video-js vjs-default-skin vjs-big-play-centered' controls preload='auto'></video>";
        //<track kind='subtitles' label='English' langsrc='en' src='/subs/The_Devil_Is_a_PartTimer_1_en.srt'></track>
        //Load videojs framework with quality selector plugin
        $scope.video = videojs('videojs-player', {
            plugins: {
                tasPlugin: {
                    "anime": $scope.anime,
                    "currentEpisode": $scope.selectedEpisode,
                    "aniDataService": aniDataFactory,
                    "episodeList": $scope.episodes,
                    "preferedLanguage": helper.getLanguageName(settings.data.preferredAudioLanguage),
                    "preferedSubtitle": helper.getLanguageName(settings.data.preferredSubtitleLanguage),
                    "preferedQuality": settings.data.preferredVideoQuality
                }
            },
            controls: true,
            autoplay: true,
            preload: "auto",
            techOrder: ["html5"]
        });

        $scope.addFullsreenEvent();

        //Test save watch time
        aniFactory.markWatch($scope.anime.AnimeId, $scope.selectedEpisode.EpisodeId, $scope.video.currentTime(), $scope.video.duration(), false);
    }

    $scope.playMovie = function () {
        $scope.isPlayer = true;
        $scope.disposePlayer(); //Dispose player correctly

        document.getElementById('video-player').innerHTML = "<video id='videojs-player' class='video-js vjs-default-skin vjs-big-play-centered' controls preload='auto'></video>";
        //Load videojs framework with quality selector plugin
        $scope.video = videojs('videojs-player', {
            plugins: {
                tasPlugin: {
                    "anime": $scope.anime,
                    "aniDataService": aniDataFactory,
                    "preferedLanguage": helper.getLanguageName(settings.data.preferredAudioLanguage),
                    "preferedSubtitle": helper.getLanguageName(settings.data.preferredSubtitleLanguage),
                    "preferedQuality": settings.data.preferredVideoQuality
                }
            },
            controls: true,
            autoplay: true,
            preload: "auto",
            techOrder: ["html5"]
        });

        $scope.addFullsreenEvent();
    }

    //Fix html5 fullscreen - node-webkit does not support the API
    $scope.addFullsreenEvent = function () {
        $('.vjs-fullscreen-control').click(function (e) {
            //$scope.video.requestFullscreen(); //Not working in node-webkit 0.8.6

            //Set fullscreen style css
            if (Window.isFullscreen) {
                $("#div-player").removeClass("div-fullscreen");
                $(".blue-header").removeClass("div-fullscreen");
                $("#header").css("display", "block");
                $(".video-js").removeClass("vjs-fullscreen");
            } else {
                $("#div-player").addClass("div-fullscreen");
                $(".blue-header").addClass("div-fullscreen");
                $("#header").css("display", "none");
                $(".video-js").addClass("vjs-fullscreen");
            }

            //Set app fullscreen
            Window.toggleFullscreen();

        });
    }
});

//List
aniApp.controller('List', function ($scope, $location, aniDataFactory) {
    $scope.animes = [];
    $scope.max = 50;
    $scope.skip = 0;
    $scope.busy = false;
    $scope.totalCount;

    $scope.loadMore = function () {
        console.log('asd');

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
        aniDataFactory.getAvailableAnimes(($scope.skip * $scope.max), $scope.max, type).then(function (data) {
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

    $scope.loadMore();
});

//Home
aniApp.controller('Home', function ($scope, aniDataFactory, animes, links, board, marked) {
    var topList = ['animes', 'board'];
    $scope.selectedTopic = {};

    $scope.getSelectedFrame = function () {
        if (localStorage.getItem('homeSelectedFrame') !== null)
            return localStorage.getItem('homeSelectedFrame');
        else
            return 'animes';
    }

    $scope.switchFrame = function (frameName) {
        localStorage.setItem('homeSelectedFrame', frameName);
    }

    $scope.isFrameActive = function (frameName) {
        if ($scope.getSelectedFrame() == frameName)
            return true;

        return false;
    }

    $scope.getSelectedTopicContent = function () {
        return marked($scope.selectedTopic.Content);
    }

    $scope.selectTopic = function (topic) {
        $scope.selectedTopic = topic;
    }

    $scope.isTopicActive = function (topic) {
        if ($scope.selectedTopic == topic)
            return true;

        return false;
    }

    $scope.animes = animes.value;
    $scope.links = links.value;
    $scope.board = board.value;

    // Select first 
    if (board.value.length > 0)
        $scope.selectTopic(board.value[0]);
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
aniApp.controller("Settings", function ($scope, $modal, $modalInstance, Browser, $translate, settings, helper) {
    var pkg = require('./package.json');

    //Get registered data;
    $scope.settings = settings.data;

    //Get browser object functions
    $scope.browser = Browser;

    //Get app version
    $scope.appVersion = pkg.version;

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    }

    //Save setting to file
    $scope.saveChanges = function () {
        settings.save();
        $scope.cancel();
    }

    //Change preferred audio language
    $scope.changeAudioLanguage = function (lang) {
        $scope.settings.preferredAudioLanguage = lang;
        settings.changeAudioLanguage(lang);
    }

    //Change preferred video quality
    $scope.changeVideoQuality = function (quality) {
        $scope.settings.preferredVideoQuality = quality;
        settings.changeVideoQuality(quality);
    }

    //Change preferred subtitle language
    $scope.changeSubtitleLanguage = function (lang) {
        $scope.settings.preferredSubtitleLanguage = lang;
        settings.changeSubtitleLanguage(lang);
    }

    //Change language
    $scope.switchLanguage = function (lang) {
        $scope.settings.applicationLanguage = lang;
        settings.switchLanguage(lang);
    }
    
    $scope.getLanguageName = function (lang) {
       return helper.getLanguageName(lang);
    }

    $scope.getFlag = function (lang) {
        return helper.getFlag(lang);
    }

    //Show release notes 
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

aniApp.controller("MyList", function ($scope, aniDataFactory, account) {
    $scope.watchedAnimes = [];
    $scope.watchedVideos = [];
    $scope.animesBusy = false;
    $scope.videosBusy = false;

    getWatchedAnimes(account.getUser().AccountId);
    getWatchedVideos(account.getUser().AccountId);

    function getWatchedAnimes(accountId) {
        $scope.animesBusy = true;
        aniDataFactory.getWatchedAnimes(accountId)
            .then(function (data) {
                var animes = data.value;

                //If anime is a movie add 1 to episode count
                for (var i = 0; i < animes.length; i++) {
                    if (animes[i].Anime.IsMovie) {
                        animes[i].Anime.EpisodeCount = 1;
                    }
                }

                $scope.watchedAnimes = animes;
                $scope.animesBusy = false;
            });
    }

    function getWatchedVideos(accountId) {
        $scope.videosBusy = true;
        aniDataFactory.getWatchedVideos(accountId)
            .then(function (data) {
                var videos = data.value;
                console.log(videos);
                $scope.watchedVideos = videos;
                $scope.videosBusy = false;
            });
    }
});