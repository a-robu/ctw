const memoizee = require('memoizee')

const kt = memoizee(function (a, b) {
    if (a == 0 && b == 0) {
        return 1
    }
    if (a == 0) {
        // On wikipedia, we have:
        // P(m, n + 1) = P(m, n) * (n + 1/2) / (m + n + 1).
        // We set m = 0 and rewrite with b = n + 1, n = b - 1.
        return kt(0, b - 1) * (b - 1 / 2) / b
    }
    // On wikipedia we have:
    // P(m + 1, n) = P(m, n) * (m + 1/2) / (m + n + 1).
    // We rewrite rewrite with a = m + 1, m = a - 1 and n = b.
    return kt(a - 1, b) * (a - 1 / 2) / (a + b)
})
// TODO A memoized recursive function might not be the best
// way to compute these values. The cache could grow very
// large (or very sparse if the library throws our results).
// A better way might be to update the probabilities in
// the tree directly the way other libraries to it.

module.exports.kt = kt
