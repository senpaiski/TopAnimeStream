module.exports = function (grunt) {
    grunt.initConfig({
        nodewebkit: {
            options: {
                keep_nw: true,
                embed_nw: false,
                build_dir: './builds', // Where the build version of my node-webkit app is saved
                mac: true, // We want to build it for mac
                win: true, // We want to build it for win
                linux32: true, // We don't need linux32
                linux64: true, // We don't need linux64
                mac_icns: './public/img/icon.icns'
            },
            src: ['./node_modules/**', '!./node_modules/*grunt*/**', './views/**', './public/**', './plugins/**', './tools/**', './README.md', './package.json', './LICENSE', './index.html']
        },
        copy: {
            main: {
                files: [
                    {
                        src: './librairies/win/ffmpegsumo.dll',
                        dest: './builds/TopAnimeStream/win/ffmpegsumo.dll',
                        flatten: true
                    },
                    {
                        src: './librairies/win/ffmpegsumo.dll',
                        dest: './builds/cache/win/<%= nodewebkit.options.version %>/ffmpegsumo.dll',
                        flatten: true
                    },
                    {
                        src: './librairies/mac/ffmpegsumo.so',
                        dest: './builds/TopAnimeStream/osx/TopAnimeStream.app/Contents/Frameworks/node-webkit Framework.framework/Libraries/ffmpegsumo.so',
                        flatten: true
                    },
                    {
                        src: './librairies/mac/ffmpegsumo.so',
                        dest: './builds/cache/osx/<%= nodewebkit.options.version %>/node-webkit.app/Contents/Frameworks/node-webkit Framework.framework/Libraries/ffmpegsumo.so',
                        flatten: true
                    },
                    {
                        src: './librairies/linux64/libffmpegsumo.so',
                        dest: './builds/TopAnimeStream/linux64/libffmpegsumo.so',
                        flatten: true
                    },
                    {
                        src: './librairies/linux64/libffmpegsumo.so',
                        dest: './builds/cache/linux64/<%= nodewebkit.options.version %>/libffmpegsumo.so',
                        flatten: true
                    },
                    {
                        src: './librairies/linux32/libffmpegsumo.so',
                        dest: './builds/TopAnimeStream/linux32/libffmpegsumo.so',
                        flatten: true
                    },
                    {
                        src: './librairies/linux32/libffmpegsumo.so',
                        dest: './builds/cache/linux32/<%= nodewebkit.options.version %>/libffmpegsumo.so',
                        flatten: true
                    }
                ]
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-node-webkit-builder');
    grunt.registerTask('default', ['nodewebkit', 'copy']);
}