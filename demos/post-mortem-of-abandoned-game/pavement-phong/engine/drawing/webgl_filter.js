WebGLDrawer.FilterPipeline = function(top_left, size, transform, drawer) {
    this.drawer = drawer;
    this.capture_pair = drawer.capture_pair(top_left, size, transform);
}
WebGLDrawer.FilterPipeline.prototype.set_filters = function(filters) {
    this.filters = Array.array_or_arguments(filters, arguments);
    this.num_filters = this.filters.length;
    return this;
}
WebGLDrawer.prototype.filter_pipeline = function(top_left, size, transform) {
    return new WebGLDrawer.FilterPipeline(top_left, size, transform, this);
}

WebGLDrawer.FilterPipeline.prototype.remove_filters = function() {
    this.drawer.remove_filters();
}

WebGLDrawer.FilterPipeline.prototype.begin = function() {
    this.capture_pair.begin();
}

WebGLDrawer.FilterPipeline.prototype.bind = function() {
    this.capture_pair.bind();
}

WebGLDrawer.FilterPipeline.prototype.draw = function() {
    var filters = this.filters;
    if (filters == undefined || filters.length == 0) {
        this.capture_pair.end();
        this.capture_pair.draw();
        return;
    }
    // loop over all but the last filter
    for (var i = 0,len=this.num_filters;i<len-1;i++) {
        this.capture_pair.swap();
        this.drawer.remove_filters();
        filters[i].activate();
        this.capture_pair.draw();
    }

    // there's one last filter to apply
    this.capture_pair.end();
    this.drawer.remove_filters();
    filters[this.num_filters-1].activate();
    this.capture_pair.draw();
}

WebGLDrawer.prototype.remove_filters = function() {
    this.u_pixelate.set(0);
    this.u_blur.set(0);
}

WebGLDrawer.PixelateFilter = function(pixel_size, drawer) {
    this.drawer = drawer;
    this.pixel_size = pixel_size;
}
WebGLDrawer.PixelateFilter.prototype.activate = function() {
    this.drawer.u_pixelate.set(1);
    this.drawer.u_pixel_size.set(this.pixel_size);
}
WebGLDrawer.prototype.pixelate_filter = function(pixel_size) {
    return new WebGLDrawer.PixelateFilter(pixel_size, this);
}

WebGLDrawer.prototype.blur_filter = function(blur_radius) {
    this.u_blur.set(1);
    this.u_blur_radius.set(blur_radius);
}
WebGLDrawer.BlurFilter = function(blur_radius, drawer) {
    this.drawer = drawer;
    this.blur_radius = blur_radius;
}
WebGLDrawer.BlurFilter.prototype.activate = function() {
    this.drawer.u_blur.set(1);
    this.drawer.u_blur_radius.set(this.blur_radius);
}
WebGLDrawer.prototype.blur_filter = function(blur_radius) {
    return new WebGLDrawer.BlurFilter(blur_radius, this);
}
