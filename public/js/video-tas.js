/**
 * Video.js TopAnimeStream Plugin
 *
 * Functionalities -
 * - Quality selector
 * - Audio language selector
 * - Save watch time (continue watching)
 * - Episode list
 * - Next episode button (IDEA)
 * - Working SSA subtitles (IDEA)
 * - Episode Name in Control Bar
 * - Overlay at the end  displaying the next episode (TODO)
 */

(function () {
    'use strict';
    /******************************************/
    /*            Menu Title for all List     */
    /******************************************/
    // Define quality menu title
    videojs.TitleMenutItem = videojs.MenuItem.extend({
        init: function (player, options) {
            videojs.MenuItem.call(this, player, options);
            // No click handler for the menu title
            this.off('click');
        }
    });

    /******************************************/
    /*            Episode Name Text           */
    /******************************************/
    videojs.NameButton = videojs.Button.extend({
        init: function (player, options) {
            videojs.Button.call(this, player, options);
            this.el().firstChild.innerHTML = player.videoName;
            this.addClass('vjs-name-button');
            this.off('click');

            // Change videoName on change episode
            player.on('changeEpisode', videojs.bind(this, function () {
                this.el().firstChild.innerHTML = player.videoName;
            }));
        }
    });

    /******************************************/
    /*            Episode List Selector       */
    /******************************************/

    videojs.EpisodeListMenuItem = videojs.MenuItem.extend({
        init: function (player, options) {
            options.selected = (player.currentEpisode == options.episode);
            options.label = "Episode " + options.episode.EpisodeNumber;

            this.episode = options.episode;

            videojs.MenuItem.call(this, player, options);

            // Register our click and tap handlers
            this.on(['click', 'tap'], this.onClick);

            // Toggle the selected class whenever the quality changes
            player.on('changeEpisode', videojs.bind(this, function () {
                if (this.episode == player.currentEpisode) {
                    this.selected(true);
                } else {
                    this.selected(false);
                }
            }));
        }
    });

    // Handle click on episode menu item
    videojs.EpisodeListMenuItem.prototype.onClick = function () {
        this.player().changeEpisode(this.episode);
    };

    videojs.EpisodeListButton = videojs.MenuButton.extend({
        init: function (player, options) {
            videojs.MenuButton.call(this, player, options);
        }
    });

    videojs.EpisodeListButton.prototype.className = 'vjs-list-button';

    videojs.EpisodeListButton.prototype.createItems = function () {
        var items = [],
            player = this.player(),
            episodeList = player.episodeList;

        //Add title
        items.push(new videojs.TitleMenutItem(this.player(), {
            el: _V_.Component.prototype.createEl('li', {
                className: 'vjs-menu-title vjs-res-menu-title',
                innerHTML: 'Episodes'
            })
        }));

        for (var i = 0; i < episodeList.length; i++) {
            items.push(new videojs.EpisodeListMenuItem(player, {
                episode: episodeList[i]
            }));
        }

        return items;
    };

    /******************************************/
    /*            Next Episode Button         */
    /******************************************/

    //videojs.NextEpisodeButton = videojs.Button.extend({
    //    init: function (player, options) {
    //        videojs.Button.call(this, player, options);
    //    }
    //});

    //videojs.NextEpisodeButton.prototype.className = 'vjs-next-button';

    //videojs.NextEpisodeButton.prototype.buildCSSClass = function () {
    //    return this.className + vjs.Button.prototype.buildCSSClass.call(this);
    //};

    /******************************************/
    /*            Language Selector           */
    /******************************************/

    videojs.LanguageMenuItem = videojs.MenuItem.extend({
        init: function (player, options) {
            // Modify options for parent MenuItem class's init.
            options.label = options.lang;
            options.selected = (options.lang.toLowerCase() == player.currentLanguage.toLowerCase());

            videojs.MenuItem.call(this, player, options);

            // Store the quality as a property
            this.language = options.lang;

            // Register our click and tap handlers
            this.on(['click', 'tap'], this.onClick);

            // Toggle the selected class whenever the quality changes
            player.on('changeLanguage', videojs.bind(this, function () {
                if (this.language == player.currentLanguage) {
                    this.selected(true);
                } else {
                    this.selected(false);
                }
            }));
        }
    });

    // Handle click on language menu item
    videojs.LanguageMenuItem.prototype.onClick = function () {
        this.player().changeLanguage(this.language);
    };

    videojs.LanguageSelector = videojs.MenuButton.extend({
        init: function (player, options) {
            videojs.MenuButton.call(this, player, options);
        }
    });

    // Set class for language selector button
    videojs.LanguageSelector.prototype.className = 'vjs-language-button';

    videojs.LanguageSelector.prototype.createItems = function () {
        var items = [],
            languages = [],
            sources = this.player().sources;

        //Add title
        items.push(new videojs.TitleMenutItem(this.player(), {
            el: _V_.Component.prototype.createEl('li', {
                className: 'vjs-menu-title vjs-res-menu-title',
                innerHTML: 'Audio'
            })
        }));

        // Add quality menu items to list
        for (var i = 0; i < sources.length; i++) {
            var source = sources[i];

            //Avoid duplicate language
            if (languages.indexOf(source.Link.Language.Name) !== -1)
                continue;

            //Add language item to list
            items.push(new videojs.LanguageMenuItem(this.player(), {
                lang: source.Link.Language.Name
            }));

            //Save language in temporary array. This will help checking duplicates
            languages.push(source.Link.Language.Name);
        }

        return items;
    };

    /******************************************/
    /*            Quality Selector            */
    /******************************************/

    // Define quality menu item
    videojs.QualityMenuItem = videojs.MenuItem.extend({
        init: function (player, options) {
            // Modify options for parent MenuItem class's init.
            options.label = options.quality + "p";
            console.log(player.currentQuality);
            options.selected = (options.quality == player.currentQuality);

            videojs.MenuItem.call(this, player, options);

            // Store the quality as a property
            this.quality = options.quality;

            // Register our click and tap handlers
            this.on(['click', 'tap'], this.onClick);

            // Toggle the selected class whenever the quality changes
            player.on('changeQuality', videojs.bind(this, function () {
                if (this.quality == player.currentQuality) {
                    this.selected(true);
                } else {
                    this.selected(false);
                }
            }));
        }
    });

    // Handle click on quality menu item
    videojs.QualityMenuItem.prototype.onClick = function () {
        this.player().changeQuality(this.quality);
    };

    // Define quality selector button
    videojs.QualitySelector = videojs.MenuButton.extend({
        init: function (player, options) {
            videojs.MenuButton.call(this, player, options);
            this.el().firstChild.firstChild.innerHTML = '';
        }
    });

    // Set class for quality selector button
    videojs.QualitySelector.prototype.className = 'vjs-res-button';

    // Create a menu item for each available quality
    videojs.QualitySelector.prototype.createItems = function () {
        var items = [],
            sources = this.player().sources;

        //Add title
        items.push(new videojs.TitleMenutItem(this.player(), {
            el: _V_.Component.prototype.createEl('li', {
                className: 'vjs-menu-title vjs-res-menu-title',
                innerHTML: 'Quality'
            })
        }));

        // Add quality menu items to list
        for (var i = 0; i < sources.length; i++) {
            var source = sources[i];
            items.push(new videojs.QualityMenuItem(this.player(), {
                quality: source.Quality.replace('p', '')
            }));
        }

        // Sort the available qualities in DESC
        items.sort(function (a, b) {
            if (typeof a.quality == 'undefined') {
                return -1;
            } else {
                return parseInt(b.quality) - parseInt(a.quality);
            }
        });

        return items;
    };

    /******************************************/
    /*          The Plugin Function           */
    /******************************************/

    // This function will be called by video.js when it loops through all of the registered plugins.
    var tasPlugin = function (options) {
        // Only enable the plugin on HTML5 videos
        if (!this.el().firstChild.canPlayType) {
            return;
        }

        //Define player object
        var player = this.player();
        console.log(options.anime);
        // Get options values (name, episodeList)
        player.anime = options.anime;
        player.episodeList = options.episodeList;
        player.currentEpisode = options.currentEpisode;
        player.aniDataService = options.aniDataService;

        player.buildVideoName = function () {
            var player = this;

            //Build & display video name
            if (player.currentEpisode !== undefined) {
                player.videoName = player.anime.OriginalName + " - Episode " + player.currentEpisode.EpisodeNumber + " (" + player.currentEpisode.getEpisodeInformation().EpisodeName + ")";
            } else {
                player.videoName = player.anime.OriginalName;
            }
        }

        // Player object methods
        player.load = function (animeId, episodeId, callback) {
            var service = this.aniDataService,
                player = this;

            //Get source
            service.getSources(animeId, episodeId).then(function (data) {
                var sources = data.value;
                player.sources = sources;

                //Get subtitles
                service.getSubtitles(animeId, episodeId).then(function (subData) {
                    var subtitles = subData.value;
                    player.subtitles = subtitles;

                    return callback();
                });

            }, function (reason) {
                console.log(reason);
            });
        }

        player.changeSource = function (newSrc, useTime) {
            var currentTime = this.currentTime(),
                isPaused = this.paused();

            // Change the source and make sure we don't start the video over		
            this.src(newSrc).one('loadedmetadata', function () {
                // Set last time for the video
                if (useTime) {
                    this.currentTime(currentTime);
                }

                // Restart if the video was paused
                if (!isPaused) {
                    this.play();
                }
            });
        }

        player.changeQuality = function (quality) {
            var sources = this.sources;

            for (var i = 0; i < sources.length; i++) {
                var source = sources[i];
                if (source.Quality.replace('p', '') == quality && source.Link.Language.Name.toLowerCase() == this.currentLanguage.toLowerCase()) {
                    // Assign new source and change source
                    this.changeSource(source.Url, true);

                    //Save current quality
                    this.currentQuality = quality;

                    // Update the classes to reflect the currently selected quality
                    this.trigger('changeQuality');

                    break;
                }
            }
        }

        player.changeLanguage = function (lang) {
            var sources = this.options().sources;

            for (var i = 0; i < sources.length; i++) {
                var source = sources[i];
                if (source.Quality.replace('p', '') == this.currentQuality && source.Link.Language.Name.toLowerCase() == lang.toLowerCase()) {
                    // Assign new source
                    this.changeSource(source.Url, true);

                    //Save currentLanguage
                    this.currentLanguage = lang;

                    // Update the classes to reflect the currently selected language
                    this.trigger('changeLanguage');

                    break;
                }
            }
        }

        player.addSubtitles = function (subs) {
            // Clear subtitles
            $("video").children().unbind();
            var track = document.createElement("track");

            // Add tracks
            track.kind = "subtitles";
            track.label = "english";
            track.srclang = "en";
            track.src = "captions/sintel-en.srt";
            track.addEventListener("load", function () {
                this.mode = "showing";

            });

            $("video").append(track);
            this.trigger("textTracksChanged");
        }

        // Assign prefered language or default
        if (options.preferedLanguage !== undefined) {
            player.currentLanguage = options.preferedLanguage;
        } else {
            player.currentLanguage = "japanese";
        }

        // Assign prefered quality or default
        if (options.preferedQuality !== undefined) {
            player.currentQuality = options.preferedQuality;
        } else {
            player.currentQuality = 360;
        }

        player.start = function () {
            var player = this,
                subtitles = player.subtitles,
                sources = player.sources;

            for (var i = 0; i < sources.length; i++) {
                var source = sources[i];
                var language = source.Link.Language.Name;
                var quality = source.Quality.replace('p', '');

                console.log(quality + " - " + player.currentQuality);
                console.log(language + " - " + player.currentLanguage);
                if (quality == player.currentQuality && language.toLowerCase() == player.currentLanguage.toLowerCase()) {
                    //Add subtitles
                    player.addSubtitles(subtitles);

                    //Change source
                    player.changeSource(source.Url, false);
                    break;
                }
            }
        }

        player.changeEpisode = function (episode) {
            var player = this;
            player.load(episode.AnimeId, episode.EpisodeId, function () {
                player.currentEpisode = episode;
                player.buildVideoName();
                // Update the classes to reflect the currently selected episode
                player.trigger('changeEpisode');

                player.start();
            });
        }

        //Play video
        if (player.currentEpisode !== undefined) {
            player.load(options.anime.AnimeId, options.currentEpisode.EpisodeId, function () {
                player.buildVideoName();
                loadControlBar(player, options);
                player.start();
            });
        } else {
            player.load(options.anime.AnimeId, null, function () {
                player.buildVideoName();
                loadControlBar(player, options);
                player.start();
            });
        }
    };

    var loadControlBar = function (player, options) {
        // We need to pass off the options to the button.
        var qualityComponent = new videojs.QualitySelector(player, options);
        var languageComponent = new videojs.LanguageSelector(player, options);
        var nameComponent = new videojs.NameButton(player, options);

        // Now lets add it to the player.
        var qualityButton = player.controlBar.addChild(qualityComponent);
        var languageButton = player.controlBar.addChild(languageComponent);
        var nameButton = player.controlBar.addChild(nameComponent);

        //If we have the episode list. Display it on the control bar
        if (player.episodeList !== undefined) {
            var episodeListComponent = new videojs.EpisodeListButton(player, options);
            var episodeListButton = player.controlBar.addChild(episodeListComponent);
        }
    }

    //Register plugin to VideoJS
    videojs.plugin('tasPlugin', tasPlugin);
})();