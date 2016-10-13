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
const utils             = require('./lib/utils')

global.$logger = defaultLogger

class Sevr {
	constructor(config) {
		this._config = _.mergeWith({}, defaultConfig, config)
		this._server = express()
		this._plugins = []
		this._auth = new Authentication(this._config.secret)
		this._events = new EventEmitter()
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
			klass: plugin,
			config,
			namespace
		})

		return this
	}

	/**
	 * Connect to the database
	 * @return {Promise}
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
				this.events.emit('db-ready')
				res()
			})
		})
	}

	/**
	 * Start the Sevr service and begin the lifecyle
	 * @return {Promise}
	 */
	start() {
		return this.connect()
			.then(() => {
				// Create the meta collection
				// Initialize plugins
				Meta.createModel(this._db)
				return this._initPlugins()
			})
			.then(() => {
				// Load the types
				// Allow plugins to register additional types
				this._types = TypeLoader(this.config.types)
				return this._pluginsCall('registerTypes', true)
			})
			.then(() => {
				// Load the collections
				// Allow plugins to register additional collections
				this._definitions = DefinitionLoader(this.config.collections, this.types)
				this._collectionFactory = new CollectionFactory(this._definitions, this._db)
				return this._pluginsCall('registerCollections', true)
			})
			.then(() => {
				// Intialize authentication
				return Meta.getInstance('sevr-auth')
					.then(meta => {
						this._auth.setMeta(meta)
					})
			})
			.then(() => {
				// Plugin.didInitialize lifecycle method
				return this._pluginsCall('didInitialize', true)
			})
			.then(() => {
				// Plugin.willRun lifecycle method
				return this._pluginsCall('willRun', true)
			})
			.then(() => {
				this._events.emit('ready')
				// Plugin.run lifecycle method
				return this._pluginsRun()
			})

	}

	/**
	 * Wait for the connection to be ready
	 * @return {Sevr}
	 */
	ready(fn) {
		this.events.on('ready', fn)
		return this
	}

	/**
	 * Start the express web server
	 * @return {Promise}
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
	 * Trigger a reset
	 * @return {Promise}
	 */
	reset() {
		this.events.emit('reset')
		this.authentication.reset()
		return this._pluginsCall('reset')
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
				Meta.getInstance(plugin.namespace).then(meta => {
					plugin.instance = new plugin.klass(this, plugin.config, meta)
				})
			)
		})

		return Promise.all(promises)
	}

	/**
	 * Execute a particular method for all plugins.
	 * Methods can be called either concurrently or in sequence.
	 * @param {any} method
	 * @return {Promise}
	 * @private
	 */
	_pluginsCall(method, seq) {
		const methods = []

		this._plugins.forEach(plugin => {
			if (typeof plugin.instance[method] !== 'function') return
			methods.push(
				// Bind the plugin method to it's instance, ensuring
				// that `this` is available within the plugin class
				plugin.instance[method].bind(plugin.instance)
			)
		})

		if (seq) {
			// Run each method in sequence
			return utils.createPromiseSequence(methods)
		} else {
			// Run each method concurrently
			return Promise.all(methods.map(fn => { return fn() }))
		}
	}

	/**
	 * Execute the `run` lifecycle method for all plugins 
	 * @return {Sevr}
	 */
	_pluginsRun() {
		this._plugins.forEach(plugin => {
			if (typeof plugin.instance.run !== 'function') return
			plugin.instance.run()
		})

		return this
	}
}

Sevr.logger = defaultLogger
Sevr.Errors = Errors

module.exports = Sevr
