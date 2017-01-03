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
			delete: { before: [], after: [] },
			save: { before: [], after: [] }
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
				.then(() => {
					return oldCreate.apply(this, args)
				})
				.then(docs => {
					return utils.applyMiddleware(this._middleware.create.after, docs)
				})
		}

		const oldSave = model.prototype.save
		model.prototype.save = function(...args) {
			return utils.applyMiddleware(model._middleware.save.before, this)
				.then(() => {
					return oldSave.apply(this, args)
				})
				.then(docs => {
					return utils.applyMiddleware(model._middleware.save.after, docs)
				})
		}

		const oldInsertMany = model.insertMany
		model.insertMany = function(...args) {
			return utils.applyMiddleware(this._middleware.create.before, this)
				.then(() => {
					return oldInsertMany.apply(this, args)
				})
				.then(docs => {
					return utils.applyMiddleware(this._middleware.create.after, docs)
				})
		}

		const oldFindByIdAndUpdate = model.findByIdAndUpdate
		model.findByIdAndUpdate = function(...args) {
			return utils.applyMiddleware(this._middleware.update.before, this)
				.then(() => {
					return oldFindByIdAndUpdate.apply(this, args).exec()
				})
				.then(docs => {
					return utils.applyMiddleware(this._middleware.update.after, docs)
				})
		}

		return model
	}

	return {
		create(model) {
			const found = instances.find(i => i.modelName === model.modelName)

			if (found) {
				return found
			} else {
				instances.push(extendModel(model))
				return instances[instances.length-1]
			}
		},

		flush() {
			instances = []
		}
	}
}

module.exports = ModelFactory
