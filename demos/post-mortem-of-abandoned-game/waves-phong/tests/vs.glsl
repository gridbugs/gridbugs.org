precision mediump float;

attribute vec2 a_position;
attribute vec2 a_tex_coord;

varying vec2 v_tex_coord;

uniform vec2 u_resolution;

void main(void) {
    vec3 world_pos = vec3(a_position, 1);
    vec2 pos = (2.0*(vec2(world_pos) / u_resolution) - 1.0)*vec2(1.0, -1.0);
    gl_Position = vec4(pos*vec2(1,1), 0, 1);
    v_tex_coord = a_tex_coord;
}
