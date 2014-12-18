/*
 * This is an exploration of ramda and Q to solve a problem I made up.
 *
 * The problem is to pick some consumer products, and figure out how much to
 * invest in shares of the manufacturer for 1 year of dividends to
 * cover the cost of buying the product (instead of more shares)
 *
 * There are asynchronous calls to the Yahoo Finance API which is an excuse to use Q
 * This could be solved in a functional-ish style using ramda, so why not?
 *
 */

var Q = require('q'),
	R = require('ramda'),
	helpers = require('./helperfunctions');

/**
 * Here be the data that will be processed
 * try changing a ticker to something fake like 'F2' to see error handling
 * and the different between Q.all and Q.allSettled
 */

var desiredProducts = [{
	ticker: 'KO',
	goodsPrice: 1,
	goodsName: '1 can of Coca-Cola'
}, {
	ticker: 'CGX.TO',
	goodsPrice: 27.7,
	goodsName: '2 movie tickets, 2 drinks, and 1 popcorn at a Cineplex theatre'
}, {
	ticker: 'AAPL',
	goodsPrice: 649,
	goodsName: 'an unlocked Apple iPhone 6'
}, {
	ticker: 'WB.TO',
	goodsPrice: 1999,
	goodsName: "a Whistler Blackcomb 2014/2015 Season's pass"
}, {
	ticker: 'F',
	goodsPrice: 16810,
	goodsName: 'a 2014 Ford Focus'
}];

/* other ideas */
/*
{
	ticker: 'BBD-B.TO',
	goodsPrice: 5599,
	goodsName: 'a 2014 Sea-Doo SPARK personal watercraft'
},
{
	ticker: 'STX',
	goodsPrice: 59,
	goodsName: 'a 500GB Seagate Serial ATA Hard Drive'
},
{
	ticker: 'MLHR',
	goodsPrice: 919,
	goodsName: 'a Herman Miller Aeron chair'
},

 */


/*
 * Time for pPipe!
 * This composes 1 function out of the many helper functions
 * Each one accepts the return value of the previous function as a parameter
 * http://ramda.github.io/ramdocs/docs/R.html#pPipe
 */

var pipedFunctions = R.pPipe(
	helpers.getStockDividendHistory, // uses a deferred object
	helpers.getYearOfDividends,
	helpers.getStockInfoAtDate, // uses a deferred object
	helpers.calculateShareOwnership,
	helpers.niceOutput
);

/*
 * Start processing each item in desiredProducts in parallel, and save the promise returned by pipedFunctions
 */
var promises = R.map(function (data) {
	return pipedFunctions(data);
}, desiredProducts);

/*
 * Node is now working away making API calls and doing math and stuff
 * Prepare to handle the promises now
 *
 *
 * Make 1 big promise that is resolved when all promises in the array are resolved
 * If one of those promises is rejected, then this bails out immediately and runs the error handler
 */

var allEncompassingPromise = Q.all(promises);

// when everything is done, write out the nice output
allEncompassingPromise.then(function (result) {
	console.log('--------All Results--------');
	R.forEach(console.log, R.pluck('niceOutput')(result));

}).then(null, function (error) {
	console.log('caught an error while resolving allEncompassingPromise:', error);
});

/*
 * Make 1 big promise that is resolved when all promises in the array are resolved
 * This one will keep on chugging along even if a promise is rejected
 * It "waits for the dust to settle" instead of bailing out
 * The error callback is used if something in the .then function throws an error
 * but not if something in the array of promises does
 */

var allEncompassingSettlingPromise = Q.allSettled(promises);

allEncompassingSettlingPromise.then(function (result) {
	console.log('--------All Settled Results--------');

	// used to extract the result of each resolved/rejected promise
	var parseResult = function (result) {
		return result.state === 'fulfilled' ? result.value.niceOutput : result.reason;
	};

	R.forEach(console.log, R.map(parseResult, result));

}).then(null, function (error) {
	console.log('caught an error while resolving allEncompassingSettlingPromise:', error);
});

/*
 * this handles each promise individually
 * there is nothing overseeing the resolution of all promises here
 */

R.forEach(function (promise) {
	promise.then(function (result) {
		console.log("One result:", result.niceOutput);
	}).then(null, function (error) {
		console.log('error processing 1 item', error);
	});

}, promises);