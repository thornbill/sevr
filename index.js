'use strict'

/**
 * Ichabod
 * ---
 * Initialize the ichabod core.
 *
 */

const mongoose          = require('mongoose')
const express           = require('express')
const _                 = require('lodash')
const TypeLoader        = require('./lib/type-loader')
const DefinitionLoader  = require('./lib/definition-loader')
const CollectionFactory = require('./collection-factory')
const defaultConfig     = require('./default-config')
const defaultLogger     = require('./console-logger')

class Ichabod {
	constructor(config) {
		this._config = _.mergeWith({}, defaultConfig, config)
		this._types = TypeLoader(this.config.types)
		this._definitions = DefinitionLoader(this.config.collections, this.types)
		this._server = express()
		this._plugins = []
		this._logger = defaultLogger
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
	 * Attach a plugin
	 * @param  {Function} plugin
	 * @param  {Object} config
	 */
	attach(plugin, config) {
		if (typeof plugin !== 'function') {
			throw new Error('Plugin must be a function')
		}

		this._plugins.push({
			fn: plugin,
			config: config
		})
	}

	/**
	 * Connect to the database
	 * @return {promise}
	 */
	connect() {
		const dbConfig = this._config.connection
		const connUri = `mongodb://${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`

		return new Promise((res, rej) => {
			this._db = mongoose.createConnection(connUri, {
				user: dbConfig.username,
				pass: dbConfig.password
			})
			this._db.once('error', err => { rej(err) })
			this._db.once('open', () => {
				this._collectionFactory = new CollectionFactory(this._definitions, this._db)
				this._initPlugins()
				res()
			})
		})
	}

	/**
	 * Start the express web server
	 * @return {[type]} [description]
	 */
	startServer() {
		const serverConfig = this._config.server

		return new Promise((res, rej) => {
			this._server.listen(serverConfig.port, serverConfig.host, (err) => {
				if (err) return rej(err)

				console.log(`Ichabod listening on ${serverConfig.host}:${serverConfig.port}`)
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

	/**
	 * Initialize the array of plugins
	 * @private
	 */
	_initPlugins() {
		this._plugins.forEach(plugin => {
			plugin.fn(this, plugin.config)
		})
	}
}

module.exports = Ichabod
