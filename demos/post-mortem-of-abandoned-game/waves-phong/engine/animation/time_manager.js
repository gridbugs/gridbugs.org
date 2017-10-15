function TimeManager() {
    this.last_time = Date.now();
    this.last_rate = 0;
}
TimeManager.prototype.get_delta = function() {
    var curr_time = Date.now();
    this.last_delta = curr_time - this.last_time;
    this.last_time = curr_time;
    if (this.last_delta != 0) {
        this.last_rate = 1000/this.last_delta;
    }
    return this.last_delta;
}
