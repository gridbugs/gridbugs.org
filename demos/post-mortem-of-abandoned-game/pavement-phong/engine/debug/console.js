function Echoer(){}
Echoer.prototype.evaluate = function(str) {
    return str;
}

function Console(input, output, interpreter) {

    this.input = input;
    this.output = output;

    //this will precede any commands repeated to the output
    this.prompt_str = "> ";

    //history of all commands run
    this.command_history = [];

    // modifiable buffer of commands
    this.history_buffer = [];

    //the current place in command history
    this.history_idx = 0;

    //flag to repeat commands in output
    this.echo = true;

    this.enabled = true;

    if (interpreter == undefined) {
        this.interpreter = new Echoer();
    } else {
        this.interpreter = interpreter;
    }
}

Console.prototype.read = function() {
    return this.input.value;
}

Console.prototype.write = function(data) {
    this.append("<br/>" + data);

    //scoll to the bottom of the element
    this.output.scrollTop = this.output.scrollHeight;
}

Console.prototype.clear_input = function() {
    this.input.value = "";
}

Console.prototype.clear_output = function() {
    this.write("<div style='height:"+this.output.offsetHeight+"px;'></div>");
}

Console.prototype.process = function() {
    if (this.enabled) {
        var entry = this.read();

        if (entry != "") {
            this.command_history.push(entry);
            
            this.write(this.prompt_str + entry);
            var ret_val = this.interpreter.evaluate(entry);
            this.clear_input();

            if (ret_val != null) {
                this.write(ret_val);
            }

            this.history_idx = this.command_history.length;
            this.history_buffer = [];
            this.history_buffer[this.history_idx] = "";
        }
    }
}

Console.prototype.enable = function() {
    this.enabled = true;
}

Console.prototype.disable = function() {
    this.enabled = false;
}

Console.prototype.append = function(data) {
    this.output.innerHTML += data;
}

Console.prototype.echo_on = function() {
    this.echo = true;
}

Console.prototype.ocho_off = function() {
    this.echo = false;
}

Console.prototype.display_next = function() {
    this.display_history(this.history_idx+1);
}

Console.prototype.display_prev = function() {
    this.display_history(this.history_idx-1);
}

Console.prototype.display_history = function(n) {
    // if the index is in range
    if (n >= 0 && n <= this.command_history.length) {
        if (this.history_buffer[n] == undefined) {
            this.history_buffer[n] = this.command_history[n];
        }
        this.history_buffer[this.history_idx] = this.input.value;

        this.history_idx = n;
        this.input.value = this.history_buffer[n];
    }
}

Console.prototype.setup_keys = function () {
    const ENTER = 13; //the code for the enter key
    const UP = 38;    //the code for the up arrow
    const DOWN = 40;  //the code for the down arrow

    var c = this;

    document.onkeydown = function(e) {
        var keyID = (window.event) ? event.keyCode : e.keyCode;
        if (keyID == ENTER) {
            c.process();
        }

        if (keyID == UP) {
            c.display_prev();
        }

        if (keyID == DOWN) {
            c.display_next();
        }

    }

}

Console.prototype.focus = function() {
    this.input.focus();
}

Console.prototype.scroll_to_bottom = function() {
    this.output.scrollTop = this.output.scrollHeight;
}
