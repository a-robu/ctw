const Map = require('immutable').Map
const expect = require('chai').expect
var chaiImmutable = require('chai-immutable');
require('chai').use(chaiImmutable);
const ctw = require('./ctw')

describe('kt', () => {
    it('should match an example', () => {
        // A table of examples is in the doc directory.
        expect(ctw.kt(4, 2)).to.equal(7/1024)
    })
})

describe('increment', () => {
    it('works twice so 1 + 1 = 2', () => {
        let first = ctw.increment(ctw.EMPTY_TREE, '010', '0')
        let second = ctw.increment(first, '010', '0')
        expect(ctw.get_counts('010', '0')).to.equal(2)
    })
})

describe('iterate_contexts', () => {
    it('makes a generator that goes over context-observation pairs', () => {
        let generator = ctw.all_pairs('abcdef', 3)
        let actual = Array.from(generator)
        expect(actual).to.deep.equal([
            ['abc', 'd'],
            ['bcd', 'e'],
            ['cde', 'f']
        ])
    })
})

describe('get_counts', () => {
    it('returns zeroes as counts for missing contexts', () => {
        expect(ctw.get_counts(ctw.EMPTY_TREE, '010')).to.equal(ctw.EMPTY_COUNTS)
    })
})

describe('scan', () => {
    it('counts the 0s and 1s for every context', () => {
        let sample = '1011111'
        let actual = ctw.scan(sample, 3)
        let expected = Map({
            "101": Map({0: 0, 1: 1}),
            "111": Map({0: 0, 1: 2}),
            "011": Map({0: 0, 1: 1})
        })
        expect(actual).to.equal(expected)
    })
})