precision mediump float;

uniform int depth;
uniform float threshold;
uniform vec2 u_resolution;
uniform float screen_height;
uniform float screen_width;
uniform vec2 offset;
uniform float scale;
uniform vec2 scale_pt;
#define MAX_DEPTH 200

vec2 c_add(vec2 a, vec2 b) {
    return vec2(a[0] + b[0], a[1] + b[1]);
}

vec2 c_mul(vec2 a, vec2 b) {
    return vec2(a[0]*b[0]-a[1]*b[1], a[0]*b[1]+a[1]*b[0]);
}

vec2 c_squ(vec2 v) {
    return c_mul(v, v);
}


vec2 mandl_val(vec2 v, int d) {
    vec2 current = v;
    for (int i = 0;i<MAX_DEPTH;i++) {
        if (i >= d) {
            break;
        }
        current = c_add(c_squ(current), v);
    }
    return current;
}

int mandl_depth(vec2 v, int d) {
    vec2 current = v;
    for (int i = 0;i<MAX_DEPTH;i++) {
        current = c_add(c_squ(current), v);
        if (length(current) < threshold) {
            continue;
        }
        return i;
    }
    return MAX_DEPTH;
}

float mandl_fval(vec2 v, int d) {
    return length(mandl_val(v, d));
}

void main(void) {

    vec4 c = gl_FragCoord;
    
    c[0] -= scale_pt[0];
    c[0] *= scale;
    c[0] += scale_pt[0];
    vec2 o = vec2(-offset[0], offset[1]);

    vec2 v = (o + vec2(c)) / u_resolution;
    
    float d = float(mandl_depth(v, depth));

    float sc_r = 0.03;
    float sc_g = 0.02;
    float sc_b = 0.01;
    float sc_a = 1.0;

    gl_FragColor = vec4(d*sc_r, d*sc_g, d*sc_b, d*sc_a);

}


