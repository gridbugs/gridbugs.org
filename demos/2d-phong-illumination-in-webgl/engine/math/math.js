Math.between_inclusive = function(a, b, c) {
    return (a <= b && b <= c) || (a >= b && b >= c);
}
Math.between_left_inclusive = function(a, b, c) {
    return (a <= b && b < c) || (a >= b && b > c);
}
Math.between_inclusive_inclusive = function(a, b, c) {
    return (a < b && b <= c) || (a > b && b >= c);
}
Math.between_exclusive = function(a, b, c) {
    return (a < b && b < c) || (a > b && b > c);
}
