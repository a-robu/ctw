const expect = require('chai').expect
const ctw = require('./ctw')

describe('kt', () => {
  it('should match an example', () => {
        // A table of examples is in the doc directory.
    expect(ctw.kt(4, 2)).to.equal(7 / 1024)
  })
})
