$(function() {
    
    conway($('#conway'), {
        survive_min: 2,
        survive_max: 3,
        resurrect_min: 3,
        resurrect_max: 3
    }, false);
    
    conway($('#conway-variant-1'), {
        survive_min: 4,
        survive_max: 8,
        resurrect_min: 5,
        resurrect_max: 5
    }, false);
    
    conway($('#conway-variant-2'), {
        survive_min: 4,
        survive_max: 8,
        resurrect_min: 5,
        resurrect_max: 5
    }, true);
    
    conway($('#conway-variant-3'), {
        survive_min: 4,
        survive_max: 8,
        resurrect_min: 5,
        resurrect_max: 5
    }, true, true);

    function conway($canvas, rules, edge_alive, complete) {
        var ctx = $canvas[0].getContext('2d');

        const SIZE = 4;
        var WIDTH = +$canvas[0].width / SIZE;
        var HEIGHT = +$canvas[0].height / SIZE;

        function mkcells() {
            var ret = [];
            for (var i = 0; i < HEIGHT; ++i) {
                ret[i] = []
                for (var j = 0; j < WIDTH; ++j) {
                    ret[i][j] = false;
                }
            }
            return ret;
        }

        function foreach_cell(cells, f) {
            for (var i = 0; i < HEIGHT; ++i) {
                for (var j = 0; j < WIDTH; ++j) {
                    f(cells, i, j);
                }
            }
        }

        var current = mkcells();
        var next = mkcells();

        function init() {
            foreach_cell(current, function(cells, i, j) {
                cells[i][j] = Math.random() < 0.5;
            });
        }

        $canvas.click(toggle);

        function progress(current, next, rules) {
            foreach_cell(current, function(cells, i, j) {

                if (edge_alive && (i == 0 || j == 0 || i == HEIGHT - 1 || j == WIDTH - 1)) {
                    next[i][j] = true;
                    return;
                }

                var count = 0;
                for (var k = Math.max(0, i-1); k < Math.min(HEIGHT, i+2); ++k) {
                    for (var l = Math.max(0, j-1); l < Math.min(WIDTH, j+2); ++l) {
                        if (!(k==i&&l==j)) {
                            if(cells[k][l]) {
                                ++count;
                            }
                        }
                    }
                }

                if (cells[i][j]) {
                    if (count >= rules.survive_min && count <= rules.survive_max) {
                        next[i][j] = true;
                    } else {
                        next[i][j] = false;
                    }
                } else {
                    if (count >= rules.resurrect_min && count <= rules.resurrect_max) {
                        next[i][j] = true;
                    } else {
                        next[i][j] = false;
                    }
                }
            });
            
            var diff_count = 0;
            foreach_cell(current, function(cells, i, j) {
                if (cells[i][j] != next[i][j]) {
                    cells[i][j] = next[i][j];
                    ++diff_count;
                }
            });
            return diff_count;
        }

        function draw(cells) {
            ctx.beginPath();
            foreach_cell(current, function(cells, i, j) {
                if (cells[i][j]) {
                    ctx.fillStyle = "black";
                } else {
                    ctx.fillStyle = "white";
                }
                
                ctx.fillRect(j * SIZE, i * SIZE, SIZE, SIZE);
            });
            ctx.fill();
            
        }

        var running = false;
        var steps = 0;

        function clean(cells) {
            foreach_cell(current, function(cells, i, j) {

                if (edge_alive && (i == 0 || j == 0 || i == HEIGHT - 1 || j == WIDTH - 1)) {
                    next[i][j] = true;
                    return;
                }

                var count = 0;
                for (var k = Math.max(0, i-1); k < Math.min(HEIGHT, i+2); ++k) {
                    for (var l = Math.max(0, j-1); l < Math.min(WIDTH, j+2); ++l) {
                        if (!(k==i&&l==j)) {
                            if(cells[k][l]) {
                                ++count;
                            }
                        }
                    }
                }

                if (count > 5) {
                    cells[i][j] = true;
                }
                if (count < 2) {
                    cells[i][j] = false;
                }
            });
        }

        function flood(id, ids, cells, i, j, group) {

            var stack = [{i: i, j: j}];

            while (stack.length > 0) {
                var current = stack.pop();
                i = current.i;
                j = current.j;

                for (var k = Math.max(0, i-1); k < Math.min(HEIGHT, i+2); ++k) {
                    for (var l = Math.max(0, j-1); l < Math.min(WIDTH, j+2); ++l) {
                        if (!(k==i&&l==j) && (k==i||l==j)) {
                            if (!cells[k][l] && !ids[k][l]) {
                                ids[k][l] = id;
                                group.push({i: k, j: l});
                                stack.push({i: k, j: l});
                            }
                        }
                    }
                }

            }
            return group;
        }

        function find_biggest(cells) {
            var ids = mkcells();
            var id = 1;
            var groups = [];
            foreach_cell(cells, function(cells, i, j) {
                if (!cells[i][j] && !ids[i][j]) {
                    groups.push(flood(id, ids, cells, i, j, [{i: i, j: j}]));
                    ++id;
                }
            });

            var max_idx = 0;
            var max_size = groups[0].length;

            for (var i = 1; i < groups.length; ++i) {
                var group = groups[i];
                if (group.length > max_size) {
                    max_size = group.length;
                    max_idx = i;
                }
            }

            for (var i = 0; i < groups.length; ++i) {
                if (i != max_idx) {
                    for (var j = 0; j < groups[i].length; ++j) {
                        var coords = groups[i][j];
                        cells[coords.i][coords.j] = true;
                    }
                }
            }

        }

        function tick() {

            if (complete && steps == 4) {

                setTimeout(function() {
                    clean(current);
                    draw(current);
                    setTimeout(function() {
                        find_biggest(current);
                        draw(current);
                        setTimeout(function() {
                            init();
                            steps = 0;
                            tick();
                        }, 2000);
                    }, 1000);
                }, 1000);

                return;
            }

            if (running) {
                diff_count = progress(current, next, rules);
                if (diff_count == 0) {
                    init();
                }
                draw(current);
                ++steps;
                setTimeout(tick, 200);
            }
        }

        function stop() {
            running = false;
        }
        function start() {
            running = true;
            tick();
        }

        function toggle() {
            if (running) {
                stop();
            } else {
                start();
            }
        }

        init();
        draw(current);
    }
})
