# ctw
Implementation of the Context Tree Weighting algorithm.

## Krichevsky–Trofimov estimator
We compute the KT estimator with the recursive function shown on 
[wikipedia](https://en.wikipedia.org/w/index.php?title=Krichevsky%E2%80%93Trofimov_estimator&oldid=753863516).
![wikipedia-function](doc/kt-recursive-wikipedia.png)

We test the implementation against examples from 
Data Compression: The Complete Reference.
![textbook-examples](doc/kt-table-david-salomon-data-compression.png)

## To improve
We're computing the KT estimate with a recursive function.
A memoized recursive function might not be the best
way to compute these values. The cache could grow very
large (or very sparse if the library throws our results).
A better way might be to update the probabilities in
the counts directly the way other libraries to it.