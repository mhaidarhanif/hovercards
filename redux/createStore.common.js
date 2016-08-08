var _               = require('underscore');
var applyMiddleware = require('redux').applyMiddleware;
var combineReducers = require('redux').combineReducers;
var createStore     = require('redux').createStore;
var thunkMiddlware  = require('redux-thunk').default;

var actions = require('./actions');
var browser = require('../extension/browser');
var report  = require('../report');

createStore = applyMiddleware(thunkMiddlware)(createStore);

module.exports = function(reducers, initialState) {
	var store = createStore(combineReducers(reducers), initialState);

	if (!process.env.NODE_ENV) {
		require('./storelistener')(store);
	}

	_.each(reducers, function(reducer) {
		if (!_.isFunction(reducer.attachStore)) {
			return;
		}
		reducer.attachStore(store);
	});

	browser.runtime.onMessage.addListener(function(actionAsPromise, sender, sendResponse) {
		actionAsPromise
			.then(function(action) {
				return store.dispatch(actions[action.type](action.payload, action.meta, sender));
			})
			.then(sendResponse)
			.catch(report.error);

		return true;
	});

	return store;
};
