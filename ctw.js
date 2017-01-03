const assert = require('assert')
const Immutable = require('immutable')
const Map = require('immutable').Map
const List = require('immutable').List
const sum = require('compute-sum')
const memoizee = require('memoizee')

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

/** Computes the Krichevsky–Trofimov estimator */
function kt(a, b) {
    if (a == 0 && b == 0) {
        return 1
    }
    if (a == 0) {
        // We take P(m, n + 1) = P(m, n) * (n + 1/2) / (m + n + 1) then
        // we set m = 0 and rewrite with b = n + 1, n = b - 1.
        return kt(0, b - 1) * (b - 1 / 2) / b
    }
    // We take P(m + 1, n) = P(m, n) * (m + 1/2) / (m + n + 1)
    // then we rewrite with a = m + 1, m = a - 1 and n = b.
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
    let tree = new Tree(max_depth)
    for (let [context, observation] of scan(string, max_depth)) {
        tree = tree.increment(context, observation)
    }
    return tree
}

function weighted(counts, context, max_depth) {} 



function increment(tree, context, observation) {
    return tree.setIn(['counts', context, observation], 
        elementary_count(tree, context, observation) + 1
    )
}


module.exports.kt = kt
module.exports.Tree = Tree
module.exports.increment = increment
module.exports.scan = scan
module.exports.compile_tree = compile_tree