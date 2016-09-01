'use strict'

const mongoose = require('mongoose')
const utils    = require('./utils')

class Query extends mongoose.Query {
	constructor(...args) {
		super(...args)
		this._opType = 'read'

		// `then` causes all kinds of havoc when attempting to apply middleware.
		// Remove it to avoid all of that.
		this.then = undefined
	}

	/**
	 * Execute the query. Calling both `before` and `after` middleware.
	 * @return {Promise}
	 */
	exec(op, cb) {
		// When using `query.populate`, mongoose will internally force `exec`
		// to use a callback; This casues the middleware to break when.
		// Avoid this by applying the `before` middleware and callwing `exec`
		// with the callback. This sacrifices `after` middleware, but currently
		// there is no way around this.
		// Another side effect of this is that failures in the middleware get
		// swallowed up and cannot propgate up.
		if (cb || typeof op === 'function') {
			return utils.applyMiddleware(this.model._middleware[this._opType].before, this)
				.then(query => {
					return super.exec(op, cb)
				})
				.catch(err => {
					$logger.error(err)
				})
		}

		return utils.applyMiddleware(this.model._middleware[this._opType].before, this)
			.then(query => {
				return super.exec()
			})
			.then(docs => {
				return utils.applyMiddleware(this.model._middleware[this._opType].after, docs)
			})
	}

	/*
	 * Read Operations
	 * ---
	 */

	find(...args) {
		this._opType = 'read'
		return super.find(...args)
	}

	findById(...args) {
		this._opType = 'read'
		return super.findById(...args)
	}

	findOne(...args) {
		this._opType = 'read'
		return super.findOne(...args)
	}

	/*
	 * Delete Operations
	 * ---
	 */

	findByIdAndRemove(...args) {
		this._opType = 'delete'
		return super.findByIdAndRemove(...args)
	}

	findOneAndRemove(...args) {
		this._opType = 'delete'
		return super.findOneAndRemove(...args)
	}

	remove(...args) {
		this._opType = 'delete'
		return super.remove(...args)
	}

	/*
	 * Update Operations
	 * ---
	 */

	findByIdAndUpdate(...args) {
		this._opType = 'update'
		return super.findByIdAndUpdate(...args)
	}

	findOneAndUpdate(...args) {
		this._opType = 'update'
		return super.findOneAndUpdate(...args)
	}

	update(...args) {
		this._opType = 'update'
		return super.update(...args)
	}
}

module.exports = Query
