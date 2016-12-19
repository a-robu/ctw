const memoizee = require('memoizee')

function kt(a, b) {
    if (a == 0 && b == 0) {
        //This base case is nice because it allows us to write
        //the function recursively, even though the value itself
        //at kt(0, 0) is I think not very meaningful, since
        //it correspons with zero observations.
        return 1
    }
    if (a == 0) {
        //On wikipedia, we have:
        //P(m, n + 1) = P(m, n) * (n + 1/2) / (m + n + 1).
        //We set m = 0 and rewrite with b = n + 1, n = b - 1.
        return kt(0, b - 1) * (b - 1/2) / b
    }
    //On wikipedia we have:
    //P(m + 1, n) = P(m, n) * (m + 1/2) / (m + n + 1).
    //We rewrite rewrite with a = m + 1, m = a - 1 and n = b.
    return kt(a - 1, b) * (a - 1/2) / (a + b)
}
kt = memoizee(kt)

module.exports.kt = kt