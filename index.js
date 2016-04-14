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
const CollectionFactory = require('./collection-factory')
const defaultConfig     = require('./default-config')

class Ichabod {
	constructor(config) {
		this._config = Object.assign({}, defaultConfig, config)
		this._types = TypeLoader(this.config.types)
		this._definitions = DefinitionLoader(this.config.collections, this.types)
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

	get factory() {
		return this._collectionFactory
	}

	get collections() {
		return this._collectionFactory.collections
	}

	get connection() {
		return this._db
	}

	get server() {
		return this._server
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
			this._db.once('open', () => {
				this._collectionFactory = new CollectionFactory(this._definitions, this._db)
				res()
			})
		})
	}

	/**
	 * Destroy the collection factory.
	 * For testing purposes only.
	 * @private
	 */
	static _destroyFactory() {
		CollectionFactory._destroy()
	}
}

module.exports = Ichabod
