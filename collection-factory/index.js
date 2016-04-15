'use strict'

const _          = require('lodash')
const Collection = require('../collection')

let factoryInstance = null

class CollectionFactory {
	constructor(defs, connection) {
		if (!factoryInstance) {
			factoryInstance = this
		} else {
			return factoryInstance
		}

		this._instances = {}
		this._definitions = _.assign({}, defs)
		this._connection = connection

		// Add definition key to name property in definition
		// and initialize each collection
		for (let key in this._definitions) {
			this._definitions[key].name = key
			this._instances[key] = this.getInstance(key)
		}
	}

	/**
	 * Get a collection instance by name
	 * @param  {String} name
	 * @return {Collection}
	 */
	getInstance(name) {
		if (this._instances.hasOwnProperty(name)) {
			return this._instances[name]
		} else {
			let def = this._definitions[name]
			if (!def) return
			return this._instances[name] = new Collection(name, def, this)
		}
	}

	/**
	 * Get a collection instance by model name
	 * @param  {String} modelName
	 * @return {Collection}
	 */
	getInstanceWithModel(modelName) {
		let matchDef = _.find(this._definitions, obj => { return obj.singular == modelName })
		if (!matchDef) return
		return this.getInstance(matchDef.name)
	}

	/**
	 * Get all collection instances
	 * @return {Object}
	 */
	get collections() {
		return Object.assign({}, this._instances)
	}

	get connection() {
		return this._connection
	}

	/**
	 * Destroy the factory instance. This is for testing only.
	 * @private
	 */
	static _destroy() {
		factoryInstance = null
	}
}

module.exports = CollectionFactory
