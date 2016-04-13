'use strict'

/**
 * Ichabod
 * ---
 * Initialize the ichabod core.
 * 
 */

const mongoose          = require('mongoose')
const TypeLoader        = require('./lib/type-loader')
const DefinitionLoader  = require('./lib/definition-loader')
const CollectionFactory = require('./lib/collection-factory')
const defaultConfig     = require('./default-config')

class Ichabod {
	constructor(config) {
		this._config = Object.assign({}, defaultConfig, config)
		this._types = TypeLoader(this.config.types)
		this._definitions = DefinitionLoader(this.config.collections, this.types)
		this._collectionFactory = new CollectionFactory(this._definitions)
	}

	get config() {
		return Object.assign({}, this._config)
	}

	get types() {
		return Object.assign({}, this._types)
	}

	get definitions() {
		return Object.assign({}, this._definitions)
	}

	get collections() {
		return this._collectionFactory.collections
	}

	get db() {
		return this._db
	}

	/**
	 * Connect to the database
	 * @return {promise}
	 */
	connect() {
		const dbConfig = this._config.connection
		const connUri = `mongodb://${dbConfig.host}/${dbConfig.name}:${dbConfig.port}`

		return new Promise((res, rej) => {
			this._db = mongoose.createConnection(connUri, {
				user: dbConfig.username,
				pass: dbConfig.password
			})
			this._db.once('error', err => { rej(err) })
			this._db.once('open', () => { res() })
		})
	}

	/**
	 * Destroy the collection factory.
	 * For testing purposes only.
	 * @private
	 */
	static _destroyFactory() {
		CollectionFactory._destory()
	}
}

module.exports = Ichabod
