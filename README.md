Dividends Buy Stuff
===================

This is exploration using of [Ramda](http://ramda.github.io/ramdocs/docs/) and [Q](https://github.com/kriskowal/q) to solve a problem I made up.

The problem is to pick some consumer products, and figure out how much to invest in shares of the manufacturer for ~1 year of dividends to cover the cost of buying the product (instead of more shares). For example, how much would I invest in KO (The Coca-Cola Company) for ~1 year of dividends to cover a can of Coke?

* There are asynchronous calls to the Yahoo Finance API which is an excuse to use Q
* This could be solved in a functional-ish style using Ramda, so why not?
