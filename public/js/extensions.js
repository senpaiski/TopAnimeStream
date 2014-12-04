String.prototype.reverse = function () {
    return this.split('').reverse().join('');
};

String.prototype.getBetween = function (first,last) {
    return this.match('/' + first + '(.*?)' + last + '/')[1];
};

String.prototype.replaceLast = function (what, replacement) {
    return this.reverse().replace(new RegExp(what.reverse()), replacement.reverse()).reverse();
};

String.prototype.format = function () {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function (match, number) {
        return typeof args[number] != 'undefined' ? args[number] : match;
    });
};

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

String.prototype.trimToLength = function(m) {
  return (this.length > m) ? jQuery.trim(this).substring(0, m).split(' ').slice(0, -1).join(' ') : this.replace('"', '');
};

var ImageHostUrl = "http://www.topanimestream.com/ImageHost/";

String.prototype.formatPosterPath = function (resolution) {
    if (resolution === "original")
        return ImageHostUrl + this;

    return ImageHostUrl + this.replaceLast("/", "/w" + resolution + "_");
};