precision mediump float;

attribute vec2 a_position;
attribute vec2 a_tex_coord;

varying vec2 v_tex_coord;
varying vec2 v_map_coord;

uniform vec2 u_resolution;
uniform mat3 u_model_view;
uniform vec2 u_tex_size;
uniform vec2 u_map_size;

void main() {
    vec3 world_pos = u_model_view * vec3(a_position, 1);
    vec2 screen_pos = (2.0*(vec2(world_pos) / u_resolution) - 1.0)*vec2(1.0, -1.0);
    gl_Position = vec4(screen_pos, 0, 1);
    v_tex_coord = a_tex_coord * (u_resolution / u_tex_size);
    
    v_map_coord = a_tex_coord * u_resolution/u_map_size;
}

