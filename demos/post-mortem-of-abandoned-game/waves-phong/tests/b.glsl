precision mediump float;

varying vec2 v_tex_coord;

uniform vec4 u_colour;
uniform int u_has_texture;

uniform sampler2D u_image;

void main() {
    if (u_has_texture == 1) {
        gl_FragColor = texture2D(u_image, v_tex_coord);
    } else {
        gl_FragColor = u_colour;
    }
}
