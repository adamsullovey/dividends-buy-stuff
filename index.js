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
	request = require('request'),
	util = require('util');

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
 * Here are the helper functions for processing the data
 * Each function should handle one small task
 * and add or remove properties from the 'data' parameter
 */

var getStockDividendHistory = function (data) {

	var options = {
		url: 'https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.dividendhistory%20where%20symbol%20%3D%20%22' + data.ticker + '%22%20and%20startDate%20%3D%20%221962-01-01%22%20and%20endDate%20%3D%20%222013-12-31%22&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=',
		json: true
	};

	var deferred = Q.defer();

	request(options, function (error, response, body) {

		if (error) {
			deferred.reject(error);
		} else {
			try {
				data.dividendHistory = body.query.results.quote;
				deferred.resolve(data);
			} catch (e) {
				deferred.reject('error getting dividend history for ' + data.ticker + ' ' + e);
			}
		}

	});

	return deferred.promise;

};

var getYearOfDividends = function (data) {

	/*
	 * Yahoo returns values as strings, but I want to do math!
	 * This does an OK job converting strings to numbers
	 * parseInt and Math rounding functions are not appropriate for this
	 */
	function stringToNumber(value) {
		return value * 1;
	}

	/*
	 * assume dividends issued quarterly (4 times a year)
	 *
	 * read code from the bottom up, or this comment top down:
	 * take first 4 elements of array
	 * pluck the 'Dividends' property (ditch all other info)
	 * convert the strings like '0.2444' to numbers
	 * add up all the numbers
	 *
	 */

	var dividendValue = R.sum(
		R.map(stringToNumber,
			R.pluck('Dividends')(
				R.slice(0, 4)(data.dividendHistory))));


	var dividendInfo = {
		value: dividendValue,
		startDate: new Date(data.dividendHistory[3].Date),
		endDate: new Date(data.dividendHistory[0].Date),
		startDateString: data.dividendHistory[3].Date,
		endDateString: data.dividendHistory[0].Date
	};

	// TODO - buy date should be a day before startDate. You need to own the stock to get the dividend

	data.yearlyDividendInfo = dividendInfo;

	return data;


};

var getStockInfoAtDate = function (data) {

	var options = {
		url: util.format('https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.historicaldata%20where%20symbol%20%3D%20%22%s%22%20and%20startDate%20%3D%20%22%s%22%20and%20endDate%20%3D%20%22%s%22&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=', data.ticker, data.yearlyDividendInfo.startDateString, data.yearlyDividendInfo.startDateString),
		json: true
	};

	var deferred = Q.defer();

	request(options, function (error, response, body) {

		if (error) {
			deferred.reject(error);
		} else {
			try {
				data.stockInfoAtDate = body.query.results.quote;
				deferred.resolve(data);
			} catch (e) {
				deferred.reject('error getting stock info for ' + data.ticker + ' ' + e);
			}
		}

	});

	return deferred.promise;

};

var getLastTradePrice = function (data) {

	// TODO - could I use this to get a bunch of current prices in parallel to show growth?
	// https://developer.yahoo.com/yql/console/?q=show%20tables&env=store://datatables.org/alltableswithkeys#h=select+*+from+yahoo.finance.quote+where+symbol+in(%22YHOO%22%2C%22AAPL%22%2C%22GOOG%22%2C%22MSFT%22)

};

var calculateShareOwnership = function (data) {

	var sharesNeeded = Math.ceil(data.goodsPrice / data.yearlyDividendInfo.value);

	var ownershipInfo = {
		sharesNeeded: sharesNeeded,
		purchaseCostOfShares: sharesNeeded * data.stockInfoAtDate.Low
	};

	data.ownershipInfo = ownershipInfo;

	return data;

};

var niceOutput = function (data) {

	var copy = "To buy %s for $%d with ~1 year of dividends, you could have bought %d shares of %s on %s for $%d";
	copy = util.format(copy, data.goodsName, data.goodsPrice, data.ownershipInfo.sharesNeeded, data.ticker, data.yearlyDividendInfo.startDateString, data.ownershipInfo.purchaseCostOfShares);

	data.niceOutput = copy;

	return data;

};

/*
 * Time for pPipe!
 * This composes 1 function out of the many helper functions
 * http://ramda.github.io/ramdocs/docs/R.html#pPipe
 */

var pipedFunctions = R.pPipe(getStockDividendHistory, getYearOfDividends, getStockInfoAtDate, calculateShareOwnership, niceOutput);

/*
 * Start processing each item in parallel, and save the promise returned by pipedFunctions
 */
var promises = R.map(function (data) {
	return pipedFunctions(data);
}, desiredProducts);

/*
 * Node is now working away making API calls and doing math and stuff
 * Prepare to handle the promises eventually resolving now
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
 * the error call back is used if something in the .then function throws an error
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