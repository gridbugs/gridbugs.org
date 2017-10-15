var gl;
var twod;
var a;
var drawer;
$(function() {

    
    new AsyncGroup(
            new FileLoader('/shaders/', ['standard_vertex_shader.glsl', 'standard_fragment_shader.glsl']),
            new ImageLoader('ml.png')
    ).run_parts(
        function(shaders, textures) {
            
            drawer = new WebGLDrawer(document.getElementById("canvas"))
                            .standard_shaders(shaders[0], shaders[1]);
            
            drawer.init_uniforms();
            drawer.update_resolution();

            a = drawer.circle([200, 200], 100);
            console.debug(a);

            drawer.sync_buffers();

            a.draw();

            drawer.translate([300, 0]);
            a.outline();

        }.arr_args()
    );

});

