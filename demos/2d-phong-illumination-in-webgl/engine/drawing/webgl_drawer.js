function WebGLDrawer(canvas, stack_size, preserve_drawing_buffer) {
    this.canvas = canvas;
    this.glm = new WebGLManager(canvas, {
        preserveDrawingBuffer: preserve_drawing_buffer
    }).init_2d();

    // initialize buffers
    this.vertex_buffer = this.glm.array_buffer(2);
    this.index_buffer = this.glm.element_buffer();
    this.texture_buffer = this.glm.array_buffer(2);

    this.dynamic_vertex_buffer = this.glm.array_buffer(2).bind().allocate_dynamic(4096);
    this.dynamic_texture_buffer = this.glm.array_buffer(2).bind().allocate_dynamic(4096);
    this.dynamic_index_buffer = this.glm.element_buffer();

    var line_segment_offset = 4;
    this.dynamic_vertex_buffer.allocate(line_segment_offset);
    this.dynamic_texture_buffer.allocate(line_segment_offset);

    /*
    this.text_vertex_buffer = this.glm.array_buffer(2).bind().allocate_dynamic(1024);
    this.text_texture_buffer = this.glm.array_buffer(2).bind().allocate_dynamic(1024);
    this.text_index_buffer = this.glm.element_buffer().bind().allocate_dynamic(512);
    */

    this.init_presets();

    this.line_width_stack = [];
    this.push_line_width();
    this.set_line_width(1);

    this.vertex_position_attribute = 'a_position';
    this.texture_coord_attribute = 'a_tex_coord';

    Drawer.call(this, stack_size);
}
WebGLDrawer.inherits_from(Drawer);

WebGLDrawer.prototype.select_attribute = function(attr_name, array_buffer) {
    this.shader_program.attribute(attr_name).set(array_buffer.bind());
}
WebGLDrawer.prototype.select_text = function() {
    this.select_attribute(this.vertex_position_attribute, this.text_vertex_buffer);
    this.select_attribute(this.texture_coord_attribute, this.text_texture_buffer);
    this.text_index_buffer.bind();
}
WebGLDrawer.prototype.select_static = function() {
    this.select_attribute(this.vertex_position_attribute, this.vertex_buffer);
    this.select_attribute(this.texture_coord_attribute, this.texture_buffer);
    this.index_buffer.bind();
}
WebGLDrawer.prototype.select_dynamic = function() {
    this.select_attribute(this.vertex_position_attribute, this.dynamic_vertex_buffer);
    this.dynamic_index_buffer.bind();
}


WebGLDrawer.prototype.get_line_width = function() {
    return this.line_width_stack[this.line_width_stack.length-1];
}
WebGLDrawer.prototype.set_line_width = function(width) {
    this.line_width_stack[this.line_width_stack.length-1] = width;
    this.glm.line_width(width);
}
WebGLDrawer.prototype.push_line_width = function() {
    this.line_width_stack.push(this.get_line_width());
}
WebGLDrawer.prototype.pop_line_width = function() {
    this.line_width_stack.pop();
    this.glm.line_width(this.get_line_width());
}

/*
 * Sync the cpu to the gpu
 */
WebGLDrawer.prototype.sync_gpu = function() {
    /* read one pixel value from the screen into an array,
     * forcing the cpu to wait until the gpu has drawn the
     * image before proceeding
     */
    var gl = this.glm.gl;
    var pixels = new Uint8Array(4);
    gl.readPixels( 0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
}

WebGLDrawer.prototype.init_uniforms = function() {
    this.u_resolution = this.shader_program.uniform2fv('u_resolution');
    this.u_resolution.set([this.canvas.width, this.canvas.height]);

    this.u_colour = this.shader_program.uniform4fv('u_colour');
    this.u_model_view = this.shader_program.uniformMatrix3fv('u_model_view');
    this.u_tex_size = this.shader_program.uniform2fv('u_tex_size');
    this.u_has_texture = this.shader_program.uniform1i('u_has_texture');
    this.u_line_width = this.shader_program.uniform1f('u_line_width');
    this.u_point_size = this.shader_program.uniform1f('u_point_size');
    this.u_flip_y = this.shader_program.uniform1f('u_flip_y');

    this.u_pixelate = this.shader_program.uniform1i('u_pixelate');
    this.u_pixel_size = this.shader_program.uniform1i('u_pixel_size');
    this.u_pixel_fade = this.shader_program.uniform1f('u_pixel_fade');

    this.u_blur = this.shader_program.uniform1i('u_blur');
    this.u_blur_radius = this.shader_program.uniform1i('u_blur_radius');
    
    this.u_point_size = this.shader_program.uniform1f('u_point_size');

    this.u_flip_y.set(-1);

    this.u_tex_from_position = this.shader_program.uniform1i('u_tex_from_position');
    this.u_tex_from_position.set(false);

    this.u_opacity = this.shader_program.uniform1f('u_opacity');
    this.u_opacity.set(1);

    this.u_is_light = this.shader_program.uniform1i('u_is_light');
    this.u_is_light.set(false);

    this.u_light_pos = this.shader_program.uniform2fv('u_light_pos');
    this.u_light_radius = this.shader_program.uniform1f('u_light_radius');
    this.u_light_colour = this.shader_program.uniform4fv('u_light_colour');
}

WebGLDrawer.prototype.use_texture = function(width, height) {
    this.u_has_texture.set(1);
    this.u_tex_size.set([width, height]);
}
WebGLDrawer.prototype.no_texture = function() {
    this.u_has_texture.set(0);
}

WebGLDrawer.prototype.standard_shaders = function(vertex, fragment) {
    this.shader_program = this.glm.shader_program(vertex, fragment).use();
    return this;
}
WebGLDrawer.prototype.update_resolution = function() {
    this.resolution = [this.canvas.width, this.canvas.height];
    if (this.u_resolution) {
        console.debug('a');
        this.u_resolution.set([this.canvas.width, this.canvas.height]);
    }
}
WebGLDrawer.prototype.init_presets = function() {
    this.vertex_buffer.add([0,0,0,0]);
    this.texture_buffer.add([0,0,0,0]);
    this.index_buffer.add([0, 1]);

    this.point_slice = this.glm.slice(0, 1);
    this.line_segment_slice = this.glm.slice(0, 2);

}
WebGLDrawer.prototype.sync_buffers = function() {
    this.vertex_buffer.bind().upload_static();
    this.texture_buffer.bind().upload_static();
    this.index_buffer.bind().upload_static();

    this.select_static();
}

WebGLDrawer.prototype.draw_point = function(pt, colour, width) {
    this.save();
    var mv_transform = this.mv_transform;
    mat3.translate(mv_transform, mv_transform, pt);
    this.u_model_view.set(mv_transform);
    this.index_buffer.bind();
    
    this.u_point_size.set(width || 2);
    this.u_colour.set(colour || [0,0,0,1]);
    this.no_texture();
    
    this.point_slice.draw_points();

    console.debug(width);
    this.restore();
}

WebGLDrawer.prototype.draw_line_segment = function(seg, colour, width) {
    this.save();
    this.select_dynamic();
    
    this.dynamic_vertex_buffer.update(0, [
        seg[0][0], seg[0][1], seg[1][0], seg[1][1]
    ]);

    var mv_transform = this.mv_transform;
    this.u_model_view.set(mv_transform);
    this.index_buffer.bind();
    
    this.push_line_width();
    this.set_line_width(width != undefined ? width : 1);
    
    this.u_colour.set(colour || [0,0,0,1]);
    this.no_texture();
    
    this.line_segment_slice.draw_lines();

    this.pop_line_width();

    this.vertex_buffer.bind();
    
    this.select_static();
    this.restore();
}

WebGLDrawer.prototype.clear = function() {
    this.glm.clear();
}

WebGLDrawer.Drawable = function(transform, drawer) {
    if (!drawer) {
        return;
    }
    this.drawer = drawer;

    // halved since each point is represented by 2 values
    this.v_offset = drawer.vertex_buffer.data.length/2;

    // doubled since this is measured in bytes and each element is 2 bytes
    this.i_offset = drawer.index_buffer.data.length*2;
    Transformable.call(this, transform);
}
WebGLDrawer.Drawable.inherits_from(Transformable);

WebGLDrawer.Drawable.prototype.before_draw = function() {
    var drawer = this.drawer;
    drawer.save();
    var mv_transform = drawer.mv_transform;
    mat3.multiply(mv_transform, mv_transform, this.mv_transform);
    drawer.u_model_view.set(mv_transform);
    drawer.index_buffer.bind();
    return drawer;
}

WebGLDrawer.Drawable.prototype.after_draw = function() {
    this.drawer.restore();
}

WebGLDrawer.Drawable.prototype.plus_v_offset = function(arr) {
    return arr.map(function(i){return i+this.v_offset}.bind(this));
}

WebGLDrawer.Rect = function(top_left, size, colour, transform, drawer) {
    WebGLDrawer.Drawable.call(this, transform, drawer);
    
    drawer.index_buffer.add(this.plus_v_offset(WebGLDrawer.Rect.indices));

    drawer.vertex_buffer.add([
        top_left[0], top_left[1],
        top_left[0] + size[0], top_left[1],
        top_left[0] + size[0], top_left[1] + size[1],
        top_left[0], top_left[1] + size[1],
    ]);

    drawer.texture_buffer.add([0,0,1,0,1,1,0,1]);

    this.slice = drawer.glm.slice(this.i_offset, 6);

    this.colour = colour;

    this.size = size;
}
WebGLDrawer.Rect.inherits_from(WebGLDrawer.Drawable);

WebGLDrawer.Rect.indices = [0,1,2,0,2,3];

WebGLDrawer.Rect.prototype.set_colour = function(colour) {
    this.colour = colour;
}

WebGLDrawer.Rect.prototype.draw = function() {
    var drawer = this.before_draw();

    drawer.u_colour.set(this.colour);
    drawer.no_texture();

    this.slice.draw_triangles();

    this.after_draw();
}

WebGLDrawer.Rect.prototype.draw_with_texture = function(texture, size) {
    var drawer = this.before_draw();

    drawer.no_texture();
    drawer.use_texture(size[0], size[1]);
    texture.bind();

    this.slice.draw_triangles();

    this.after_draw();
}



WebGLDrawer.prototype.rect = function(top_left, size, colour, transform) {
    return new WebGLDrawer.Rect(top_left, size, colour, transform, this);
}

WebGLDrawer.Radial = function(centre, points, colour, transform, drawer) {
    WebGLDrawer.Drawable.call(this, transform, drawer);
    
    this.colour = colour;
    var vertices = [centre[0], centre[1]];
    var texture_coords = [0, 0];
    
    for (var i = 0;i<points.length;i++) {
        vertices.push(points[i][0]);
        vertices.push(points[i][1]);

        texture_coords.push(0);
        texture_coords.push(0);
    }

    drawer.vertex_buffer.add(vertices);
    drawer.texture_buffer.add(texture_coords);

    var indices = [];
    for (var i = 0;i<points.length;i++) {
        indices.push(0); // central point
        indices.push(i+1); // current point
        indices.push((i+1)%points.length+1); // next point
    }
    drawer.index_buffer.add(indices.map(function(i){return i + this.v_offset}.bind(this)));

    this.slice = drawer.glm.slice(this.i_offset, points.length * 3);
}
WebGLDrawer.Radial.inherits_from(WebGLDrawer.Drawable);

WebGLDrawer.prototype.radial = function(centre, points, colour, transform) {
    return new WebGLDrawer.Radial(centre, points, colour, transform, this);
}

WebGLDrawer.Radial.prototype.draw = function() {
    var drawer = this.before_draw();
    drawer.u_colour.set(this.colour);
    drawer.no_texture();
    this.slice.draw_triangles();

    this.after_draw();
}
WebGLDrawer.Radial.prototype.draw_with_texture = function(texture) {
    var drawer = this.before_draw();
    drawer.use_texture(100, 100);
    drawer.u_tex_from_position.set(true);
    texture.bind();
    this.slice.draw_triangles();
    drawer.u_tex_from_position.set(false);

    this.after_draw();

}

WebGLDrawer.Image = function(image, position, size, clip_start, clip_size, transform, drawer) {
    WebGLDrawer.Drawable.call(this, transform, drawer);
    this.image = image;
    this.position = position != undefined ? position : [0, 0];
    this.size = size != undefined ? size : [image.width, image.height];
    this.clip_start = clip_start != undefined ? clip_start : [0, 0];
    this.clip_size = clip_size != undefined ? clip_size : [image.width, image.height];
 
    drawer.index_buffer.add(this.plus_v_offset(WebGLDrawer.Rect.indices));
    
    position = this.position;
    size = this.size;
    drawer.vertex_buffer.add([
        position[0], position[1],
        position[0] + size[0], position[1],
        position[0] + size[0], position[1] + size[1],
        position[0], position[1] + size[1],
    ]);
    
    clip_start = this.clip_start;
    clip_size = this.clip_size;
    var clip_top_left = [clip_start[0]/image.width, clip_start[1]/image.height];
    var clip_bottom_right = [(clip_start[0]+clip_size[0])/image.width, (clip_start[1]+clip_size[1])/image.height];
    drawer.texture_buffer.add([
        clip_top_left[0], clip_top_left[1],
        clip_bottom_right[0], clip_top_left[1],
        clip_bottom_right[0], clip_bottom_right[1],
        clip_top_left[0], clip_bottom_right[1]
    ]);

    this.texture = drawer.glm.texture(image);

    this.slice = drawer.glm.slice(this.i_offset, 6);
}
WebGLDrawer.Image.inherits_from(WebGLDrawer.Drawable);

WebGLDrawer.Image.prototype.draw = function() {
    var drawer = this.before_draw();
 
    drawer.use_texture(this.image.width, this.image.height);
    this.texture.bind();
    this.slice.draw_triangles();

    this.after_draw();
}
WebGLDrawer.Image.prototype.clone = function() {
    return new WebGLDrawer.Image(this.image, this.position, this.size, this.clip_start, this.clip_size, this.clone_transform(), this.drawer);
}
WebGLDrawer.prototype.image = function(image, position, size, clip_start, clip_size, transform) {
    return new WebGLDrawer.Image(image, position, size, clip_start, clip_size, transform, this);
}

WebGLDrawer.LineSegment = function(start, end, width, colour, transform, drawer) {
    WebGLDrawer.Drawable.call(this, transform, drawer);
    this.start = start;
    this.end = end;
    this.width = width != undefined ? width : 1;
    this.colour = colour != undefined ? colour : [0,0,0,1];

    drawer.index_buffer.add(this.plus_v_offset([0, 1]));
    drawer.vertex_buffer.add([
        start[0], start[1],
        end[0], end [1]
    ]);
    drawer.texture_buffer.add([0,0,0,0]);

    this.slice = drawer.glm.slice(this.i_offset, 2);
}
WebGLDrawer.LineSegment.inherits_from(WebGLDrawer.Drawable);

WebGLDrawer.LineSegment.prototype.draw = function() {
    var drawer = this.before_draw();
    drawer.no_texture();
    drawer.u_line_width.set(this.width);
    drawer.u_colour.set(this.colour);

    this.slice.draw_lines();

    this.after_draw();
}

WebGLDrawer.prototype.line_segment = function(start, end, width, colour, transform) {
    return new WebGLDrawer.LineSegment(start, end, width, colour, transform, this);
}

WebGLDrawer.Capture = function(top_left, size, transform, drawer) {
    WebGLDrawer.Drawable.call(this, transform, drawer);
    
    drawer.index_buffer.add(this.plus_v_offset(WebGLDrawer.Rect.indices));
    
    drawer.vertex_buffer.add([
        top_left[0], top_left[1],
        top_left[0] + size[0], top_left[1],
        top_left[0] + size[0], top_left[1] + size[1],
        top_left[0], top_left[1] + size[1],
    ]);

    drawer.texture_buffer.add([0,0,1,0,1,1,0,1]);
    
    this.size = size;
    this.slice = drawer.glm.slice(this.i_offset, 6);
    this.texture = drawer.glm.texture(size[0], size[1]);
    this.framebuffer = drawer.glm.framebuffer().bind().texture(this.texture);

    this.framebuffer.unbind();
}
WebGLDrawer.Capture.inherits_from(WebGLDrawer.Drawable);

WebGLDrawer.prototype.capture = function(top_left, size, transform) {
    return new WebGLDrawer.Capture(top_left, size, transform, this);
}

WebGLDrawer.Capture.prototype.begin = function() {
    this.bind();
    this.drawer.glm.clear();
}

WebGLDrawer.Capture.prototype.bind = function() {
    this.framebuffer.bind();
    this.texture.bind();
    this.drawer.u_flip_y.set(1);
}

WebGLDrawer.Capture.prototype.end = function() {
    this.drawer.u_flip_y.set(-1);
    this.framebuffer.unbind();
}

WebGLDrawer.Capture.prototype.draw = function() {
    var drawer = this.before_draw();

    drawer.use_texture(this.size[0], this.size[1]);
    this.texture.bind();
    this.slice.draw_triangles();

    this.after_draw();
}

WebGLDrawer.CapturePair = function(top_left, size, transform, drawer) {
    this.drawing = drawer.capture(top_left, size, transform);
    this.capturing = drawer.capture(top_left, size, transform);
}

WebGLDrawer.CapturePair.prototype.draw = function() {
    this.drawing.draw();
}

WebGLDrawer.CapturePair.prototype.begin = function() {
    this.capturing.begin();
}

WebGLDrawer.CapturePair.prototype.do_swap = function() {
    var tmp = this.capturing;
    this.capturing = this.drawing;
    this.drawing = tmp;
}

WebGLDrawer.CapturePair.prototype.swap = function() {
    this.capturing.end();
    this.do_swap();
    this.capturing.begin();
}

WebGLDrawer.CapturePair.prototype.end = function() {
    this.capturing.end();
    this.do_swap();
}

WebGLDrawer.CapturePair.prototype.bind = function() {
    this.capturing.bind();
}

WebGLDrawer.prototype.capture_pair = function(top_left, size, transform) {
    return new WebGLDrawer.CapturePair(top_left, size, transform, this);
}

WebGLDrawer.Circle = function(position, radius, colour, transform, drawer) {
    WebGLDrawer.Drawable.call(this, transform, drawer);
    if (!WebGLDrawer.Circle.initialized) {
        WebGLDrawer.Circle.init_class();
    }

    this.position = position;
    this.radius = radius;
    this.colour = colour || [0,0,0,1];
    
    drawer.index_buffer.add(this.plus_v_offset(WebGLDrawer.Circle.fill_indices));
    drawer.index_buffer.add(this.plus_v_offset(WebGLDrawer.Circle.outline_indices));

    var points = WebGLDrawer.Circle.points.slice();
    for (var i = 0,len=points.length/2;i!=len;++i) {
        var idx = i*2;
        var pt = [points[idx], points[idx+1]].v2_smult(radius).v2_add(position);
        drawer.vertex_buffer.add(pt);
    }

    drawer.texture_buffer.add(points.map(function(){return 0}));

    this.fill_slice = drawer.glm.slice(this.i_offset, WebGLDrawer.Circle.fill_indices.length);
    
    this.outline_slice = drawer.glm.slice(
        this.i_offset+(WebGLDrawer.Circle.fill_indices.length)*2, 
        WebGLDrawer.Circle.outline_indices.length
    );
    
}
WebGLDrawer.Circle.inherits_from(WebGLDrawer.Drawable);

WebGLDrawer.Circle.init_class = function() {
    var angle_between = (Math.PI*2)/WebGLDrawer.Circle.num_points;
    WebGLDrawer.Circle.points = [0, 0];
    var angle = 0;
    for (var i = 0;i!=WebGLDrawer.Circle.num_points;++i) {
        WebGLDrawer.Circle.points.push(Math.cos(angle));
        WebGLDrawer.Circle.points.push(Math.sin(angle));

        angle += angle_between;
    }

    WebGLDrawer.Circle.fill_indices = [];
    WebGLDrawer.Circle.outline_indices = [];
    for (var i = 1;i<WebGLDrawer.Circle.num_points;++i) {
        WebGLDrawer.Circle.fill_indices.push(0); // centre
        WebGLDrawer.Circle.fill_indices.push(i);
        WebGLDrawer.Circle.fill_indices.push(i+1);

        WebGLDrawer.Circle.outline_indices.push(i);
    }
    
    WebGLDrawer.Circle.fill_indices.push(0); // centre
    WebGLDrawer.Circle.fill_indices.push(WebGLDrawer.Circle.num_points);
    WebGLDrawer.Circle.fill_indices.push(1);
    WebGLDrawer.Circle.outline_indices.push(WebGLDrawer.Circle.num_points);
    WebGLDrawer.Circle.outline_indices.push(1);

    WebGLDrawer.Circle.initialized = true;
}
WebGLDrawer.Circle.num_points = 48;
WebGLDrawer.Circle.initialized = false;
WebGLDrawer.Circle.points = null;
WebGLDrawer.Circle.fill_indices = null;
WebGLDrawer.Circle.outline_indices = null;


WebGLDrawer.prototype.circle = function(position, radius, colour, transform) {
    return new WebGLDrawer.Circle(position, radius, colour, transform, this);
}

WebGLDrawer.Circle.prototype.draw = function() {
    var drawer = this.before_draw();

    drawer.u_colour.set(this.colour);
    drawer.no_texture();
    
    this.fill_slice.draw_triangles();

    this.after_draw();
}

WebGLDrawer.Circle.prototype.outline = function() {
    var drawer = this.before_draw();

    drawer.u_colour.set(this.colour);
    drawer.no_texture();
    
    this.outline_slice.draw_line_strip();

    this.after_draw();
}

WebGLDrawer.Sequence = function(points, width, colour, transform, drawer) {
    WebGLDrawer.Drawable.call(this, transform, drawer);

    this.width = width != undefined ? width : 1;
    this.colour = colour != undefined ? colour : [0,0,0,1];

    drawer.index_buffer.add(this.plus_v_offset(Array.range(points.length)));
    for (var i = 0;i<points.length;i++) {
        drawer.vertex_buffer.add(points[i]);
        drawer.texture_buffer.add([0, 0]);
    }

    this.slice = drawer.glm.slice(this.i_offset, points.length);
}
WebGLDrawer.Sequence.inherits_from(WebGLDrawer.Drawable);

WebGLDrawer.prototype.sequence = function(points, width, colour, transform) {
    return new WebGLDrawer.Sequence(points, width, colour, transform, this);
}

WebGLDrawer.Sequence.prototype.draw = function() {
    var drawer = this.before_draw();
    drawer.u_colour.set(this.colour);
    drawer.no_texture();

    this.slice.draw_line_strip();
    this.after_draw();
}
