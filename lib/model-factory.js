'use strict'

const Query = require('./query')
const utils = require('./utils')

let instances = []

const ModelFactory = function() {
	function extendModel(model) {
		model.Query = Query

		model._middleware = {
			create: { before: [], after: [] },
			read: { before: [], after: [] },
			update: { before: [], after: [] },
			delete: { before: [], after: [] }
		}

		model.useBefore = function(op, fn) {
			this._middleware[op].before.push(fn)
			return model
		}

		model.useAfter = function(op, fn) {
			this._middleware[op].after.push(fn)
			return model
		}

		const oldCreate = model.create
		model.create = function(...args) {
			return utils.applyMiddleware(this._middleware.create.before, this)
				.then(m => {
					return oldCreate.apply(this, args)
				})
				.then(docs => {
					return utils.applyMiddleware(this._middleware.create.after, docs)
				})
		}

		const oldSave = model.prototype.save
		model.prototype.save = function(...args) {
			const op = this.isNew ? 'create' : 'update'

			return utils.applyMiddleware(model._middleware[op].before, this)
				.then(m => {
					return oldSave.apply(this, args)
				})
				.then(docs => {
					return utils.applyMiddleware(model._middleware[op].after, docs)
				})
		}

		const oldInsertMany = model.insertMany
		model.insertMany = function(...args) {
			return utils.applyMiddleware(this._middleware.create.before, this)
				.then(m => {
					return oldInsertMany.apply(this, args)
				})
				.then(docs => {
					return utils.applyMiddleware(this._middleware.create.after, docs)
				})
		}

		return model
	}

	return {
		create(model) {
			if (instances.indexOf(model.modelName) === -1) {
				instances.push(model.modelName)
				return extendModel(model)
			} else {
				return model
			}
		},

		flush() {
			instances = []
		}
	}
}

module.exports = ModelFactory
