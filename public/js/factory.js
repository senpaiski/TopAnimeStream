'use strict';

//GUI & Window
aniApp.factory('GUI', function () {
    return require('nw.gui');
}).factory('Window', ['GUI',
    function (gui) {
        return gui.Window.get();
    }
]);

//Browser functions
aniApp.factory('Browser', function (GUI) {
    var main = {};
    
    main.open = function(url) {
        GUI.Shell.openExternal(url);
    };
    
    return main;
});
