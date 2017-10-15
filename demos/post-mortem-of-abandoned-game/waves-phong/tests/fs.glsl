precision mediump float;


varying vec2 v_tex_coord;

uniform sampler2D u_image;
uniform vec2 u_tex_size;

uniform float u_blur_rad;
uniform vec4 u_col;
#define MAX_BLUR_RAD 100.0

void main(void) {
    vec2 px_siz = vec2(1.0, 1.0)/u_tex_size;
    vec4 sum = vec4(0, 0, 0, 0);
    for (float i = 0.0;i<MAX_BLUR_RAD;i+=1.0) {
        if (i >= u_blur_rad) {
            break;
        }
        for (float j = 0.0;j<MAX_BLUR_RAD;j+=1.0) {
            if (j >= u_blur_rad) {
                break;
            }
            sum += texture2D(u_image, v_tex_coord + vec2(px_siz[0]*i, px_siz[1]*j));
        }
    }
//    vec4 q = texture2D(u_image, v_tex_coord);
    vec4 p = u_col + sum / (u_blur_rad*u_blur_rad);
    gl_FragColor = vec4(p[0], p[1], p[2], p[3]);
}
