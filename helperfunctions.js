var Q = require('q'),
	R = require('ramda'),
	util = require('util'),
	request = require('request');


/*
 * Here are the helper functions for processing the data
 * Each function should handle one small task
 * They add or remove properties from the 'data' parameter
 * and return it or will resolve it later
 */

module.exports.getStockDividendHistory = function (data) {

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

module.exports.getYearOfDividends = function (data) {

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

module.exports.getStockInfoAtDate = function (data) {

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

module.exports.getLastTradePrice = function (data) {

	// TODO - could I use this to get a bunch of current prices in parallel to show growth?
	// https://developer.yahoo.com/yql/console/?q=show%20tables&env=store://datatables.org/alltableswithkeys#h=select+*+from+yahoo.finance.quote+where+symbol+in(%22YHOO%22%2C%22AAPL%22%2C%22GOOG%22%2C%22MSFT%22)

};

module.exports.calculateShareOwnership = function (data) {

	var sharesNeeded = Math.ceil(data.goodsPrice / data.yearlyDividendInfo.value);

	var ownershipInfo = {
		sharesNeeded: sharesNeeded,
		purchaseCostOfShares: sharesNeeded * data.stockInfoAtDate.Low
	};

	data.ownershipInfo = ownershipInfo;

	return data;

};

module.exports.niceOutput = function (data) {

	var copy = "To buy %s for $%d with ~1 year of dividends, you could have bought %d shares of %s on %s for $%d";
	copy = util.format(copy, data.goodsName, data.goodsPrice, data.ownershipInfo.sharesNeeded, data.ticker, data.yearlyDividendInfo.startDateString, data.ownershipInfo.purchaseCostOfShares);

	data.niceOutput = copy;

	return data;

};