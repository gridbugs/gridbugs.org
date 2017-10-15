function SingleImageLoader(source) {
    this.source = source;
    this.image = document.createElement('img');
}
SingleImageLoader.prototype.run = function(then) {
    this.image.onload = function() {
        then(this.image);
    }.bind(this);
    this.image.src = this.source;
    if (this.image.complete) {
        then(this.image);
    }
}

function ImageLoader(root, sources) {
    var paths = PathManager.get_paths.apply(null, arguments);
    AsyncGroup.call(this, paths.map(function(p){return new SingleImageLoader(p)}));
}
ImageLoader.inherits_from(AsyncGroup);

ImageLoader.load = Async.file_load_fn(ImageLoader);
