'use strict'

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

/**
 * Sevr
 * 
 * Core Sevr library
 * 
 * @class Sevr
 */
class Sevr {
	constructor(config) {
		this._config = _.mergeWith({}, defaultConfig, config)
		this._server = express()
		this._plugins = []
		this._auth = new Authentication(this._config.secret)
		this._events = new EventEmitter()
	}

	/**
	 * The Sevr config object
	 * 
	 * @readonly
	 */
	get config() {
		return Object.assign({}, this._config)
	}

	/**
	 * Ttype definitions
	 * 
	 * @readonly
	 */
	get types() {
		return Object.assign({}, this._types)
	}

	/**
	 * Collection definitions
	 * 
	 * @readonly
	 */
	get definitions() {
		return Object.assign({}, this._definitions)
	}

	/**
	 * Collection factory
	 * 
	 * @readonly
	 */
	get factory() {
		return this._collectionFactory
	}

	/**
	 * Loaded collection instances
	 * 
	 * @readonly
	 */
	get collections() {
		return this._collectionFactory.collections
	}

	/**
	 * Database connection
	 * 
	 * @readonly
	 */
	get connection() {
		return this._db
	}

	/**
	 * Express web server
	 * 
	 * @readonly
	 */
	get server() {
		return this._server
	}

	/**
	 * Sevr logger object
	 * 
	 * @readonly
	 */
	get logger() {
		return Sevr.logger
	}

	/**
	 * Authentication instance
	 * 
	 * @readonly
	 */
	get authentication() {
		return this._auth
	}

	/**
	 * Sevr event emitter
	 * 
	 * @readonly
	 */
	get events() {
		return this._events
	}

	/**
	 * Set the logger object used by Sevr
	 * 
	 * object must implement the following methods:
	 * - `verbose`
	 * - `info`
	 * - `warning`
	 * - `error`
	 * - `critical`
	 * 
	 * @static
	 * @param {Object} logger
	 */
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
	 * 
	 * @example
	 * sevr.attach(PluginClass, {}, 'sevr.plugin')
	 * 
	 * @param  {Function} plugin The plugin class or constructor function
	 * @param  {Object} config Configuration to be passed to the plugin
	 * @param  {String} namespace The plugin's namespace'
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
	 * Connect to the MongoDB database
	 * 
	 * Returns a promise that resolves once the connection is open.
	 * It also emits a `db-ready` event the connection is open
	 * 
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
	 * 
	 * Creates the collections and types, initializes authentication,
	 * and executes plugin lifecycle methods.
	 * 
	 * Emits a `ready` event once the lifecycle is complete
	 * 
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
				return this._pluginsCall('loadTypes', true)
			})
			.then(() => {
				// Load the collections
				// Allow plugins to register additional collections
				this._definitions = DefinitionLoader(this.config.collections, this.types)
				this._collectionFactory = new CollectionFactory(this._definitions, this._db)
				return this._pluginsCall('loadCollections', true)
			})
			.then(() => {
				// Intialize authentication
				return Meta.getInstance('sevr-auth')
					.then(meta => {
						this._auth.setMeta(meta)
					})
			})
			.then(() => {
				// Register the collections
				this._collectionFactory.registerAll()
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
	 * 
	 * Attaches a callback function to the `ready` event
	 * 
	 * @param {Function} fn Callback function
	 * @return {Sevr}
	 */
	ready(fn) {
		this.events.on('ready', fn)
		return this
	}

	/**
	 * Start the express web server
	 * 
	 * Returns a promise that resolves once the web server is
	 * ready to accept connections.
	 * 
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
	 * 
	 * Emits the `reset` event, triggers an authentication reset,
	 * and calls all plugin reset methods
	 * 
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
	 * @private
	 */
	_pluginsRun() {
		this._plugins.forEach(plugin => {
			if (typeof plugin.instance.run !== 'function') return
			plugin.instance.run()
		})

		return this
	}
}

/**
 * The Sevr logger object
 * 
 * @static
 * @memberOf Sevr
 */
Sevr.logger = defaultLogger

/**
 * Error classes
 * 
 * @static
 * @memberOf Sevr
 */
Sevr.Errors = Errors

module.exports = Sevr
