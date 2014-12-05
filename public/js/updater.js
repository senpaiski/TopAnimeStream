aniApp.factory('updater', function ($http, $q) {
    var updater = {};
    var pkg = require('./package.json');
    var semver = require('semver');
    var os = require('os');
    var request = require('request');
    var path = require('path');
    var fs = require('fs');
    var del = require('del');
    var exec = require('child_process').exec;

    var platform = process.platform;
    platform = /^win/.test(platform) ? 'win' : /^darwin/.test(platform) ? 'mac' : 'linux' + (process.arch == 'ia32' ? '32' : '64');


    updater.currentVersion = pkg.version;
    updater.manifestUrl = pkg.manifestUrl;

    updater.checkNewVersion = function () {
        var deferred = $q.defer();
        console.log(updater.manifestUrl);
        //Download package file from manifestUrl
        $http.get(updater.manifestUrl).success(function (data) {

            console.log(data);
            //Check if newVersion is available
            var newVersionExists = semver.gt(data.latestVersion, updater.currentVersion);
            //Verify if the currentVersion is higher than the minVersion requirement
            var meetsVersionRequirement = semver.satisfies(updater.currentVersion, '>=' + data.minVersion);

            deferred.resolve({
                manifest: data,
                meetsVersionRequirement: meetsVersionRequirement,
                newVersionExists: newVersionExists
            });

        }).error(function (error) {
            deferred.reject(error);
        });

        return deferred.promise;
    }

    updater.download = function (manifest, cb) {
        //Code from node-webkit-updater
        //Get package for current platform
        var url = manifest.packages[platform];

        //Download new sourceCode from packageUrl
        var pkg = request(url, function (err, response) {
            console.log(response);
            if (err) {
                cb(err);
            }
            if (response.statusCode < 200 || response.statusCode >= 300) {
                pkg.abort();
                return cb(new Error(response.statusCode));
            }
        });

        //Add content-length data
        pkg.on('response', function (response) {
            if (response && response.headers && response.headers['content-length']) {
                pkg['content-length'] = response.headers['content-length'];
            }
        });

        var filename = path.basename(url),
            destinationPath = path.join(os.tmpdir(), filename);
        console.log('Downloading to ' + destinationPath);
        // download the package to template folder
        fs.unlink(path.join(os.tmpdir(), filename), function () {
            pkg.pipe(fs.createWriteStream(destinationPath));
            pkg.resume();
        });
        pkg.on('error', cb);
        pkg.on('abort', function () {
            cb(this, null);
        });
        pkg.on('end', appDownloaded);
        pkg.pause();

        function appDownloaded() {
            process.nextTick(function () {
                if (pkg.response.statusCode >= 200 && pkg.response.statusCode < 300) {
                    cb(null, destinationPath);
                }
            });
        }
        return pkg;
    }

    updater.unpack = function (filename, cb, manifest) {
        pUnpack[platform].apply(this, arguments);
    };

    updater.patch = function (folder) {
        //Apply new sourceCode to the currentApplication
        //Because everything is in memory we can't delete folders and files and replace them with new code
        //This is part must not crash :S I need to implement a backup plan 

        //Delete all folder recursively except keepFolder array
        /*fs.readdirSync('./').forEach(function (fileName) {
            if ($.inArray(fileName, updater.keepFolder) == -1) {
                var stats = fs.statSync(fileName);
                if (stats.isDirectory()) {
                    fs.removeSync('./' + fileName, function (err) {
                        if (err) return console.error(err)

                        console.log("success!")
                    });
                }
            }
        });

        //Delete all files from main folder except node-webkit files
        fs.readdirSync('./').forEach(function (fileName) {
            if ($.inArray(fileName, updater.nodeWebkitFiles) == -1) {
                var stats = fs.statSync(fileName);
                if (!stats.isDirectory()) {
                    //TODO DELETE FILES / Be careful HERE! xD
                    fs.removeSync('./' + fileName, function (err) {
                        if (err) return console.error(err)

                        console.log("success!")
                    });
                }
            }
        });*/

        var deferred = $q.defer();
        if (platform == "win") {
            //Tested
            exec("xcopy /y /e \"" + folder + "\" \"" + path.resolve("./") + "\"", {
                maxBuffer: Infinity
            }, function (error, stdout, stderr) {
                if (error)
                    deferred.reject(error);
                else
                    deferred.resolve();

                console.log(folder + " -> " + path.resolve("./"));
            });
        } else {
            //Not tested
            exec("cp -r \"" + folder + "\" \"" + path.resolve("./") + "\"", function (error, stdout, stderr) {
                if (error)
                    deferred.reject(error);
                else
                    deferred.resolve();

                console.log(folder + " -> " + path.resolve("./"));
            });
        }

        return deferred.promise;
    }

    updater.keepFolder = ['plugins', 'locales', 'tools'];
    updater.nodeWebkitFiles = ['nwsnapshot.exe', 'nw.pak', 'nw.exe', 'ffmpegsumo.dll', 'icudtl.dat', 'libEGL.dll', 'libGLESv2.dll'];

    //node-webkit updater unpack code
    var getZipDestinationDirectory = function (zipPath) {
        return path.join(os.tmpdir(), path.basename(zipPath, path.extname(zipPath)));
    }

    var pUnpack = {
        mac: function (filename, cb) {
            var args = arguments,
                extension = path.extname(filename);

            if (extension === ".zip") {
                exec('unzip -xo ' + filename + ' >/dev/null', {
                    cwd: os.tmpdir()
                }, function (err) {
                    if (err) {
                        console.log(err);
                        return cb(err);
                    }

                    cb(null, os.tmpdir());
                })

            } else if (extension === ".dmg") {
                // just in case if something was wrong during previous mount
                exec('hdiutil unmount /Volumes/' + path.basename(filename, '.dmg'), function (err) {
                    exec('hdiutil attach ' + filename + ' -nobrowse', function (err) {
                        if (err) {
                            if (err.code == 1) {
                                pUnpack.mac.apply(this, args);
                            }
                            return cb(err);
                        }
                        findMountPoint(path.basename(filename, '.dmg'), cb);
                    });
                });

                function findMountPoint(dmg_name, callback) {
                    exec('hdiutil info', function (err, stdout) {
                        if (err) return callback(err);
                        var results = stdout.split("\n");
                        var dmgExp = new RegExp(dmg_name + '$');
                        for (var i = 0, l = results.length; i < l; i++) {
                            if (results[i].match(dmgExp)) {
                                var mountPoint = results[i].split("\t").pop();
                                var fileToRun = path.join(mountPoint, dmg_name + ".app");
                                return callback(null, fileToRun);
                            }
                        }
                        callback(Error("Mount point not found"));
                    })
                }
            }
        },
        win: function (filename, cb) {
            var destinationDirectory = getZipDestinationDirectory(filename),
                unzip = function () {
                    // unzip by C. Spieler (docs: https://www.mkssoftware.com/docs/man1/unzip.1.asp, issues: http://www.info-zip.org/)
                    exec('"' + path.resolve('tools/unzip.exe') + '" -u -o "' +
                        filename + '" -d "' + destinationDirectory + '" > NUL', function (err) {
                            if (err) {
                                return cb(err);
                            }

                            cb(null, destinationDirectory);
                        });
                };

            console.log("Unpacking to " + destinationDirectory);

            fs.exists(destinationDirectory, function (exists) {
                if (exists) {
                    del(destinationDirectory, {
                        force: true
                    }, function (err) {
                        if (err) {
                            cb(err);
                        } else {
                            unzip();
                        }
                    });
                } else {
                    unzip();
                }
            });

        },
        linux32: function (filename, cb) {
            //filename fix
            exec('tar -zxvf ' + filename + ' >/dev/null', {
                cwd: os.tmpdir()
            }, function (err) {
                console.log(arguments);
                if (err) {
                    console.log(err);
                    return cb(err);
                }
                cb(null, os.tmpdir());
            })
        }
    }

    pUnpack.linux64 = pUnpack.linux32;

    return updater;
});