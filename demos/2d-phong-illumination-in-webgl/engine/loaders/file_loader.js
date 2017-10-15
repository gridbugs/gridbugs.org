function SingleFileLoader(path) {
    this.path = path;
}
SingleFileLoader.prototype.run = function(then) {
    $.get(this.path, function(r) {
        then(r);
    }.bind(this));
}

function FileLoader(path, names) {
    var paths = PathManager.get_paths.apply(window, Array.arguments_array(arguments));
    AsyncGroup.call(this, paths.map(function(p){return new SingleFileLoader(p)}));
}
FileLoader.inherits_from(AsyncGroup);

FileLoader.load = Async.file_load_fn(FileLoader);
