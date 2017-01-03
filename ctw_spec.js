const Map = require('immutable').Map
const expect = require('chai').expect
const ctw = require('./ctw')
const AssertionError = require('assert').AssertionError

describe('kt', () => {
    it('should match an example', () => {
        // A table of examples is in the doc/ directory.
        expect(ctw.kt(4, 2)).to.equal(7/1024)
    })
    
    it('should not recurse forever if given weird arguments', () => {
        expect(() => {
            ctw.kt('a monkey', undefined)
        }).to.not.throw(RangeError)
    })
})

describe('increment', () => {
    it('works twice so 1 + 1 = 2', () => {
        const empty = new ctw.Tree(3)
        const first = empty.increment('010', '0')
        const second = first.increment('010', '0')
        expect(second.count('010', '0')).to.equal(2)
    })
})

describe('scan', () => {
    it('makes a generator that goes over context-observation pairs', () => {
        let generator = ctw.scan('abcdef', 3)
        let actual = Array.from(generator)
        expect(actual).to.deep.equal([
            ['abc', 'd'],
            ['bcd', 'e'],
            ['cde', 'f']
        ])
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

describe('compile_tree', () => {
    it('counts the 0s and 1s for every context', () => {
        let sample = '0000011'
        let actual = ctw.compile_tree(sample, 3)
        expect(actual.count('000', '0')).to.equal(2)
        expect(actual.count('000', '1')).to.equal(1)
        expect(actual.count('001', '0')).to.equal(0)
        expect(actual.count('001', '1')).to.equal(1)
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

describe('zeroes_and_ones', () => {
    it('returns [0, 0] for the empty string', () => {
        let actual = ctw.zeroes_and_ones('')
        expect(actual).to.deep.equal([0, 0])
    })
})

describe('string_p', () => {
    it('matches examples from the paper', () => {
        expect(ctw.string_p('0110')).to.equal(3/128)
        expect(ctw.string_p('001')).to.equal(1/16)
    })
    
    it('returns 1 for the empty string', () => {
        expect(ctw.string_p('')).to.equal(1)
    })
})

describe('node_p', () => {
    it('matches the example from the paper', () => {
        let sample = '010' + '0110100'
        let tree = ctw.compile_tree(sample, 3)
        expect(ctw.node_p(tree, '0')).to.equal(11/256)
    })
})