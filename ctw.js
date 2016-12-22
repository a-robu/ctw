const memoizee = require('memoizee')
const Map = require('immutable').Map
const List = require('immutable').List

const EMPTY_COUNTS = Map()

/**
 * Computes the Krichevsky–Trofimov estimator
 */
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

/**
 * To yields pairs of [context, observation]
 */
function* all_pairs(to_compress, depth) {
    let to_observe = depth
    while (to_observe < to_compress.length) {
        yield [
            to_compress.slice(to_observe - depth, to_observe),
            to_compress[to_observe]
        ]
        ++to_observe
    }
}

/**
 * Counts 1s and 0s for every context up to a certain depth.
 */
function scan(string, depth) {
    let counts = EMPTY_COUNTS
    for (let [context, observation] of all_pairs(string, depth)) {
        counts = increment(counts, context, observation)
    }
    return counts
}

function weighted(counts, context, depth) {} 

function children(counts, context, depth) {}

function increment(counts, context, observation) {
    return counts.setIn([context, observation], 
        get_count(counts, context, observation) + 1
    )
}

function get_count(counts, context, observation) {
    return counts.getIn([context, observation], 0)
}

module.exports.kt = kt
module.exports.increment = increment
module.exports.all_pairs = all_pairs
module.exports.scan = scan
module.exports.get_count = get_count
module.exports.EMPTY_COUNTS = EMPTY_COUNTS