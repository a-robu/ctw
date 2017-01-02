const assert = require('assert')
const Map = require('immutable').Map
const List = require('immutable').List
const sum = require('compute-sum')
const memoizee = require('memoizee')

function empty_tree(max_depth) {
    return Map({
        max_depth: max_depth,
        counts: Map()
    })
}

/** Computes the Krichevsky–Trofimov estimator */
function kt (a, b) {
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
}
kt = memoizee(kt)

/** Scans the string and yields all pairs of [context, observation] */
function* scan(to_compress, max_depth) {
    let to_observe = max_depth
    while (to_observe < to_compress.length) {
        yield [
            to_compress.slice(to_observe - max_depth, to_observe),
            to_compress[to_observe]
        ]
        ++to_observe
    }
}

/** Builds the tree of observation counts for the given string. */
function compile_tree(string, max_depth) {
    let tree = empty_tree(max_depth)
    for (let [context, observation] of scan(string, max_depth)) {
        tree = increment(tree, context, observation)
    }
    return tree
}

function weighted(counts, context, max_depth) {} 

/** Returns the children of a context */
function children(context) {
    // TODO maybe this should take a max_depth argument
    // so it can... asssert that the children are still in the tree?
    return ['0' + context, '1' + context]
}

function increment(tree, context, observation) {
    return tree.setIn(['counts', context, observation], 
        elementary_count(tree, context, observation) + 1
    )
}

function elementary_count(tree, context, observation) {
    assert(context.length == tree.max_depth)
    return tree.getIn(['counts', context, observation], 0)
}

function combined_count(tree, context, observation) {
    if (context.length == tree.max_depth) {
        return elementary_count(tree, context, observation)
    }
    // FIXME context.length > max_depth comparison broken?
    assert(context.length <= tree.max_depth)
    return sum(children(context).map(ctx => {
        return combined_count(tree, ctx, observation, max_depth)
    }))
}

module.exports.kt = kt
module.exports.empty_tree = empty_tree
module.exports.increment = increment
module.exports.scan = scan
module.exports.compile_tree = compile_tree
module.exports.elementary_count = elementary_count
module.exports.combined_count = combined_count
module.exports.children = children