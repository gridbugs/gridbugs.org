function Light(visibility_context, position, radius, colour, drawer) {
    this.drawer = drawer;
    this.position = position;
    this.radius = radius != undefined ? radius : 2000;
    this.colour = colour != undefined ? colour : [1, 1, 1, 1];
    this.radial = drawer.dynamic_radial(this.position, [], 128, drawer.resolution[0], drawer.resolution[1]);
    this.position_buffer = vec3.create();
    this.visibility_context = visibility_context;
    this.capture = drawer.capture([0, 0], drawer.resolution);
}

WebGLDrawer.prototype.light = function(visibility_context, position, radius, colour) {
    if (radius == undefined) {
        return new Light(null, null, visibility_context, position, this);
    } else {
        return new Light(visibility_context, position, radius, colour, this);
    }
}

Light.prototype.draw = function(texture) {
    this.draw_with(texture, this.position, this.radial);
}

Light.prototype.draw_to_buffer = function(texture) {
    this.capture.begin();
    this.draw(texture);
    this.capture.end();
}
Light.prototype.draw_to_buffer_with = function(texture, position, radial) {
    this.capture.begin();
    this.draw_with(texture, position, radial);
    this.capture.end();
}
Light.prototype.draw_buffer = function() {
    this.capture.draw();
}

Light.prototype.update = function() {
    this.radial.update(this.position, this.visibility_context.visible_polygon(this.position));
    return this;
}

Light.prototype.draw_with = function(texture, position, radial) {
    var drawer = this.drawer;
    var pos = this.position_buffer;
    mat3.multiply(pos, drawer.mv_transform, [position[0], position[1], 1]);

    drawer.u_is_light.set(true);

    drawer.u_light_radius.set(this.radius);
    drawer.u_light_pos.set([pos[0], pos[1]]);
    drawer.u_light_colour.set(this.colour);

    radial.draw(texture);

    drawer.u_is_light.set(false);
}
