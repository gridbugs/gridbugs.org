Array.add_method('canvas_transform', function(ctx) {
    ctx.transform(this[0], this[1], this[3], this[4], this[6], this[7]);
});
Float32Array.add_method('canvas_transform', function(ctx) {
    ctx.transform(this[0], this[1], this[3], this[4], this[6], this[7]);
});


function CanvasDrawer(canvas, stack_size) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    Drawer.call(this, stack_size);
}
CanvasDrawer.inherits_from(Drawer);

CanvasDrawer.prototype.clear = function() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
}

CanvasDrawer.convert_colour = function(colour) {
    if (colour == undefined) {
        return "black";
    }
    return "rgba("+
        parseInt(colour[0]*255)+","+
        parseInt(colour[1]*255)+","+
        parseInt(colour[2]*255)+","+
        colour[3]+")";
}

CanvasDrawer.Drawable = function(transform) {
    Transformable.call(this, transform);
}
CanvasDrawer.Drawable.inherits_from(Transformable);

CanvasDrawer.Drawable.prototype.before_draw = function() {
    var ctx = this.ctx;
    ctx.save();
    this.drawer.mv_transform.canvas_transform(ctx);
    this.mv_transform.canvas_transform(ctx);
    return ctx;
}
CanvasDrawer.Drawable.prototype.after_draw = function() {
    this.ctx.restore();
}



CanvasDrawer.prototype.image = function(image, position, size, clip_start, clip_size, transform) {
    return new CanvasDrawer.Image(image, position, size, clip_start, clip_size, transform, this);
}

CanvasDrawer.Image = function(image, position, size, clip_start, clip_size, transform, drawer) {
    this.drawer = drawer;
    this.ctx = drawer.ctx;
    this.image = image;
    this.position = position != undefined ? position : [0, 0];
    this.size = size != undefined ? size : [image.width, image.height];
    this.clip_start = clip_start != undefined ? clip_start : [0, 0];
    this.clip_size = clip_size != undefined ? clip_size : [image.width, image.height];
    CanvasDrawer.Drawable.call(this, transform);
}
CanvasDrawer.Image.inherits_from(CanvasDrawer.Drawable);

CanvasDrawer.Image.prototype.draw = function() {
    var ctx = this.ctx;
    ctx.save();
    this.drawer.mv_transform.canvas_transform(ctx);
    console.debug(this);
    this.mv_transform.canvas_transform(ctx);
    ctx.drawImage(this.image, 
            this.clip_start[0], this.clip_start[1], 
            this.clip_size[0], this.clip_size[1],
            this.position[0], this.position[1], 
            this.size[0], this.size[1]
    );
    ctx.restore();
}

CanvasDrawer.Image.prototype.clone = function() {
    return new CanvasDrawer.Image(this.image, this.position, this.size, this.clip_start, this.clip_size, this.clone_transform(), this.drawer);
}

CanvasDrawer.prototype.rect = function(top_left, size, colour, transform) {
    return new CanvasDrawer.Rect(top_left, size, colour, transform, this);
}

CanvasDrawer.Rect = function(top_left, size, colour, transform, drawer) {
    this.drawer = drawer;
    this.ctx = drawer.ctx;
    this.top_left = top_left;
    this.size = size;
    this.colour = CanvasDrawer.convert_colour(colour);
    CanvasDrawer.Drawable.call(this, transform);
}
CanvasDrawer.Rect.inherits_from(CanvasDrawer.Drawable);

CanvasDrawer.Rect.prototype.draw = function() {
    var ctx = this.ctx;
    ctx.save();
    this.drawer.mv_transform.canvas_transform(ctx);
    this.mv_transform.canvas_transform(ctx);
    ctx.beginPath();
    ctx.fillStyle = this.colour;
    ctx.fillRect(this.top_left[0], this.top_left[1], this.size[0], this.size[1]);
    ctx.fill();
    ctx.restore();
}

CanvasDrawer.LineSegment = function(start, end, width, colour, transform, drawer) {
    this.drawer = drawer;
    this.ctx = drawer.ctx;
    this.start = start;
    this.end = end;
    this.width = width != undefined ? width : 1;
    this.colour = CanvasDrawer.convert_colour(colour);
    CanvasDrawer.Drawable.call(this, transform);
}

CanvasDrawer.LineSegment.prototype.draw = function() {
    var ctx = this.ctx;
    ctx.save();
    this.drawer.mv_transform.canvas_transform(ctx);
    this.mv_transform.canvas_transform(ctx);
    ctx.beginPath();
    ctx.strokeStyle = this.colour;
    ctx.lineWidth = this.width;
    ctx.moveTo(this.start[0], this.start[1]);
    ctx.lineTo(this.end[0], this.end[1]);
    ctx.stroke();
    ctx.restore();
}

CanvasDrawer.prototype.line_segment = function(start, end, width, colour, transform) {
    return new CanvasDrawer.LineSegment(start, end, width, colour, transform, this);
}

CanvasDrawer.prototype.point = function(position, size, colour, transform) {
    return new CanvasDrawer.Circle(position, size, colour, transform, this);
}

CanvasDrawer.Circle = function(position, radius, colour, transform, drawer) {
    this.drawer = drawer;
    this.ctx = drawer.ctx;
    this.position = position;
    this.radius = radius != undefined ? radius : 2;
    this.colour = CanvasDrawer.convert_colour(colour);
    CanvasDrawer.Drawable.call(this, transform);
}
CanvasDrawer.Circle.inherits_from(CanvasDrawer.Drawable);

CanvasDrawer.Circle.prototype.draw = function() {
    var ctx = this.before_draw();
    ctx.beginPath();
    ctx.fillStyle = this.colour;
    ctx.arc(this.position[0], this.position[1], this.radius, 0, Math.PI*2);
    ctx.fill();
    this.after_draw();
}
CanvasDrawer.Circle.prototype.outline = function() {
    var ctx = this.before_draw();
    ctx.beginPath();
    ctx.strokeStyle = this.colour;
    ctx.arc(this.position[0], this.position[1], this.radius, 0, Math.PI*2);
    ctx.stroke();
    this.after_draw();
   
}


CanvasDrawer.prototype.circle = function(position, radius, colour, transform) {
    return new CanvasDrawer.Circle(position, radius, colour, transform, this);
}

CanvasDrawer.Sequence = function(points, width, colour, transform, drawer) {
    this.drawer = drawer;
    this.ctx = drawer.ctx;
    this.points = points;
    this.width = width != undefined ? width : 1;
    this.colour = CanvasDrawer.convert_colour(colour);
    CanvasDrawer.Drawable.call(this, transform);
}
CanvasDrawer.Sequence.inherits_from(CanvasDrawer.Drawable);

CanvasDrawer.Sequence.prototype.draw = function() {
    var ctx = this.before_draw();
    ctx.beginPath();
    ctx.lineWidth = this.width;
    ctx.strokeStyle = this.colour;
    ctx.moveTo(this.points[0][0], this.points[0][1]);
    for (var i = 1;i<this.points.length;++i) {
        ctx.lineTo(this.points[i][0], this.points[i][1]);
    }
    ctx.stroke();
    this.after_draw();
}

CanvasDrawer.prototype.sequence = function(points, width, colour, transform) {
    return new CanvasDrawer.Sequence(points, width, colour, transform, this);
}

CanvasDrawer.prototype.draw_point = function(pt, colour, width) {
    var ctx = this.ctx;
    ctx.save();
    this.mv_transform.canvas_transform(ctx);
    
    ctx.beginPath();
    ctx.fillStyle = CanvasDrawer.convert_colour(colour);
    ctx.fillRect(pt[0]-width/2, pt[1]-width/2, width, width);
    ctx.fill();

    ctx.restore();
}

CanvasDrawer.prototype.draw_line_segment = function(seg, colour, width) {
    var ctx = this.ctx;
    
    ctx.save();
    this.mv_transform.canvas_transform(ctx);
    
    ctx.beginPath();
    ctx.strokeStyle = CanvasDrawer.convert_colour(colour);
    ctx.lineWidth = width;
    ctx.moveTo(seg[0][0], seg[0][1]);
    ctx.lineTo(seg[1][0], seg[1][1]);
    ctx.stroke();

    ctx.restore();
}

/* dummy methods so the interface matches that of WebGLDrawer */
CanvasDrawer.Dummy = function(){}
CanvasDrawer.Dummy.inherits_from(CanvasDrawer.Drawable);

CanvasDrawer.prototype.capture = function(){return new CanvasDrawer.Dummy()}
CanvasDrawer.Dummy.prototype.begin = function(){}
CanvasDrawer.Dummy.prototype.end = function(){}
CanvasDrawer.Dummy.prototype.set_filters = function(){return this}
CanvasDrawer.Dummy.prototype.draw = function(){}
CanvasDrawer.prototype.remove_filters = function(){}
CanvasDrawer.prototype.pixelate_filter = function(){}
CanvasDrawer.prototype.blur_filter = function(){}
CanvasDrawer.prototype.standard_shaders = function(){}
CanvasDrawer.prototype.init_uniforms = function(){}
CanvasDrawer.prototype.update_resolution = function(){}
CanvasDrawer.prototype.sync_buffers = function(){}
CanvasDrawer.prototype.sync_gpu = function(){}
CanvasDrawer.prototype.filter_pipeline = function(){return new CanvasDrawer.Dummy()}
