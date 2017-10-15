precision mediump float;

#define MAX_LIGHT_DIST 1000.0
varying vec2 v_tex_coord;

uniform vec4 u_colour;
uniform int u_has_texture;

uniform vec2 u_resolution;

uniform sampler2D u_image;
uniform float u_offset;
uniform vec2 u_mouse;

vec4 grey(float x) {
    return vec4(x,x,x,1.0);
}

const float eye_height = 50.0;
vec3 eye_pos = vec3(u_resolution/2.0, eye_height);

const float a = 0.1;
const float b = 0.5;
const float c = 20.0;

float f(vec2 pt) {
    return c*sin(pt[0]*a + u_offset) + b;
}
float d_dx_f(vec2 pt) {
    return a*c*cos(pt[0]*a + u_offset);
}
float d_dy_f(vec2 pt) {
    return 0.0;
}

const float light_height = 100.0;
//vec3 light = vec3(200.0, 300.0, light_height);

vec3 norm_f(vec2 pt) {
    vec3 a = vec3(1, 0, d_dx_f(pt));
    vec3 b = vec3(0, 1, d_dy_f(pt));
    return cross(a, b);
}

vec3 refl(vec3 norm, vec3 to_light) {
    return 2.0*(dot(to_light, norm))*norm - to_light;
}

void main() {
    vec2 pt = vec2(gl_FragCoord);
    vec3 pt3 = vec3(pt, f(pt));
//    gl_FragColor = grey(f(pt));

    vec3 light = vec3(u_mouse, light_height);


    vec3 pt_to_light = light - pt3;
    
    // vector from point to eye
    vec3 v = normalize(eye_pos - pt3);

    // normal at point
    vec3 n = normalize(norm_f(pt));

    vec3 l = normalize(pt_to_light);
    vec3 r = normalize(refl(n, l));

    float light_dist = length(pt_to_light);

    float dist_factor = (MAX_LIGHT_DIST - light_dist)/MAX_LIGHT_DIST;
    
    float difuse = dot(l, n);
    float specular = dot(r, v);

    gl_FragColor = grey(1.0*difuse + 1.0*pow(specular, 100.0));// + vec4(pt3[2]*0.2,0,0,1);


    if (u_has_texture == 1) {
        gl_FragColor = texture2D(u_image, v_tex_coord);
    }
}
