var Q = require('q'),
	R = require('ramda'),
	request = require('request'),
	util = require('util');

var stocks = [{
	ticker: 'WB.TO',
	goodsPrice: 2000,
	goodsName: "Whistler Blackcomb Season's pass"
}, {
	ticker: 'AAPL',
	goodsPrice: 649.00,
	goodsName: 'unlocked iPhone 6'
}];

var getStockDividendHistory = function (data) {

	var options = {
		url: 'https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.dividendhistory%20where%20symbol%20%3D%20%22' + data.ticker + '%22%20and%20startDate%20%3D%20%221962-01-01%22%20and%20endDate%20%3D%20%222013-12-31%22&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=',
		json: true
	};

	var deferred = Q.defer();

	request(options, function (error, response, body) {
		console.log(body.query.results.quote);

		if (error) {
			deferred.reject(error);
		} else {
			data.dividendHistory = body.query.results.quote;
			deferred.resolve(data);
		}

	});

	return deferred.promise;

};

var getYearOfDividends = function (data) {

	// assume dividends issued quarterly
	// 4 dividends in 1 year

	function stringToNumber(value) {
		return value * 1;
	}



	/*
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
			data.stockInfoAtDate = body.query.results.quote;
			deferred.resolve(data);
		}

	});

	return deferred.promise;

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

	var copy = "To buy %s at $%d, you could have bought %d shares of %s on %s for $%d";
	copy = util.format(copy, data.goodsName, data.goodsPrice, data.ownershipInfo.sharesNeeded, data.ticker, data.yearlyDividendInfo.startDateString, data.ownershipInfo.purchaseCostOfShares);

	data.niceOutput = copy;

	return data;

};

var data = stocks[0];

/*
getStockDividendHistory(data)
	.then(getStockInfoAtDate)
	.then(function (value) {
		console.log(value);
	});
*/

var pipedFunctions = R.pPipe(getStockDividendHistory, getYearOfDividends, getStockInfoAtDate, calculateShareOwnership, niceOutput);

pipedFunctions(data).then(function (value) {
	console.log('done!', value);
}).then(null, function (error) {
	console.log('error woo', error);
});

/*
1. Start with

{
ticker:"WB",
goodsPrice:2000,
goodsName: "Season's pass"
}
*/
/*
2. Get dividends from most recent dividend to 365 days earlier (1 year's worth) and attach that to the object being worked with

https://developer.yahoo.com/yql/console/?q=show%20tables&env=store://datatables.org/alltableswithkeys#h=select+*+from+yahoo.finance.dividendhistory+where+symbol+%3D+%22KO%22+and+startDate+%3D+%221962-01-01%22+and+endDate+%3D+%222013-12-31%22
*/

/*
3. Get share price on date of first dividend being counted and attach that to the object being worked with
https://developer.yahoo.com/yql/console/?q=show%20tables&env=store://datatables.org/alltableswithkeys#h=select+*+from+yahoo.finance.historicaldata+where+symbol+%3D+%22YHOO%22+and+startDate+%3D+%222009-09-11%22+and+endDate+%3D+%222010-03-10%22

4. Total up dividends earned for the year, and attach that to the object

5. Divide goodsPrice by annual dividend to get # of shares needed

6. Multiply # of shares by price 365 days before last dividend to get $ of investment to cover the cost of your object

Optional
-----
7. Calculate today's value of shares just for fun

8. Timestamp the time of calculations being made

9. Delete unneeded data from the object being passed from function to function so it can be passed as JSON to frontend
*/