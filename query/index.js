'use strict'

const QueryFactory = function(model) {

	function getOperationWithName(model, name) {
		switch(name) {
			case 'create':
				return model.create
			case 'read':
				return model.find
			case 'update':
				return model.update
			case 'delete':
				return model.delete
		}
	}

	/**
	 * Return a new class that extends the given model
	 * @return {Class}
	 */
	return class Query extends model.toConstructor() {
		constructor(operationName) {
			super()
			this._operationName = operationName
			this._middleware = {
				before: [],
				after: []
			}
		}

		/**
		 * Run the query operation after applying all of the "before" middleware
		 * @param  {*} ...args
		 * @return {Promise}
		 */
		runWith(...args) {
			return this._sequenceBefore(args)
				.then(args => {
					return getOperationWithName(this, this._operationName)
						.apply(this, args)
				})
		}

		/**
		 * Execute the query and apply each "after" middleware
		 * @return {Promise}
		 */
		exec() {
			return super.exec()
				.then(docs => {
					const seq = this._sequenceAfter(docs)
					return seq
				})
		}

		/**
		 * Add middleware to be called before running operation
		 * @param  {Function} fn
		 * @return {Query}
		 */
		useBefore(fn) {
			this._middleware.before.push(fn)
			return this
		}

		/**
		 * Add middleware to be called after query is executed
		 * @param  {Function} fn
		 * @return {Query}
		 */
		useAfter(fn) {
			this._middleware.after.push(fn)
			return this
		}

		/**
		 * Get a Promise sequence with all "before" middleware
		 * @param  {Array} args
		 * @return {Promise}
		 * @private
		 */
		_sequenceBefore(args) {
			return this._middleware.before.reduce((chain, m) => {
				return chain.then(data => { return m.apply(m, data) })
			}, Promise.resolve(args))
		}

		/**
		 * Get a Promise sequence with all "after" middleware
		 * @param  {Array} docs
		 * @return {Promise}
		 * @private
		 */
		_sequenceAfter(docs) {
			return this._middleware.after.reduce((chain, m) => {
				return chain.then(data => { return m.call(m, data) })
			}, Promise.resolve(docs))
		}
	}
}

module.exports = QueryFactory
