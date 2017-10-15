function Graph(cu, h_scale, v_scale, left, top, width, height, origin_left, origin_top, pixsiz) {
    var screen_width = Math.floor(this.height/(pixsiz)) + 1;
    var screen_height = Math.floor(this.width/(pixsiz)) + 1;
    this.cu = cu;
    this.ctx = cu.ctx;
    this.left = left == undefined ? 0 : left;
    this.top = top == undefined ? 0 : top;
    this.width = width == undefined ? this.ctx.canvas.width : width;
    this.height = height == undefined ? this.ctx.canvas.height : height;
    this.origin_left = origin_left == undefined ? this.width / 2 : origin_left;
    this.origin_top = origin_top == undefined ? this.height / 2 : origin_top;
    this.h_scale = h_scale == undefined ? 1 : h_scale;
    this.v_scale = v_scale == undefined ? 1 : v_scale;
    this.pixsiz = pixsiz == undefined ? 1 : pixsiz;
    this.global_origin = [this.origin_left + this.left, this.origin_top + this.top];

    this.set_colours(tinycolor('white'), tinycolor('black'));

    this.col_cache = [];
}

Graph.prototype.draw_point = function(x, y) {
    if (y == null) {
        y = x[1];
        x = x[0];
    }

    var x_to_draw = this.global_origin[0] + x*this.h_scale;
    var y_to_draw = this.global_origin[1] - y*this.v_scale;
    
    this.cu.draw_point([x_to_draw, y_to_draw]);
    return this;
}

Graph.prototype.draw_v_line = function(x, colour, width) {
    var x_to_draw = this.global_origin[0] + x*this.h_scale;
    var bottom = this.ctx.canvas.height;

    this.cu.draw_with_line(colour, width, function() {
        this.to(x_to_draw, 0).to(x_to_draw, bottom);
    });
    return this;
}

Graph.prototype.draw_h_line = function(y, colour, width) {
    var y_to_draw = this.global_origin[1] - y*this.v_scale;
    var right = this.ctx.canvas.width;

    this.cu.draw_with_line(colour, width, function() {
        this.to(0, y_to_draw).to(right, y_to_draw);
    });
    return this;
}


Graph.prototype.draw_borders = function() {
    this.ctx.beginPath();
    this.ctx.moveTo(this.left, this.top);
    this.ctx.lineTo(this.left + this.width, this.top);
    this.ctx.lineTo(this.left + this.width, this.top + this.height);
    this.ctx.lineTo(this.left, this.top + this.height);
    this.ctx.lineTo(this.left, this.top);
    this.ctx.stroke();

    this.cu.draw_point(this.global_origin);
    return this;
}

Graph.prototype.set_colours = function(a, b) {
    this.colours = [
        a,
        b
    ];
}

function interpolate_number(a, b, c) {
    return a + (b - a) * c;
}

Graph.prototype.interpolate_colour = function(byte_scale) {
    if (this.col_cache[byte_scale]) {
        return this.col_cache[byte_scale];
    }

    var one_scale = byte_scale / 255;
    var a = this.colours[0].toHsv();
    var b = this.colours[1].toHsv();

    var c = {
        h: interpolate_number(a.h, b.h, one_scale),
        s: interpolate_number(a.s, b.s, one_scale),
        v: interpolate_number(a.v, b.v, one_scale),
        a: interpolate_number(a.a, b.a, one_scale)
    };

    var col = tinycolor(c).toRgb();
    this.col_cache[byte_scale] = col;
    return col;
}

Graph.prototype.clear = function(colour) {
    this.cu.clear(colour);
}

function set_pixel_rgba(pixarr, base_i, r, g, b, a) {
    pixarr[base_i] = r;
    pixarr[base_i+1] = g;
    pixarr[base_i+2] = b;
    pixarr[base_i+3] = a;
}

/* f is radial a function whose first argument is an angle and the
 * second argument is the distance from the origin
 */
Graph.prototype.plot_radial = function(fn, range) {
    this.plot_2vars(function(x, y) {
        return fn(Math.atan2(y, x), Math.sqrt(x*x+y*y));
    }, range);
    return this;
}

/* fn is a function which takes an x and y value
 * and returns a z value
 */
Graph.prototype.plot_2vars = function(fn, range) {
    range = range || [-1, 1];

    var pixsiz = this.pixsiz;

    this.ctx.beginPath();

    var screen_width = Math.floor(this.height/(pixsiz)) + 1;
    var screen_height = Math.floor(this.width/(pixsiz)) + 1;

    for (var j = 0;j!=screen_width;++j) {
        
        var y = -((j*pixsiz) - this.origin_top)/this.v_scale;
        for (var i = 0;i!=screen_height;++i) {
            var x = ((i*pixsiz) - this.origin_left)/this.h_scale;

            var z = fn(x, y);
            
            var in_range = (Math.min(Math.max(range[0], z), range[1])); 
            var zero_shift = in_range - range[0];
            var one_scale = zero_shift / (range[1] - range[0]);
            var byte_scale = Math.floor(255 * one_scale);

            var col = this.interpolate_colour(byte_scale);
            this.ctx.fillStyle = 'rgba('+col.r+','+col.g+','+col.b+','+col.a+')';
            this.ctx.fillRect(i*pixsiz, j*pixsiz, pixsiz, pixsiz);
            this.ctx.fillRect(i*pixsiz, j*pixsiz, pixsiz, pixsiz);
        }
    }

    this.ctx.fill();
    return this;
}


Graph.prototype.plot_1var = function(fn, col, width) {
    var first = true;
    this.ctx.beginPath();
    this.ctx.strokeStyle = col;
    this.ctx.lineWidth = width;
    for (var i = 0;i!=this.width;++i) {
        var x = (i - this.origin_left)/this.h_scale;
        var y = fn(x);
        var x_to_draw = this.global_origin[0] + x*this.h_scale;
        var y_to_draw = this.global_origin[1] - y*this.v_scale;

        if (first) {
            this.ctx.moveTo(x_to_draw, y_to_draw);
            first = false;
        } else {
            this.ctx.lineTo(x_to_draw, y_to_draw);
        }
    }
    this.ctx.stroke();
    return this;
}
