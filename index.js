'use strict'

/**
 * Sevr
 * ---
 * Initialize the sevr core.
 *
 */

const mongoose          = require('mongoose')
const express           = require('express')
const _                 = require('lodash')
const EventEmitter      = require('events').EventEmitter
const TypeLoader        = require('./lib/type-loader')
const DefinitionLoader  = require('./lib/definition-loader')
const CollectionFactory = require('./collection-factory')
const Authentication    = require('./authentication')
const defaultConfig     = require('./default-config')
const defaultLogger     = require('./console-logger')
const Errors            = require('./errors')
const Meta              = require('./lib/meta')

global.$logger = defaultLogger

const metaCollectionName = 'ich_meta'

class Sevr {
	constructor(config) {
		this._config = _.mergeWith({}, defaultConfig, config)
		this._types = TypeLoader(this.config.types)
		this._definitions = DefinitionLoader(this.config.collections, this.types)
		this._server = express()
		this._plugins = []
		this._auth = {}
		this._events = new EventEmitter()

		Meta.getInstance('sevr-auth')
			.then(meta => {
				his._auth = new Authentication(this._config.secret, meta)
			})
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

	get logger() {
		return Sevr.logger
	}

	get authentication() {
		return this._auth
	}

	get events() {
		return this._events
	}

	static setLogger(logger) {
		['verbose', 'info', 'warning', 'error', 'critical'].forEach((type, i, all) => {
			if (!logger.hasOwnProperty(type)) {
				throw new Error(`Logger must have all methods: ${all.join(', ')}`)
			}
		})

		Sevr.logger = logger
		global.$logger = logger
	}

	/**
	 * Attach a plugin
	 * @param  {Function} plugin
	 * @param  {Object} config
	 * @param  {String} namespace
	 * @return {Sevr}
	 */
	attach(plugin, config, namespace) {
		if (typeof plugin !== 'function') {
			throw new Error('Plugin must be a function')
		}

		this._plugins.push({
			fn: plugin,
			config,
			namespace
		})

		return this
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
					.then(() => {
						this.events.emit('db-ready')
						res()
					})
			})
		})
	}

	/**
	 * Start the express web server
	 * @return {Promise} [description]
	 */
	startServer() {
		const serverConfig = this._config.server

		return new Promise((res, rej) => {
			this._server.listen(serverConfig.port, serverConfig.host, (err) => {
				if (err) return rej(err)

				Sevr.logger.info(`Sevr listening on ${serverConfig.host}:${serverConfig.port}`)
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
	 * @return {Promise}
	 * @private
	 */
	_initPlugins() {
		const promises = []
		this._plugins.forEach(plugin => {
			promises.push(
				Meta.getInstance(plugin.namespace)
					.then(meta => {
						plugin.fn(this, plugin.config, meta)
					})
			)
		})

		return Promise.all(promises)
	}
}

Sevr.logger = defaultLogger
Sevr.Errors = Errors

module.exports = Sevr
