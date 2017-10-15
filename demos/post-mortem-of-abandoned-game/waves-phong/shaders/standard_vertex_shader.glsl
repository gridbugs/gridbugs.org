precision mediump float;

attribute vec2 a_position;
attribute vec2 a_tex_coord;

varying vec2 v_tex_coord;

uniform float u_point_size;
uniform vec2 u_resolution;
uniform mat3 u_model_view;
uniform float u_flip_y;
uniform bool u_tex_from_position;

void main() {
    vec3 world_pos = u_model_view * vec3(a_position, 1);
    vec2 tex_pos = vec2(world_pos)/u_resolution;
    vec2 pos = (2.0*tex_pos - 1.0)*vec2(1.0, u_flip_y);
    gl_Position = vec4(pos, 0, 1);
    gl_PointSize = u_point_size;

    if (u_tex_from_position) {
        v_tex_coord = tex_pos;
    } else {
        v_tex_coord = a_tex_coord;
    }
}
