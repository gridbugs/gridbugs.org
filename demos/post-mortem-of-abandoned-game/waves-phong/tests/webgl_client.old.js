var gl;
var twod;
var d;
$(function() {

    
    new AsyncGroup(
            new FileLoader('vs.glsl', 'fs.glsl'),
            new ImageLoader('ml.png')
    ).run_parts(
        function(shaders, textures) {
            
            var canvas = document.getElementById("canvas");

            var glm = new WebGLManager(canvas).init_2d();

            var shader_program = glm.shader_program(shaders[0], shaders[1]).use();

            var u_resolution = shader_program.uniform2fv('u_resolution');

            var vbuf = glm.array_buffer(2, [
                0, 0, 
                200, 0, 
                200, 200, 
                0, 200
            ]).bind().upload();

            var tex = glm.texture(textures[0]);
            shader_program.uniform2fv('u_tex_size').set([textures[0].width, textures[0].height]);

            var tbuf = glm.array_buffer(2, [
                0, 0,
                1, 0,
                1, 1,
                0, 1
            ]).bind().upload();

            shader_program.attribute('a_position').set(vbuf);
            shader_program.attribute('a_tex_coord').set(tbuf);
            
            var ebuf = glm.element_buffer([0, 1, 2, 0, 2, 3]).bind().upload();
            
            var slice = glm.slice(6, 0);
            
            var u_flip_y = shader_program.uniform1f('u_flip_y');
            var u_model_view = shader_program.uniformMatrix3fv('u_model_view');
            var u_blur_rad = shader_program.uniform1f('u_blur_rad');
            var u_col = shader_program.uniform4fv('u_col');

            var mv = mat3.create();
            mat3.translate(mv, mv, [0, 0]);
            u_model_view.set(mat3.transpose([], mat3.clone(mv)));

            var rtex = glm.texture(textures[0].width, textures[0].height);
            var fb = glm.framebuffer().bind().texture(rtex);
            
            u_blur_rad.set(20);
            u_col.set([0.1,0,0,0]);


            fb.bind();
            tex.bind();
            u_flip_y.set(-1);
            u_resolution.set([200, 200]);
            glm.viewport(0, 0, textures[0].width, textures[0].height);
            slice.draw_triangles();
            
            
            
            u_flip_y.set(1);
            fb.unbind();
            u_resolution.set([canvas.width, canvas.height]);
            glm.viewport(0, 0, canvas.width, canvas.height);

            u_col.set([0,0,0.5,0]);
            mat3.translate(mv, mv, [400, 200]);
            u_model_view.set(mv);
            
            rtex.bind();
            slice.draw_triangles();
        
        }.arr_args()
    );
    return;



});

