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
const EventEmitter      = require('events').EventEmitter
const TypeLoader        = require('./lib/type-loader')
const DefinitionLoader  = require('./lib/definition-loader')
const CollectionFactory = require('./collection-factory')
const Authentication    = require('./authentication')
const defaultConfig     = require('./default-config')
const defaultLogger     = require('./console-logger')

const metaCollectionName = 'ich_meta'

class Ichabod {
	constructor(config) {
		this._config = _.mergeWith({}, defaultConfig, config)
		this._types = TypeLoader(this.config.types)
		this._definitions = DefinitionLoader(this.config.collections, this.types)
		this._server = express()
		this._plugins = []
		this._logger = defaultLogger
		this._auth = new Authentication(this._config.secret)
		this._metaTree = {}
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
		return this._logger
	}

	get authentication() {
		return this._auth
	}

	get events() {
		return this._events
	}

	set logger(logger) {
		['verbose', 'info', 'warning', 'error', 'critical'].forEach((type, i, all) => {
			if (!logger.hasOwnProperty(type)) {
				throw new Error(`Logger must have all methods: ${all.join(', ')}`)
			}
		})

		this._logger = logger
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
				this.events.emit('db-ready')
				res()
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

				this._logger.info(`Ichabod listening on ${serverConfig.host}:${serverConfig.port}`)
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

	/**
	 * Initialize the meta collection.
	 * If the database is new, it will be marked as such, and an object will
	 * be creted for each collection marking it is as new.
	 * Resolves with the meta document
	 * @return {Promise}
	 * @private
	 */
	_initMetaCollection() {
		const db = this._db.db
		const defaultData = {
			_id: 0,
			newDatabase: true,
			collections: Object.keys(this.collections).reduce((obj, key) => {
				return Object.assign(obj, {
					[key]: { new: true }
				})
			}, {})
		}

		let metaColl
		let hasMeta
		let updateData

		return new Promise((res, rej) => {
			db.listCollections({}).toArray((err, colls) => {
				if (err) return rej(err)

				hasMeta = _(colls).map(val => { return val.name }).includes(metaCollectionName)
				metaColl = this._db.collection(metaCollectionName)
				updateData = hasMeta ? { newDatabase: false } : defaultData

				metaColl.updateOne({ _id: 0 }, { $set: updateData }, { upsert: true })
					.then(() => { return metaColl.findOne({ _id: 0 }) })
					.then(meta => {
						this._metaTree = meta
						this._addMetaCollectionHooks()
						res(meta)
					})
					.catch(rej)
			})
		})
	}

	/**
	 * Update the meta collection data
	 * @param {Object} updateData
	 * @return {Promise}
	 * @private
	 */
	_updateMetaCollection(updateData) {
		const metaColl = this._db.collection(metaCollectionName)

		return metaColl.updateOne({ _id: 0 }, { $set: updateData }, { upsert: true })
			.then(() => { return metaColl.findOne({ _id: 0 }) })
			.then(meta => {
				this._metaTree = meta
				return meta
			})
	}

	/**
	 * Add a post save hook fo each collection
	 * @private
	 */
	_addMetaCollectionHooks() {
		Object.keys(this.collections).forEach(collName => {
			const coll = this.collections[collName]

			if (!this._metaTree.collections[collName].new) return

			coll.attachHook('post', 'save', (doc, next) => {
				this._updateMetaCollection({
					collections: { [collName]: { new: false } }
				})
				next()
			})
		})
	}
}

module.exports = Ichabod
