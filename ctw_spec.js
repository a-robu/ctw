const Map = require('immutable').Map
const expect = require('chai').expect
const ctw = require('./ctw')
const AssertionError = require('assert').AssertionError

describe('last_chars', () => {
    it('works for an example', () => {
        expect(ctw.last_chars('123456', 3)).to.equal('456')
    })
})

describe('first_chars', () => {
    it('works for an example', () => {
        expect(ctw.first_chars('abcdefghijk', 3)).to.equal('abc')
    })
})

describe('last_item', () => {
    it('works on a list', () => {
        expect(ctw.last_item(['a', 'b', 'c'])).to.equal('c')
    })

    it('works on a generator', () => {
        let generator = function* () {
            yield 'x'; yield 'y'; yield 'z';
        }
        expect(ctw.last_item(generator())).to.equal('z')
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

describe('node_p', () => {
    it('computes correctly for leaves', () => {
        let tree = new ctw.Predictor('000' + '111', 3).tree
        expect(ctw.node_p(tree, '000')).to.equal(1/2)
    })

    it('works on the minimal example that requires recursion', () => {
        let tree = new ctw.Predictor('0' + '0', 1).tree
        expect(ctw.node_p(tree, '')).to.equal(1/2)
    })

    it('matches a long-winded hand calculation', () => {
        let tree = new ctw.Predictor('00' + '110', 2).tree
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
        let tree = new ctw.Predictor('010' + '0110100', 3).tree
        expect(ctw.node_p(tree, '0')).to.equal(11/256)
    })
})

describe('tree_p', () => {
    it('works on tiny examples', () => {
        let small_tree = new ctw.Predictor('0' + '0', 1).tree
        let bigger_tree = new ctw.Predictor('0' + '00', 1).tree
        expect(ctw.tree_p(small_tree)).to.equal(1/2)
        expect(ctw.tree_p(bigger_tree)).to.equal(3/8)
    })
})

describe('Predictor', () => {
    describe('.predict', () => {
        it('works on a tiny example', () => {
            let predictor = new ctw.Predictor('00', 1)
            expect(predictor.predict('0')).to.equal((3/8) / (1/2))
        })
        xit('works on a non-binary alphabet', () => {
            let predictor = new ctw.Predictor('abcabcabc', 1)
            // expect(predictor.predict('a')).to.be.above(0.5)
        })
    })

    describe('.construct', () => {
        it('produces a empty tree in base case', () => {
            let predictor = new ctw.Predictor('0', 1)
            expect(predictor.tree.equals(new ctw.Tree(1))).to.be.true
        })

        it('builds the correct tree for longer strings', () => {
            let tree = new ctw.Predictor('000' + '111', 3).tree
            expect(tree.count('000', '1')).to.equal(1)
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

    describe('.read', () => {
        it('returns the next predictor after reading an observation', () => {
            const predictor = new ctw.Predictor('0', 1)
            const new_pred = predictor.read('1')
            expect(new_pred.tree.count('0', '1')).to.equal(1)
        })
    })

    describe('.all_predictors', () => {
        it('yields all predictors as it scans the string', () => {
            const actual = Array.from(ctw.Predictor.all_predictors('001', 1))
            const first = new ctw.Predictor('0', 1)
            const second = first.read('0')
            const third = second.read('1')
            expect(actual.length).to.equal(3)
            expect(actual[0].equals(first)).to.be.true
            expect(actual[1].equals(second)).to.be.true
            expect(actual[2].equals(third)).to.be.true
        })
    })

    describe('.equals', () => {
        it("returns true if they're the same", () => {
            const first = new ctw.Predictor('001010101010', 3)
            const second = new ctw.Predictor('001010101010', 3)
            expect(first.equals(second)).to.be.true
        })

        it('returns false if the depth is different', () => {
            const first = new ctw.Predictor('001', 3)
            const second = new ctw.Predictor('001', 2)
            expect(first.equals(second)).to.be.false
        })

        it('returns false if the history is different', () => {
            const first = new ctw.Predictor('00100', 3)
            const second = new ctw.Predictor('11100', 3)
            expect(first.equals(second)).to.be.false
        })
    })
})