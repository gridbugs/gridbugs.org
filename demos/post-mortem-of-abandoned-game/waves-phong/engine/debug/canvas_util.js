function CanvasUtil(canvas){
    this.strokestyle_stack = [];
    this.linewidth_stack = [];
    this.fillstyle_stack = [];
    this.textalign_stack = [];
    this.font_stack = [];
    canvas && this.register_canvas(canvas);
}
CanvasUtil.prototype.register_canvas = function(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
}

CanvasUtil.prototype.begin_path = function() { 
    this.ctx.beginPath();
    this.moved = false;
    return this;
}
CanvasUtil.prototype.stroke = function() { 
    this.ctx.stroke();
    return this;
}
CanvasUtil.prototype.fill = function() { this.ctx.fill() }

CanvasUtil.prototype.with_fillstyle = function(style, fn) {
    this.push_fillstyle(style);
    fn.call(this);
    this.pop_fillstyle();
}

CanvasUtil.prototype.draw_with_line = function(style, width, fn) {

    if (fn == undefined) {
        fn = style;
        style = undefined;
    }

    style = d(style, "black");
    width = d(width, 2);


    this.push_strokestyle(style);
    this.push_linewidth(width);
    this.begin_path();
    fn.call(this);
    this.stroke();
    this.pop_linewidth();
    this.pop_strokestyle();
}

CanvasUtil.prototype.with_line = function(style, width, fn) {
    if (fn == undefined) {
        fn = style;
        style = undefined;
    }

    style = d(style, "black");
    width = d(width, 2);


    this.push_strokestyle(style);
    this.push_linewidth(width);
    fn.call(this);
    this.pop_linewidth();
    this.pop_strokestyle();
}

CanvasUtil.prototype.push_fillstyle = function(style) {
    this.fillstyle_stack.push(this.ctx.fillStyle);
    this.ctx.fillStyle = style;
    return this;
}

CanvasUtil.prototype.pop_fillstyle = function() {
    this.ctx.fillStyle = this.fillstyle_stack.pop();
    return this;
}
CanvasUtil.prototype.push_strokestyle = function(style) {
    this.strokestyle_stack.push(this.ctx.strokeStyle);
    this.ctx.strokeStyle = style;
    return this;
}

CanvasUtil.prototype.pop_strokestyle = function() {
    this.ctx.strokeStyle = this.strokestyle_stack.pop();
    return this;
}

CanvasUtil.prototype.push_linewidth = function(width) {
    this.linewidth_stack.push(this.ctx.lineWidth);
    this.ctx.lineWidth = width;
    return this;
}

CanvasUtil.prototype.pop_linewidth = function() {
    this.ctx.lineWidth = this.linewidth_stack.pop();
    return this;
}

CanvasUtil.prototype.draw_circle = function(circle, colour, width, filled) {
    colour = d(colour, "black");
    width = d(width, 2);
    filled = d(filled, false);

    var radius = circle[1];
    var centre = circle[0];

    if (filled) {
        this.push_fillstyle(colour);
    } else {
        this.push_linewidth(width);
        this.push_strokestyle(colour);
    }

    this.ctx.beginPath();
    
    this.ctx.arc(centre[0], centre[1], radius, 0, Math.PI*2);


    if (filled) {
        this.ctx.fill();
        this.pop_fillstyle();
    } else {
        this.ctx.stroke();
        this.pop_linewidth();
        this.pop_strokestyle();
    }

}

CanvasUtil.prototype.circle = function(centre, radius, filled, colour, width) {
    filled = d(filled, false);
    colour = d(colour, "black");
    width = d(width, 1);

    if (filled) {
        this.push_fillstyle(colour);
    } else {
        this.push_linewidth(width);
        this.push_strokestyle(colour);
    }

    this.ctx.beginPath();
    var _this = this;
    this.ctx.arc(centre[0], centre[1], radius, 0, Math.PI*2);

    if (filled) {
        this.ctx.fill();
        this.pop_fillstyle();
    } else {
        this.ctx.stroke();
        this.pop_linewidth();
        this.pop_strokestyle();
    }
}

CanvasUtil.prototype.move_to = function(pos, y) {
    this.moved = true;
    if (y == undefined) {
        this.ctx.moveTo(pos[0], pos[1]);
    } else {
        this.ctx.moveTo(pos, y);
    }
    return this;
}
CanvasUtil.prototype.line_to = function(pos, y) {
    if (y == undefined) {
        this.ctx.lineTo(pos[0], pos[1]);
    } else {
        this.ctx.lineTo(pos, y);
    }
    return this;
}

CanvasUtil.prototype.to = function(x, y) {
    if (!this.moved) {
        this.move_to(x, y);
    } else {
        this.line_to(x, y);
    }
    return this;
}
CanvasUtil.prototype.up = function() {
    this.moved = false;
    return this;
}
CanvasUtil.prototype.end = function() {
    return this.stroke();
}
CanvasUtil.prototype.start = function() {
    return this.begin_path();
}

CanvasUtil.prototype.clear = function() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
}

CanvasUtil.prototype.draw_point = function(pt, colour, size) {
    size = default_value(size, 4);
    colour = default_value(colour, "black");

    this.draw_circle([pt, size/2], colour, 0, true);

}

CanvasUtil.prototype.draw_segment = function(segment, colour, size) {
    size = default_value(size, 1);
    colour = default_value(colour, "black");
    this.draw_with_line(colour, size, function() {
        this.move_to(segment[0]);
        this.line_to(segment[1]);
    });
}

CanvasUtil.prototype.draw_line = function(line, colour, size) {
    if (line[1][0] == 0) {
        this.draw_segment([[line[0][0], 0], [line[0][0], this.canvas.height]], colour, size);
        return;
    }
    var left_line = [[0, 0], [0, 1]];
    var right_line = [[this.canvas.width, 0], [0, 1]];
    var left_point = line.line_intersection(left_line);
    var right_point = line.line_intersection(right_line);
    this.draw_segment([left_point, right_point], colour, size);
}

CanvasUtil.prototype.draw_sequence = function(seq, colour, size) {
    this.draw_with_line(function() {
        this.sequence(seq, colour, size);
    });
}

CanvasUtil.prototype.sequence = function(seq, colour, size) {
    colour = d(colour, "black");
    size = d(size, 2);
    this.with_line(colour, size, function() {
        seq.map(function(pt){this.to(pt)}.bind(this));
    });
    return this;
}

CanvasUtil.prototype.draw_polygon = function(polygon, strokecolour, fillcolour, strokewidth) {
    strokewidth = default_value(strokewidth, 1);
    strokecolour = default_value(strokecolour, "black");
    fillcolour = default_value(fillcolour, "rgba(0, 0, 0, 0.2)");

    this.move_to(polygon[polygon.length-1]);
    this.draw_with_line(strokecolour, strokewidth, function() {
        for (var i = 0,len=polygon.length;i!=len;++i) {
            this.line_to(polygon[i]);
        }
        this.line_to(polygon[0]); // this removes the jaggedness on the last corner
    });
    
    this.with_fillstyle(fillcolour, function() {
        this.ctx.fill();
    });
}

CanvasUtil.prototype.push_align = function(align) {
    this.textalign_stack.push(this.ctx.textAlign);
    this.ctx.textAlign = align;
}

CanvasUtil.prototype.pop_align = function() {
    this.ctx.textAlign = this.textalign_stack.pop();
}

CanvasUtil.prototype.with_align = function(align, fn) {
    this.push_align(align);
    fn.call(this);
    this.pop_align();
}

CanvasUtil.prototype.push_font = function(font) {
    this.font_stack.push(this.ctx.font);
    this.ctx.font = font;
}

CanvasUtil.prototype.pop_font = function() {
    this.ctx.font = this.font_stack.pop();
}

CanvasUtil.prototype.with_font = function(font, fn) {
    this.push_font(font);
    fn.call(this);
    this.pop_font();
}

CanvasUtil.prototype.with_text = function(font, align, fn) {
    this.with_font(font, function() {
        this.with_align(align, fn);
    });
}

CanvasUtil.prototype.text = function(text, pos, font, align) {
    font = font || "12px Monospace";
    align = align || "left";
    this.with_text(font, align, function() {
        this.ctx.fillText(text, pos[0], pos[1])
    });
}

CanvasUtil.prototype.draw_image = function(image, top_left, size, clip_top_left, clip_size) {
    top_left = d(top_left, [0, 0]);
    size = d(size, [image.width, image.height]);
    clip_top_left = d(clip_top_left, [0, 0]);
    clip_size = d(clip_size, [image.width, image.height]);
    this.ctx.drawImage(image, clip_top_left[0], clip_top_left[1], clip_size[0], clip_size[1], top_left[0], top_left[1], size[0], size[1]);
}

CanvasUtil.prototype.clear_colour = function(colour) {
    this.ctx.beginPath();
    this.ctx.fillStyle = colour;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fill();
}
