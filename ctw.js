const assert = require('assert')
const Immutable = require('immutable')
const Map = require('immutable').Map
const List = require('immutable').List
const sum = require('compute-sum')
const memoizee = require('memoizee')
const avg = require('compute-mean')

class Tree {
    constructor(max_depth, counts = Map()) {
        this._max_depth = max_depth
        this._counts = counts
        Object.freeze(this)
    }

    get max_depth() {
        return this._max_depth
    }

    increment(context, observation) {
        const old_val = this._elementary_count(context, observation)
        const new_counts = this._counts.setIn([context, observation], old_val + 1)
        return new Tree(this.max_depth, new_counts)
    }

    _elementary_count(context, observation) {
        assert.equal(context.length, this.max_depth)
        return this._counts.getIn([context, observation], 0)
    }

    count(context, observation) {
        if (context.length == this.max_depth) {
            return this._elementary_count(context, observation)
        }
        return sum(this.children(context).map(ctx => {
            return this.count(ctx, observation)
        }))
    }

    children(context) {
        assert(context.length < this.max_depth, 'went too deep. no more children')
        return ['0' + context, '1' + context]
    }
}

/** Computes the Krichevsky–Trofimov estimator. */
function kt(zeroes, ones) {
    assert(zeroes >= 0 && ones >= 0, "we're expecting non-negative numbers")
    if (zeroes == 0 && ones == 0) {
        return 1
    }
    if (zeroes == 0) {
        // We take P(m, n + 1) = P(m, n) * (n + 1/2) / (m + n + 1) then
        // we set m = 0 and rewrite with ones = n + 1, n = ones - 1.
        return kt(0, ones - 1) * (ones - 1 / 2) / ones
    }
    // We take P(m + 1, n) = P(m, n) * (m + 1/2) / (m + n + 1)
    // then we rewrite with zeroes = m + 1, m = zeroes - 1 and ones = n.
    return kt(zeroes - 1, ones) * (zeroes - 1 / 2) / (zeroes + ones)
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
    let tree = new Tree(max_depth)
    for (let [context, observation] of scan(string, max_depth)) {
        tree = tree.increment(context, observation)
    }
    return tree
}

/** 
 * Computes the "estimated probability for that node" the kt for the
 * counts associated with that context.
 * @param {Tree} tree
 * @param {string} context
 */
function leaf_p(tree, context) {
    return kt(tree.count(context, '0'), tree.count(context, '1'))
}

/** Computes the weighted probability p_w(s) of the node in the tree */
function node_p(tree, context) {
    if (context.length == tree.max_depth) {
        return leaf_p(tree, context)
    }
    else {
        let [child_a, child_b] = tree.children(context)
        return avg([
            leaf_p(tree, context),
            node_p(tree, child_a) * node_p(tree, child_b)
        ])
    }
} 

exports.kt = kt
exports.Tree = Tree
exports.scan = scan
exports.compile_tree = compile_tree
exports.leaf_p = leaf_p
exports.node_p = node_p