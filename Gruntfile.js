module.exports = function (grunt) {
    grunt.initConfig({
        nodewebkit: {
            options: {
                keep_nw: true,
                embed_nw: false,
                version: '0.9.2',
                build_dir: './builds', // Build patth
                mac: true,
                win: true,
                linux32: true,
                linux64: true,
                macZip: true
                //mac_icns: './public/img/icon.icns'
            },
            src: ['./node_modules/**', '!./node_modules/*grunt*/**', './views/**', './public/**', './plugins/**', './tools/**', './README.md', './package.json', './LICENSE', './settings.json', './index.html']
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
                        src: './librairies/mac/ffmpegsumo.so',
                        dest: './builds/TopAnimeStream/osx/TopAnimeStream.app/Contents/Frameworks/node-webkit Framework.framework/Libraries/ffmpegsumo.so',
                        flatten: true
                    },
                    {
                        src: './librairies/linux64/libffmpegsumo.so',
                        dest: './builds/TopAnimeStream/linux64/libffmpegsumo.so',
                        flatten: true
                    },
                    {
                        src: './librairies/linux32/libffmpegsumo.so',
                        dest: './builds/TopAnimeStream/linux32/libffmpegsumo.so',
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