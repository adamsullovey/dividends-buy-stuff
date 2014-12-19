Dividends Buy Stuff
===================

This is an exploration using [Ramda](http://ramda.github.io/ramdocs/docs/) and [Q](https://github.com/kriskowal/q) to solve a problem I made up.

The problem is to pick some consumer products, and figure out how much to invest in shares of the manufacturer for ~1 year of dividends to cover the cost of buying the product (instead of more shares). For example, how much would I invest in KO (The Coca-Cola Company) for ~1 year of dividends to cover a can of Coke?

* There are asynchronous calls to the Yahoo Finance API which is an excuse to use Q
* This could be solved in a functional-ish style using Ramda, so why not?

Sample Output
-------------

<pre>
One result: To buy a Whistler Blackcomb 2014/2015 Season's pass for $1999 with ~1 year of dividends, you could have bought 2049 shares of WB.TO on 2014-02-12 for $31739.010000000002       
One result: To buy 2 movie tickets, 2 drinks, and 1 popcorn at a Cineplex theatre for $27.7 with ~1 year of dividends, you could have bought 56 shares of CGX.TO on 2014-08-27 for $2276.4                                  
One result: To buy a 2014 Ford Focus for $16810 with ~1 year of dividends, you could have bought 33620 shares of F on 2014-01-29 for $511024     
One result: To buy an unlocked Apple iPhone 6 for $649 with ~1 year of dividends, you could have bought 352 shares of AAPL on 2014-02-06 for $178749.12        
One result: To buy 1 can of Coca-Cola for $1 with ~1 year of dividends, you could have bought 1 shares of KO on 2014-03-12 for $38.21                          
--------All Results--------
To buy 1 can of Coca-Cola for $1 with ~1 year of dividends, you could have bought 1 shares of KO on 2014-03-12 for $38.21
To buy 2 movie tickets, 2 drinks, and 1 popcorn at a Cineplex theatre for $27.7 with ~1 year of dividends, you could have bought 56 shares of CGX.TO on 2014-08-27 for $2276.4                   
To buy an unlocked Apple iPhone 6 for $649 with ~1 year of dividends, you could have bought 352 shares of AAPL on 2014-02-06 for $178749.12                    
To buy a Whistler Blackcomb 2014/2015 Season's pass for $1999 with ~1 year of dividends, you could have bought 2049 shares of WB.TO on 2014-02-12 for $31739.010000000002                        
To buy a 2014 Ford Focus for $16810 with ~1 year of dividends, you could have bought 33620 shares of F on 2014-01-29 for $511024
--------All Settled Results--------                            
To buy 1 can of Coca-Cola for $1 with ~1 year of dividends, you could have bought 1 shares of KO on 2014-03-12 for $38.21
To buy 2 movie tickets, 2 drinks, and 1 popcorn at a Cineplex theatre for $27.7 with ~1 year of dividends, you could have bought 56 shares of CGX.TO on 2014-08-27 for $2276.4                   
To buy an unlocked Apple iPhone 6 for $649 with ~1 year of dividends, you could have bought 352 shares of AAPL on 2014-02-06 for $178749.12                    
To buy a Whistler Blackcomb 2014/2015 Season's pass for $1999 with ~1 year of dividends, you could have bought 2049 shares of WB.TO on 2014-02-12 for $31739.010000000002                                  
To buy a 2014 Ford Focus for $16810 with ~1 year of dividends, you could have bought 33620 shares of F on 2014-01-29 for $511024
</pre>
