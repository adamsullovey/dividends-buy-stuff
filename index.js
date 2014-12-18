/*
 * This is an exploration of ramda and Q to solve a problem I made up.
 *
 * The problem is to pick some consumer products, and figure out how much to
 * invest in shares of the manufacturer for 1 year of dividends to
 * cover the cost of buying the product
 *
 * There are asynchronous calls to the Yahoo Finance API which is an excuse to use Q
 * This could be solved in a functional style using ramda, so why not?
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
	ticker: 'STX',
	goodsPrice: 59,
	goodsName: 'a 500GB Serial ATA Hard Drive'
}, {
	ticker: 'AAPL',
	goodsPrice: 649,
	goodsName: 'an unlocked Apple iPhone 6'
}, {
	ticker: 'MLHR',
	goodsPrice: 919,
	goodsName: 'a well equipped Herman Miller Aeron chair'
}, {
	ticker: 'WB.TO',
	goodsPrice: 1999,
	goodsName: "a Whistler Blackcomb 2014/2015 Season's pass"
}, {
	ticker: 'BBD-B.TO',
	goodsPrice: 5599,
	goodsName: 'a 2014 Sea-Doo SPARK personal watercraft'
}, {
	ticker: 'F',
	goodsPrice: 16810,
	goodsName: 'a 2014 Ford Focus'
}];



/*
 * Time for pPipe!
 * This composes 1 function out of the many helper functions
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
 * make 1 big promise that is resolved when all promises in the array are resolved
 * if one of those promises is rejected, then this bails out and runs the error handler immediately
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
 * make 1 big promise that is resolved when all promises in the array are resolved
 * this one will keep on chugging along even if a promise is rejected
 * it "waits for the dust to settle" instead of bailing out
 * the error callback is used if something in the .then function throws an error
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