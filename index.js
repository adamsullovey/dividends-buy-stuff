var Q = require('q'),
	request = require('request');


var stocks = [{
	ticker: 'WB.TO',
	goodsPrice: 2000,
	goodsName: "Season's pass"
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
			data.dividendhistory = body.query.results.quote;
			deferred.resolve(data);
		}

	});

	return deferred.promise;

};


var getStockValueAtDate = function (data) {

	var options = {
		url: 'https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.historicaldata%20where%20symbol%20%3D%20%22' + data.ticker + '%22%20and%20startDate%20%3D%20%222012-09-11%22%20and%20endDate%20%3D%20%222013-03-10%22&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=',
		json: true
	};

	var deferred = Q.defer();

	request(options, function (error, response, body) {
		//console.log(body.query.results);

		if (error) {
			deferred.reject(error);
		} else {
			data.priceAtDate = body.query.results.quote[0];
			deferred.resolve(data);
		}

	});

	return deferred.promise;

};

var data = stocks[0];

getStockDividendHistory(data)
	.then(getStockValueAtDate)
	.then(function (value) {
		console.log(value);
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