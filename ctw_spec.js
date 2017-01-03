const Map = require('immutable').Map
const expect = require('chai').expect
const ctw = require('./ctw')
const AssertionError = require('assert').AssertionError

describe('kt', () => {
    it('should match an example', () => {
        // A table of examples is in the doc/ directory.
        expect(ctw.kt(4, 2)).to.equal(7/1024)
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