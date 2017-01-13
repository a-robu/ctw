const Map = require('immutable').Map
const expect = require('chai').expect
const ctw = require('./ctw')
const AssertionError = require('assert').AssertionError

describe('last_chars', () => {
    it('works for an example', () => {
        expect(ctw.last_chars('123456', 3)).to.equal('456')
    })
})

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
    describe('.increment', () => {
        it('works twice so 1 + 1 = 2', () => {
            const empty = new ctw.Tree(3)
            const first = empty.increment('010', '0')
            const second = first.increment('010', '0')
            expect(second.count('010', '0')).to.equal(2)
        })

        it("complains if you don't give it an observation", () => {
            expect(() => {
                new ctw.Tree(3).increment('0100')
            }).to.throw(AssertionError)
        })
    })

    describe('._elementary_count', () => {
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

    describe('.equals', () => {
        it('returns true if they are equal', () => {
            let one_tree = new ctw.Tree(3).increment('010', '0')
            let other_tree = new ctw.Tree(3).increment('010', '0')
            expect(one_tree.equals(other_tree)).to.be.true
        })

        it('returns false if they have different counts', () => {
            let one_tree = new ctw.Tree(3).increment('010', '0')
            let other_tree = new ctw.Tree(3).increment('011', '1')
            expect(one_tree.equals(other_tree)).to.be.false
        })
    })

    describe('.count', () => {
        it('works recursively', () => {
            let tree = new ctw.Tree(3)
            tree = tree.increment('100', '1')
            tree = tree.increment('000', '1')
            expect(tree.count('00', '1')).to.equal(2)
        })

        it('does not change the original tree', () => {
            const tree = new ctw.Tree(3)
            tree.increment('001', '0')
            expect(tree.count('001', '0')).to.equal(0)
        })
    })

    describe('.children', () => {
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

xdescribe('scan', () => {
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

xdescribe('final_tree', () => {
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

    it('basically just increments', () => {
        let incr_tree = ctw.final_tree('0', '0')
        incr_tree = incr_tree.increment('0', '0')
        let already_tree = ctw.final_tree('0', '00')
        expect(incr_tree.equals(already_tree)).to.be.true
    })
})

xdescribe('node_p', () => {
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

xdescribe('tree_p', () => {
    it('works on tiny examples', () => {
        expect(ctw.tree_p(ctw.final_tree('0', '0'))).to.equal(1/2)
        expect(ctw.tree_p(ctw.final_tree('0', '00'))).to.equal(3/8)
    })
})

describe('Predictor', () => {
    xdescribe('.predict', () => {
        it('works on a tiny example', () => {
            let predictor = new ctw.Predictor('00', 1)
            expect(predictor.predict('0')).to.equal((3/8) / (1/2))
        })
    })

    describe('.construct', () => {
        it('produces a empty tree in base case', () => {
            let predictor = new ctw.Predictor('0', 1)
            expect(predictor.tree.equals(new ctw.Tree(1))).to.be.true
        })
    })

    describe('.context', () => {
        it('returns the string in the base case', () => {
            let predictor = new ctw.Predictor('010', 3)
            expect(predictor.context).to.equal('010')
        })

        it('returns the correct context for longer strings', () => {
            let predictor = new ctw.Predictor('001001', 3)
            expect(predictor.context).to.equal('001')
        })
    })

    describe('.next', () => {
        it('returns the next predictor after reading an observation', () => {
            const predictor = new ctw.Predictor('0', 1)
            const new_pred = predictor.next('0')
            expect(new_pred.tree.count('0')).to.equal(1)
        })
    })

    describe('.all_predictors', () => {
        xit('yields all predictors as it scans the string', () => {
            const actual = Array.from(ctw.Predictor.all_predictors('001', 1))
            const first_exp = new ctw.Predictor('0', 1).read('0')
            // const second_expected = new ctw.

        })
    })
})