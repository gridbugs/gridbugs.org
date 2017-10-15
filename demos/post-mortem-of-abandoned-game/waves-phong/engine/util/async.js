function Async() {}

Async.do_all = function(tasks, then, thens) {
    var done_count = 0;
    if (thens) {
        for (var i = 0;i<tasks.length;i++) {
            tasks[i].then = thens[i];
        }
    }
    for (var i = 0;i<tasks.length;i++) {
        var callback = function(val) {
            if (this.then) {
                this.then(val);
            }
            this.val = val;
            done_count++;
            if (done_count == tasks.length) {
                then(tasks.map(function(t){return t.val}));
            }
        }.bind(tasks[i]);
        tasks[i].run(callback);
    }
}

Async.file_load_fn = function(cl) {
    return function(path, names) {
        var loader = new cl(path, names);
        return function(f) {
            loader.run(f.arr_args());
        }
    }
}

function AsyncGroup(tasks) {
    if (tasks == undefined) {
        return;
    }
    tasks = Array.array_or_arguments(tasks, arguments);
    this.tasks = tasks;
}
AsyncGroup.prototype.run = function(then) {
    Async.do_all(this.tasks, then);
}
AsyncGroup.prototype.run_parts = function(thens) {
    thens = Array.array_or_arguments(thens, arguments);
    Async.do_all(this.tasks, thens[0], thens.slice(1));
}
