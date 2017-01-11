const Map = require('immutable').Map
const expect = require('chai').expect
const ctw = require('./ctw')
const AssertionError = require('assert').AssertionError

describe('kt', () => {
    it('should match an example from the paper', () => {
        expect(ctw.kt(4, 3)).to.equal(5/2048)
    })

    it('matches examples from the table in doc/', () => {
        expect(ctw.kt(1, 1)).to.equal(1/8)
        expect(ctw.kt(0, 1)).to.equal(1/2)
        expect(ctw.kt(1, 0)).to.equal(1/2)
        expect(ctw.kt(2, 5)).to.equal(9/2048)
    })
    
    it('should not recurse forever if given weird arguments', () => {
        expect(() => {
            ctw.kt('a monkey', undefined)
        }).to.not.throw(RangeError)
    })
})

describe('Tree', () => {
    describe('increment', () => {
        it('works twice so 1 + 1 = 2', () => {
            const empty = new ctw.Tree(3)
            const first = empty.increment('010', '0')
            const second = first.increment('010', '0')
            expect(second.count('010', '0')).to.equal(2)
        })
    })

    describe('_elementary_count', () => {
        it('returns zeroes for missing contexts', () => {
            const tree = new ctw.Tree(3)
            expect(tree._elementary_count('010', '0')).to.equal(0)
        })
        it('complains if asked about a non-leaf context', () => {
            let tree = new ctw.Tree(3)
            expect(() => {
                tree._elementary_count('00000', '0')
            }).to.throw(AssertionError)
        })
    })

    describe('count', () => {
        it('works recursively', () => {
            let tree = new ctw.Tree(3)
            tree = tree.increment('100', '1')
            tree = tree.increment('000', '1')
            expect(tree.count('00', '1')).to.equal(2)
        })
    })

    describe('children', () => {
        it('expands context strings by prepending them with 0 and 1', () => {
            const tree = new ctw.Tree(5)
            expect(tree.children('1001')).to.deep.equal(['01001', '11001'])
        })

        it('complains if the children would be too long', () => {
            const tree = new ctw.Tree(4)
            expect(() => {
                tree.children('1001')
            }).to.throw(AssertionError)
        })
    })
})

describe('scan', () => {
    it('makes a generator that goes over context-observation pairs', () => {
        let generator = ctw.scan('abc', 'def')
        let actual = Array.from(generator)
        expect(actual).to.deep.equal([
            ['abc', 'd'],
            ['bcd', 'e'],
            ['cde', 'f']
        ])
    })
})

describe('final_tree', () => {
    it('counts the 0s and 1s for every context', () => {
        let tree = ctw.final_tree('000', '0011')
        expect(tree.count('000', '0')).to.equal(2)
        expect(tree.count('000', '1')).to.equal(1)
        expect(tree.count('001', '0')).to.equal(0)
        expect(tree.count('001', '1')).to.equal(1)
    })

    it('returns a tree with a depth the size of the pre-string context', () => {
        let tree = ctw.final_tree('0010', '01001')
        expect(tree.max_depth).to.equal(4)
    })
})

describe('node_p', () => {
    it('computes correctly for leaves', () => {
        let tree = ctw.final_tree('000', '111')
        expect(ctw.node_p(tree, '000')).to.equal(1/2)
    })

    it('works on the minimal example that requires recursion', () => {
        let tree = ctw.final_tree('0' + '0', 1)
        expect(ctw.node_p(tree, '')).to.equal(1/2)
    })

    it('matches a long-winded hand calculation', () => {
        let tree = ctw.final_tree('00', '110')
        // Contexts and observations are the following: 00>1, 01>1, 11>0
        // So let's look at the leaf nodes and compute their weighted p.:
        // pw(00) = kt(0, 1) = 1/2
        // pw(10) = kt(0, 0) = 1
        // pw(01) = kt(0, 1) = 1/2
        // pw(11) = kt(1, 0) = 1/2
        // Now let's look at the middle layer of the tree:
        // pw(0) = 1/2 kt(0, 1) + 1/2 pw(00) * pw(10)
        //       = 1/2 * 1/2 + 1/2 * 1/2 * 1 = 1/2
        // pw(1) = 1/2 kt(1, 1) + 1/2 pw(11) * pw(01)
        //       = 1/2 * 1/8 + 1/2 * 1/2 * 1/2 = 3/16
        // And finally for the root:
        // pw(ε) = 1/2 kt(1, 2) + 1/2 pw(0) * pw(1)
        //       = 1/2 * 1/16 + 1/2 * 1/2 * 3/16
        expect(ctw.node_p(tree, '')).to.equal(5/64)
    })

    it('matches an example from the paper', () => {
        let tree = ctw.final_tree('010', '0110100')
        expect(ctw.node_p(tree, '0')).to.equal(11/256)
    })
})