'use strict'

/**
 * Apply middleware
 * @param {Array} middleware
 * @param {*} data
 * @return {Promise}
 */
exports.applyMiddleware = function(middleware, data) {
	return middleware.reduce((chain, m) => {
		return chain.then(data => { return m.call(m, data) })
	}, Promise.resolve(data))
}

exports.createPromiseSequence = exports.applyMiddleware
