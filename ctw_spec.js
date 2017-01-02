const Map = require('immutable').Map
const expect = require('chai').expect
const ctw = require('./ctw')

describe('kt', () => {
    it('should match an example', () => {
        // A table of examples is in the doc/ directory.
        expect(ctw.kt(4, 2)).to.equal(7/1024)
    })
})

describe('increment', () => {
    it('works twice so 1 + 1 = 2', () => {
        let first = ctw.increment(ctw.empty_tree(3), '010', '0')
        let second = ctw.increment(first, '010', '0')
        expect(ctw.elementary_count(second, '010', '0')).to.equal(2)
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

describe('elementary_count', () => {
    it('returns zeroes for missing contexts', () => {
        expect(ctw.elementary_count(ctw.empty_tree(3), '010', '0')).to.equal(0)
    })
    it('complains if asked about a non-leaf context', () => {
        let tree = ctw.empty_tree(3)
        expect(ctw.elementary_count(tree, '00000', '0')).to.throw()
    })
})

xdescribe('combined_count', () => {
    it('works recursively', () => {
        let tree = ctw.empty_tree(3)
        tree = ctw.increment(tree, '100', '1')
        tree = ctw.increment(tree, '000', '1')
        expect(ctw.combined_count(tree, '00', '1')).to.equal(2)
    })
})

describe('compile_tree', () => {
    it('counts the 0s and 1s for every context', () => {
        let sample = '0000011'
        let actual = ctw.compile_tree(sample, 3)
        expect(ctw.elementary_count(actual, '000', '0')).to.equal(2)
        expect(ctw.elementary_count(actual, '000', '1')).to.equal(1)
        expect(ctw.elementary_count(actual, '001', '0')).to.equal(0)
        expect(ctw.elementary_count(actual, '001', '1')).to.equal(1)
    })
})

describe('children', () => {
    it('expands context strings by prepending them with 0 and 1', () => {
        expect(ctw.children('1001')).to.deep.equal(['01001', '11001'])
    })
})