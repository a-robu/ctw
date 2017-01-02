const memoizee = require('memoizee')
const Map = require('immutable').Map
const List = require('immutable').List
const sum = require('compute-sum')

/** We store counts in a nested map[context][observation] */
const EMPTY_COUNTS = Map()

/** Computes the Krichevsky–Trofimov estimator */
const kt = memoizee(function (a, b) {
    if (a == 0 && b == 0) {
        return 1
    }
    if (a == 0) {
        // We take P(m, n + 1) = P(m, n) * (n + 1/2) / (m + n + 1) and
        // we set m = 0 and rewrite with b = n + 1, n = b - 1.
        return kt(0, b - 1) * (b - 1 / 2) / b
    }
    // We take P(m + 1, n) = P(m, n) * (m + 1/2) / (m + n + 1)
    // and we rewrite with a = m + 1, m = a - 1 and n = b.
    return kt(a - 1, b) * (a - 1 / 2) / (a + b)
})

/** Scans the string and yields all pairs of [context, observation] */
function* all_pairs(to_compress, max_depth) {
    let to_observe = max_depth
    while (to_observe < to_compress.length) {
        yield [
            to_compress.slice(to_observe - max_depth, to_observe),
            to_compress[to_observe]
        ]
        ++to_observe
    }
}

/** Counts 1s and 0s for every context up to a certain max_depth. */
function scan(string, max_depth) {
    let counts = EMPTY_COUNTS
    for (let [context, observation] of all_pairs(string, max_depth)) {
        counts = increment(counts, context, observation)
    }
    return counts
}

function weighted(counts, context, max_depth) {} 

/** Returns the children of a context */
function children(context) {
    //TODO maybe this should take a max_depth argument
    // so it can... asssert that the children are still in the tree?
    return ['0' + context, '1' + context]
}

function increment(counts, context, observation) {
    return counts.setIn([context, observation], 
        base_count(counts, context, observation) + 1
    )
}

function base_count(counts, context, observation) {
    return counts.getIn([context, observation], 0)
    
}

function node_count(counts, context, observation, max_depth) {
    if (context.length == max_depth) {
        return base_count(counts, context, observation)
    }
    // FIXME context.length > max_depth comparison broken?
    if (context.length > max_depth) {
        throw Error('Context outside tree depth.')
    }
    return sum(children(context).map(ctx => {
        return node_count(counts, ctx, observation, max_depth)
    }))
}

module.exports.kt = kt
module.exports.increment = increment
module.exports.all_pairs = all_pairs
module.exports.scan = scan
module.exports.base_count = base_count
module.exports.node_count = node_count
module.exports.children = children
module.exports.EMPTY_COUNTS = EMPTY_COUNTS