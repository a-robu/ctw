const assert = require('assert')
const Immutable = require('immutable')
const Map = require('immutable').Map
const List = require('immutable').List
const sum = require('compute-sum')
const memoizee = require('memoizee')
const avg = require('compute-mean')

function last_chars(str, n) {
    return str.slice(str.length - n)
}

function first_chars(str, n) {
    return str.slice(0, n)
}

function last_item(iterable) {
    let last
    for (let item of iterable) {
        last = item
    }
    return last
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

class Tree {
    constructor(max_depth, counts = Map()) {
        this._max_depth = max_depth
        this._counts = counts
        Object.freeze(this)
    }

    get max_depth() {
        return this._max_depth
    }

    equals(tree) {
        return ((this.max_depth == tree.max_depth)
            && this._counts.equals(tree._counts))
    }

    increment(context, observation) {
        assert(observation, 'observation is required')
        assert.equal(this.max_depth, context.length)
        const old_val = this._elementary_count(context, observation)
        const new_counts = this._counts.setIn([context, observation], old_val + 1)
        return new Tree(this.max_depth, new_counts)
    }

    _elementary_count(context, observation) {
        assert.equal(context.length, this.max_depth)
        return this._counts.getIn([context, observation], 0)
    }

    count(context, observation) {
        assert(observation, 'observation is required')
        if (context.length == this.max_depth) {
            return this._elementary_count(context, observation)
        }
        return sum(this.children(context).map(ctx => {
            return this.count(ctx, observation)
        }))
    }

    children(context) {
        assert(context.length < this.max_depth,
            'went too deep. no more children')
        return ['0' + context, '1' + context]
    }
}

class Predictor {
    constructor(string, max_depth, _precomputed_tree = null) {
        assert(typeof(max_depth) == 'number', 'max_depth is required')
        this.history = string
        this.max_depth = max_depth
        if (string.length == max_depth) {
            this.tree = new Tree(max_depth)
        }
        else if (_precomputed_tree ) {
            this.tree = _precomputed_tree
        }
        else {
            let all_predictors = Predictor.all_predictors(string, max_depth)
            this.tree = last_item(all_predictors).tree
        }
        assert(this.tree instanceof Tree)
        Object.freeze(this)
    }

    equals(other) {
        return ((this.max_depth == other.max_depth)
            && (this.history == other.history)
            && this.tree.equals(other.tree))
    }

    read(observation) {
        let new_history = this.history + observation
        let new_tree = this.tree.increment(this.context, observation)
        return new Predictor(new_history, this.max_depth, new_tree)
    }

    get context() {
        if (this.history.length == this.max_depth) {
            return this.history
        }
        else {
            return last_chars(this.history, this.max_depth)
        }
    }

    /** 
     * This generator yields Predictor's for each possible history.
     * In a D + N string (depth plus remaining symbols), we will
     * yield N + 1 predictors. One with only the context as the history
     * and another predictor for each remaining symbol in the string.
     * */
    static* all_predictors(string, max_depth) {
        let init_ctx = first_chars(string, max_depth)
        let predictor = new Predictor(init_ctx, max_depth)
        yield predictor
        for (let i = max_depth; i < string.length; i++) {
            predictor = predictor.read(string[i])
            yield predictor
        }
    }

    /**
     * Returns a probability or a distribution for the next observation.
     * 
     * Does this by making two joint probabilities and obtaining a
     * conditional probability from them. Basically, p(a|b) = p(a, b)/p(b).
     * @param {Tree} tree
     * @param {string} future_observation
     */
    predict(observation) {
        let future_tree = this.tree.increment(this.context, observation)
        return tree_p(future_tree) / tree_p(this.tree)
    }
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

/**
 * Returns the weighted coding distribution for the string
 * which has been processed.
 */
function tree_p(tree) {
    return node_p(tree, '')
}

exports.last_chars = last_chars
exports.first_chars = first_chars
exports.last_item = last_item
exports.kt = kt
exports.Tree = Tree
exports.Predictor = Predictor
exports.leaf_p = leaf_p
exports.node_p = node_p
exports.tree_p = tree_p