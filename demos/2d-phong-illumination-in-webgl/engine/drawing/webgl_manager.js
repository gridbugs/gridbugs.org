var gl;
/*
 * Creates a manager for a given canvas html element
 */
function WebGLManager(canvas, options) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl', options);
    gl = this.gl;
}

/*
 * Sets some convenient gl properties for 2d drawing:
 * - sets the clear colour to white
 * - disables depth buffering
 * - enables blending (so transparent images draw correctly)
 */
WebGLManager.prototype.init_2d = function() {
    var gl = this.gl;
    gl.clearColor(1, 1, 1, 1);
    gl.disable(gl.DEPTH_TEST);
    this.enable_blend();
    this.general_blend();
    return this;
}

WebGLManager.prototype.general_blend = function() {
    var gl = this.gl;
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
}

WebGLManager.prototype.light_blend = function() {
    var gl = this.gl;
    gl.blendFunc(gl.SRC_ALPHA, gl.DST_ALPHA);
}

WebGLManager.prototype.disable_blend = function() {
    this.gl.disable(this.gl.BLEND);
}
WebGLManager.prototype.enable_blend = function() {
    this.gl.enable(this.gl.BLEND);
}

WebGLManager.prototype.set_clear_colour = function(col) {
    this.gl.clearColor(col[0], col[1], col[2], col[3]);
}

WebGLManager.prototype.viewport = function(left, top, width, height) {
    this.gl.viewport(left, top, width, height);
}

/* Uniform Management */
WebGLManager.AbstractUniform = function(name, gl, shader_program) {
    this.name = name;
    this.gl = gl;
    this.location = gl.getUniformLocation(shader_program.program, name);
}
WebGLManager.Uniform1i = function(name, gl, shader_program) {
    WebGLManager.AbstractUniform.call(this, name, gl, shader_program);
}
WebGLManager.Uniform1i.prototype.set = function(value) {
    this.gl.uniform1i(this.location, value);
    return this;
}
WebGLManager.Uniform1f = function(name, gl, shader_program) {
    WebGLManager.AbstractUniform.call(this, name, gl, shader_program);
}
WebGLManager.Uniform1f.prototype.set = function(value) {
    this.gl.uniform1f(this.location, value);
    return this;
}
WebGLManager.Uniform2fv = function(name, gl, shader_program) {
    WebGLManager.AbstractUniform.call(this, name, gl, shader_program);
    return this;
}
WebGLManager.Uniform2fv.prototype.set = function(value) {
    this.gl.uniform2fv(this.location, value);
    return this;
}
WebGLManager.UniformMatrix3fv = function(name, gl, shader_program) {
    WebGLManager.AbstractUniform.call(this, name, gl, shader_program);
    return this;
}
WebGLManager.UniformMatrix3fv.prototype.set = function(value) {
    this.gl.uniformMatrix3fv(this.location, false, value);
    return this;
}
WebGLManager.Uniform3fv = function(name, gl, shader_program) {
    WebGLManager.AbstractUniform.call(this, name, gl, shader_program);
    return this;
}
WebGLManager.Uniform3fv.prototype.set = function(value) {
    this.gl.uniform3fv(this.location, value);
    return this;
}
WebGLManager.Uniform4fv = function(name, gl, shader_program) {
    WebGLManager.AbstractUniform.call(this, name, gl, shader_program);
    return this;
}
WebGLManager.Uniform4fv.prototype.set = function(value) {
    this.gl.uniform4fv(this.location, value);
    return this;
}

/* Shader Management */
WebGLManager.AbstractShader = function(code, gl) {
    this.gl = gl;
    this.code = code;
}
WebGLManager.AbstractShader.prototype.compile = function() {
    var gl = this.gl;
    gl.shaderSource(this.shader, this.code);
    gl.compileShader(this.shader);
}
WebGLManager.VertexShader = function(code, gl) {
    this.shader = gl.createShader(gl.VERTEX_SHADER);
    WebGLManager.AbstractShader.call(this, code, gl);
    this.compile();
}
WebGLManager.VertexShader.prototype = new WebGLManager.AbstractShader();
WebGLManager.VertexShader.prototype.constructor = WebGLManager.VertexShader;

WebGLManager.FragmentShader = function(code, gl) {
    this.shader = gl.createShader(gl.FRAGMENT_SHADER);
    WebGLManager.AbstractShader.call(this, code, gl);
    this.compile();
}
WebGLManager.FragmentShader.prototype = new WebGLManager.AbstractShader();
WebGLManager.FragmentShader.prototype.constructor = WebGLManager.FragmentShader;

WebGLManager.ShaderProgram = function(vertex_shader, fragment_shader, gl) {
    this.program = gl.createProgram();
    this.vertex_shader = vertex_shader;
    this.fragment_shader = fragment_shader;
    gl.attachShader(this.program, vertex_shader.shader);
    gl.attachShader(this.program, fragment_shader.shader);
    gl.linkProgram(this.program);
    this.gl = gl;
}
WebGLManager.ShaderProgram.prototype.use = function() {
    this.gl.useProgram(this.program);
    return this;
}

WebGLManager.prototype.vertex_shader = function(code) {
    return new WebGLManager.VertexShader(code, this.gl);   
}
WebGLManager.prototype.fragment_shader = function(code) {
    return new WebGLManager.FragmentShader(code, this.gl);   
}
WebGLManager.prototype.shader_program = function(vertex_shader, fragment_shader) {
    if (vertex_shader.constructor == String) {
        return new WebGLManager.ShaderProgram(
                this.vertex_shader(vertex_shader),
                this.fragment_shader(fragment_shader),
                this.gl
        );
    } else if (vertex_shader.constructor == WebGLManager.VertexShader) {
        return new WebGLManager.ShaderProgram(
                vertex_shader, fragment_shader, this.gl
        );
    }
}

/* Attribute Management */
WebGLManager.Attribute = function(name, gl, shader_program) {
    this.name = name;
    this.gl = gl;
    this.location = gl.getAttribLocation(shader_program.program, name);
}
WebGLManager.Attribute.prototype.set = function(array_buffer) {
    array_buffer.bind();
    var gl = this.gl;
    gl.enableVertexAttribArray(this.location);
    gl.vertexAttribPointer(this.location, array_buffer.datum_size, gl.FLOAT, false, 0, 0);
    return this;
}

WebGLManager.AbstractBuffer = function() {}
WebGLManager.AbstractBuffer.prototype.init = function(data, gl) {
    if (data == undefined) {
        data = [];
    }
    this.data = data;
    this.buffer = gl.createBuffer();
    this.gl = gl;
}
WebGLManager.AbstractBuffer.prototype.add = function(arr) {
    for (var i = 0;i!=arr.length;++i) {
        this.data.push(arr[i]);
    }
}
WebGLManager.AbstractBuffer.prototype.allocate = function(size) {
    for (var i = 0;i<size;i++) {
        this.data.push(0);
    }
}


WebGLManager.ArrayBuffer = function(data, datum_size, gl) {
    this.init(data, gl);
    this.datum_size = datum_size;
}
WebGLManager.ArrayBuffer.prototype = new WebGLManager.AbstractBuffer();
WebGLManager.ArrayBuffer.prototype.constructor = WebGLManager.ArrayBuffer;
WebGLManager.ArrayBuffer.prototype.bind = function() {
    var gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    return this;
}
WebGLManager.ArrayBuffer.prototype.upload_static = function() {
    var gl = this.gl;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.data), gl.STATIC_DRAW);
    return this;
}
WebGLManager.ArrayBuffer.prototype.upload_dynamic = function() {
    var gl = this.gl;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.data), gl.DYNAMIC_DRAW);
    return this;
}
WebGLManager.ArrayBuffer.prototype.allocate_dynamic = function(n) {
    var gl = this.gl;
    gl.bufferData(gl.ARRAY_BUFFER, n, gl.DYNAMIC_DRAW);
    return this;
}
WebGLManager.ArrayBuffer.prototype.update = function(offset, data) {
    var gl = this.gl;
    gl.bufferSubData(gl.ARRAY_BUFFER, offset, new Float32Array(data));
    return this;
}

WebGLManager.ArrayBuffer.prototype.attribute = function(name, shader_program) {
    var gl = this.gl;
    var attr = new WebGLManager.Attribute(name, gl, shader_program);
    gl.enableVertexAttribArray(attr.location);
    gl.vertexAttribPointer(attr.location, this.datum_size, gl.FLOAT, false, 0, 0);
    return attr;
}

WebGLManager.ElementBuffer = function(indices, gl) {
    WebGLManager.AbstractBuffer.prototype.init.call(this, indices, gl);
}
WebGLManager.ElementBuffer.prototype = new WebGLManager.AbstractBuffer();
WebGLManager.ElementBuffer.prototype.constructor = WebGLManager.ElementBuffer;

WebGLManager.ElementBuffer.prototype.upload_static = function() {
    var gl = this.gl;
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.data), gl.STATIC_DRAW);
    return this;
}
WebGLManager.ElementBuffer.prototype.upload_dynamic = function() {
    var gl = this.gl;
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.data), gl.DYNAMIC_DRAW);
    return this;
}
WebGLManager.ElementBuffer.prototype.allocate_dynamic = function(n) {
    var gl = this.gl;
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, n, gl.DYNAMIC_DRAW);
    return this;
}

WebGLManager.ElementBuffer.prototype.update = function(offset, data) {
    var gl = this.gl;
    gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, offset, new Uint16Array(data));
    return this;
}

WebGLManager.ElementBuffer.prototype.bind = function() {
    var gl = this.gl;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffer);
    return this;
}

WebGLManager.ElementBuffer.prototype.draw_triangles = function(length, offset) {
    var gl = this.gl;
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, length, gl.UNSIGNED_SHORT, offset);
}


WebGLManager.Texture = function(gl) {
    this.gl = gl;
    this.texture = gl.createTexture();

}
WebGLManager.Texture.prototype.bind = function(n) {
    var gl = this.gl;
    if (n != undefined) {
        gl.activeTexture(gl.TEXTURE0+n);
    }
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    return this;
}
WebGLManager.Texture.prototype.no_repeat = function() {
    var gl = this.gl;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    return this;
}
WebGLManager.Texture.prototype.size = function(width, height) {
    var gl = this.gl;
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    return this;
}
WebGLManager.Texture.prototype.image = function(image) {
    var gl = this.gl;
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    return this;
}

WebGLManager.Framebuffer = function(gl) {
    this.gl = gl;
    this.framebuffer = gl.createFramebuffer();
}
WebGLManager.Framebuffer.prototype.bind = function() {
    var gl = this.gl
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    return this;
}
WebGLManager.Framebuffer.prototype.unbind = function() {
    var gl = this.gl
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return this;
}

WebGLManager.Framebuffer.prototype.texture = function(texture) {
    var gl = this.gl;
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture.texture, 0);
    return this;
}

WebGLManager.Slice = function(offset, length, gl) {
    this.length = length;
    this.offset = offset;
    this.gl = gl;
}
WebGLManager.Slice.prototype.set_length = function(length) {
    this.length = length;
}
WebGLManager.Slice.prototype.draw_triangles = function() {
    var gl = this.gl;
    gl.drawElements(gl.TRIANGLES, this.length, gl.UNSIGNED_SHORT, this.offset);
}
WebGLManager.Slice.prototype.draw_lines = function() {
    var gl = this.gl;
    gl.drawElements(gl.LINES, this.length, gl.UNSIGNED_SHORT, this.offset);
}
WebGLManager.Slice.prototype.draw_line_strip = function() {
    var gl = this.gl;
    gl.drawElements(gl.LINE_STRIP, this.length, gl.UNSIGNED_SHORT, this.offset);
}
WebGLManager.Slice.prototype.draw_points = function() {
    var gl = this.gl;
    gl.drawElements(gl.POINTS, this.length, gl.UNSIGNED_SHORT, this.offset);
}

WebGLManager.prototype.slice = function(offset, length) {
    return new WebGLManager.Slice(offset, length, this.gl);
}

WebGLManager.prototype.texture = function(a, b) {
    var tex = new WebGLManager.Texture(this.gl);
    if (a.constructor == HTMLImageElement) {
        return tex.bind().image(a).no_repeat();
    } else if (a != undefined) {
        return tex.bind().size(a, b).no_repeat();
    } else {
        return tex;
    }
}

WebGLManager.prototype.framebuffer = function() {
    return new WebGLManager.Framebuffer(this.gl);
}

WebGLManager.prototype.array_buffer = function(datum_size, data) {
    return new WebGLManager.ArrayBuffer(data, datum_size, this.gl);
}
WebGLManager.prototype.element_buffer = function(data) {
    return new WebGLManager.ElementBuffer(data, this.gl);
}

WebGLManager.ShaderProgram.prototype.attribute = function(name) {
    return new WebGLManager.Attribute(name, this.gl, this);
}

WebGLManager.ShaderProgram.prototype.uniform1i = function(name) {
    return new WebGLManager.Uniform1i(name, this.gl, this);
}
WebGLManager.ShaderProgram.prototype.uniform1f = function(name) {
    return new WebGLManager.Uniform1f(name, this.gl, this);
}
WebGLManager.ShaderProgram.prototype.uniform2fv = function(name) {
    return new WebGLManager.Uniform2fv(name, this.gl, this);
}
WebGLManager.ShaderProgram.prototype.uniform3fv = function(name) {
    return new WebGLManager.Uniform3fv(name, this.gl, this);
}
WebGLManager.ShaderProgram.prototype.uniform4fv = function(name) {
    return new WebGLManager.Uniform4fv(name, this.gl, this);
}
WebGLManager.ShaderProgram.prototype.uniformMatrix3fv = function(name) {
    return new WebGLManager.UniformMatrix3fv(name, this.gl, this);
}

WebGLManager.prototype.unbind_framebuffer = function() {
    var gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

WebGLManager.prototype.clear = function() {
    var gl = this.gl;
    gl.clear(gl.COLOR_BUFFER_BIT);
}
WebGLManager.prototype.draw_element_triangles = function(length, offset) {
    var gl = this.gl;
    gl.drawElements(gl.TRIANGLES, length, gl.UNSIGNED_SHORT, offset);
}
WebGLManager.prototype.draw_element_points = function(length, offset) {
    var gl = this.gl;
    console.debug(offset, length);
    gl.drawElements(gl.POINTS, length, gl.UNSIGNED_SHORT, offset);
}
WebGLManager.prototype.line_width = function(width) {
    this.gl.lineWidth(width);
}
