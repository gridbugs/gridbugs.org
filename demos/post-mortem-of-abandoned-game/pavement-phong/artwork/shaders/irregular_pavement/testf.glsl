precision mediump float;

#define R 0
#define G 1
#define B 2

#define PI 3.14159

varying vec2 v_tex_coord;
varying vec2 v_map_coord;

uniform sampler2D u_texture;
uniform sampler2D u_bump_map;
uniform sampler2D u_light_map;
uniform sampler2D u_shine_map;

uniform vec2 u_mouse;

uniform vec2 u_resolution;

const float eye_height = 1000.0;
vec3 eye_pos = vec3(u_resolution/2.0, eye_height);

const float light_height = 200.0;

const float ambient = 0.15;

const float specular_exponent = 200.0;

vec3 refl(vec3 norm, vec3 to_light) {
    return 2.0*(dot(to_light, norm))*norm - to_light;
}

vec3 bump_map_pix_to_normal(vec4 pix) {
    float theta = pix[R] * PI*2.0;
    float phi = (1.0 - pix[G]) * PI/2.0;

    float z = sin(phi);
    float base_len = cos(phi);

    float x = base_len * cos(theta);
    float y = base_len * sin(theta);

    return vec3(x,y,z);
}

void main() {


    vec4 tex_pix = texture2D(u_texture, fract(v_tex_coord));
    vec2 map_coord = fract(v_map_coord);
    vec4 bump_map_pix = texture2D(u_bump_map, map_coord);
    vec4 light_map_pix = texture2D(u_light_map, map_coord);
    vec4 shine_map_pix = texture2D(u_shine_map, map_coord);

    vec3 pos = vec3(vec2(gl_FragCoord), bump_map_pix[G]*256.0);

    vec3 light_pos = vec3(u_mouse, light_height);

    vec3 normal = normalize(bump_map_pix_to_normal(bump_map_pix));

    vec3 to_light = normalize(light_pos - pos);

    float diffuse = max(dot(to_light, normal), 0.0);

    vec3 reflection = normalize(refl(normal, to_light));

    vec3 to_eye = normalize(eye_pos - pos);

    float specular;
    if (diffuse > 0.0) {
        specular = pow(max(dot(reflection, to_eye), 0.0), 1.0+shine_map_pix[R]*256.0);
    } else {
        specular = 0.0;
    }

    vec4 lit_pix = tex_pix * (ambient*light_map_pix[R] + light_map_pix[G]*diffuse) +(light_map_pix[B]* vec4(specular, specular, specular, 1));

    lit_pix[3] = 1.0;
    gl_FragColor = lit_pix;
}
