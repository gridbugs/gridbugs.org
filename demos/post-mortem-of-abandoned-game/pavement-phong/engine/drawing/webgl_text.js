WebGLDrawer.Font = function(image, chars, char_size, char_separation, num_rows, num_cols, spacing, drawer) {
    this.image = image;
    this.drawer = drawer;
    this.chars = chars;
    this.texture = drawer.glm.texture(image);
    this.char_size = char_size;
    this.char_separation = char_separation;
    this.num_rows = num_rows;
    this.num_cols = num_cols;
    this.spacing = spacing != undefined ? spacing : 1;

    this.characters = {};
    var char_array = chars.split('');
    for (var i = 0;i<char_array.length;i++) {
        var row = Math.floor(i / num_cols);
        var col = i % num_cols;
        var ch = char_array[i];
        this.characters[ch] = new WebGLDrawer.Character(ch, char_size.v2_add(char_separation).v2_mult([col, row]), char_size, this);
    }
}

WebGLDrawer.Font.prototype.text = function(message, char_size, length, transform) {
    return new WebGLDrawer.Text(message, char_size, length, transform, this);
}

WebGLDrawer.Character = function(character, top_left, size, font) {
    this.font = font;
    this.character = character;
    this.top_left = top_left;
    this.size = size;
}
WebGLDrawer.Character.prototype.to_texture_coord = function() {
    // the top left is (0, 0)
    // the bottom right is (1, 1)
    var top_left = this.top_left;
    var bottom_right = top_left.v2_add(this.size);
    var width = this.font.image.width;
    var height = this.font.image.height;
    var top_left_scaled = [top_left[0]/width, top_left[1]/height];
    var bottom_right_scaled = [bottom_right[0]/width, bottom_right[1]/height];
    
    return [
        top_left_scaled[0], top_left_scaled[1], 
        bottom_right_scaled[0], top_left_scaled[1],  
        bottom_right_scaled[0], bottom_right_scaled[1],
        top_left_scaled[0], bottom_right_scaled[1]
    ];
}

WebGLDrawer.Text = function(message, char_size, length, transform, font) {
    WebGLDrawer.Drawable.call(this, transform, font.drawer);
    this.message = message;
    this.char_array = message.split('');
    this.font = font;
    this.char_size = char_size || font.char_size;
    this.length = message.length;
    this.max_length = length != undefined ? length : message.length;
    var drawer = font.drawer;
    
    // the current text buffer length
    this.v_offset = drawer.text_vertex_buffer.data.length;
    this.i_offset = drawer.text_index_buffer.data.length;

    this.v_data = [];
    this.t_data = [];
    this.i_data = [];
    var offset = [0, 0];
    for (var i = 0;i<this.char_array.length;i++) {
        var ch = this.char_array[i];

        var bottom_right = offset.v2_add(this.char_size);
        var v_arr = [
            offset[0], offset[1],
            bottom_right[0], offset[1],
            bottom_right[0], bottom_right[1],
            offset[0], bottom_right[1]
        ];

        var character = font.characters[ch];
        var t_arr = character.to_texture_coord();
        
        var i_arr = WebGLDrawer.Rect.indices.map(function(j){return j+this.v_data.length/2}.bind(this));

        for (var j = 0;j<v_arr.length;j++) {
            this.v_data.push(v_arr[j]);
            this.t_data.push(t_arr[j]);
        }
        for (var j = 0;j<i_arr.length;j++) {
            this.i_data.push(i_arr[j]);
        }

        offset = offset.v2_add([this.char_size[0] + this.font.spacing, 0]);
    }


    drawer.text_vertex_buffer.bind().update(this.v_offset, this.v_data);
    drawer.text_texture_buffer.bind().update(this.v_offset, this.t_data);
    drawer.text_index_buffer.bind().update(this.i_offset, this.i_data);
    
    this.slice = drawer.glm.slice(this.i_offset, this.i_data.length);
}
WebGLDrawer.Text.inherits_from(WebGLDrawer.Drawable);

WebGLDrawer.Text.prototype.draw = function() {
    var drawer = this.before_draw();
 
    drawer.select_text();

    drawer.use_texture(this.font.image.width, this.font.image.height);
    this.font.texture.bind();
    this.slice.draw_triangles();

    drawer.select_static();

    this.after_draw();
}

WebGLDrawer.prototype.font = function(image, chars, char_size, char_separation, num_rows, num_cols, spacing) {
    return new WebGLDrawer.Font(image, chars, char_size, char_separation, num_rows, num_cols, spacing, this);
}
