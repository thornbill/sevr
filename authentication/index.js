'use strict'

const bcrypt       = require('bcryptjs')
const jwt          = require('jsonwebtoken')
const EventEmitter = require('events').EventEmitter
const Errors       = require('../errors')

/**
 * Authentication interface
 * 
 * @param {String} tokenSecret
 * @param {Object} metadata
 * @class Authentication
 */
class Authentication {
	constructor(tokenSecret, metadata) {
		this._enabled = false
		this._collection = undefined
		this._tokenSecret = tokenSecret
		this._user = null
		this._events = new EventEmitter()
		this._metadata = metadata
	}

	/**
	 * Is authentication enabld
	 * 
	 * @readonly
	 * @type Boolean
	 */
	get isEnabled() {
		return this._enabled
	}

	/**
	 * Is this the first time authentication has been enabled
	 * 
	 * @readonly
	 * @type Boolean
	 */
	get isFirstEnable() {
		return !!this._metadata.get('initialAuthEnable')
	}

	/**
	 * The collection used to store auth credentials
	 * 
	 * @readonly
	 * @type Collection
	 */
	get collection() {
		return this._collection
	}

	/**
	 * EventEmitter
	 * 
	 * @readonly
	 * @type EventEmitter
	 */
	get events() {
		return this._events
	}

	/**
	 * The currently authenticated user
	 * 
	 * @type Object
	 */
	get user() {
		return this._user
	}

	set user(userDoc) {
		this._user = Authentication.normalizeUser(userDoc)
	}

	/**
	 * Assign the metadata object
	 * 
	 * @param {any} meta
	 * @return {Authentication}
	 */
	setMeta(meta) {
		this._metadata = meta
		return this
	}

	/**
	 * Invalidate the current user
	 * 
	 * @return {Authentication}
	 */
	invalidate() {
		this._user = null
		return this
	}

	/**
	 * Reset the metadata
	 * 
	 * @return {Authentication}
	 */
	reset() {
		this._metadata.remove('initialAuthEnable')
		return {Authentication}
	}

	/**
	 * Enable authentication and add the authentication collection.
	 * 
	 * Sets he `firstEnable` meta key if this is the first time authentication
	 * has been enabled
	 * 
	 * Will emit `auth-enabled` once complete
	 * 
	 * @param  {Collection} coll
	 * @return {Promise}
	 */
	enable(coll) {
		if (!coll.getField('username') || !coll.getField('password')) {
			throw new Error('Authentication collection must have "username" and "password"')
		}

		this._collection = coll
		this._collection.extendFieldSchema('password', 'set', Authentication._setPassword)
		this._collection.extendFieldSchema('password', 'select', false)
		this._enabled = true
		
		this._collection.attachHook('post', 'save', next => {
			// Remove first enable flag after credentials are added to the db
			if (this.isFirstEnable) {
				this._metadata.put('initialAuthEnable', false)
					.then(() => { next() })
					.catch(next)
			}
		})

		const initialAuthEnable = this._metadata.get('initialAuthEnable')
		let newInitAuthEnable = initialAuthEnable === undefined ? true : false

		return this._metadata.put('initialAuthEnable', newInitAuthEnable)
			.then(() => {
				this.events.emit('auth-enabled')
			})
	}

	/**
	 * Attempt to validate user credentials.
	 * 
	 * When successful, resolves with user document
	 * 
	 * @param  {Object} creds
	 * @return {Promise}
	 */
	validateCredentials(creds) {
		return this._collection.read({
			username: creds.username
		}, ['+password'], true, true)
		.then(user => {
			return new Promise((res, rej) => {
				if (!user) return rej(new Errors.AuthError('Invalid credentials'))

				bcrypt.compare(creds.password, user.password, (err, valid) => {
					if (err) return rej(err)
					if (!valid) return rej(new Errors.AuthError('Invalid credentials'))

					this.user = user
					res(this.user)
				})
			})
		})
	}

	/**
	 * Create a JWT token with the given user information.
	 * 
	 * Returned promise resolves with the token
	 * 
	 * @param  {Object} user
	 * @return {Promise}
	 */
	createToken(user) {
		return new Promise((res, rej) => {
			try {
				jwt.sign(Authentication.normalizeUser(user), this._tokenSecret, null, token => {
					res(token)
				})
			} catch(err) {
				rej(err)
			}
		})
	}

	/**
	 * Verify a JWT token.
	 * 
	 * Returned promise resolves with the user document
	 * 
	 * @param  {String} token
	 * @return {Promise}
	 */
	verifyToken(token) {
		return new Promise((res, rej) => {
			jwt.verify(token, this._tokenSecret, (err, user) => {
				if (err) return rej(err)

				// Read the user from the db to ensure
				// the user object has the most recent data
				this._collection.readById(user._id)
					.then(doc => {
						this.user = doc
						res(this.user)
					})
					.catch(rej)
			})
		})
	}

	/**
	 * Password field setter
	 * 
	 * @param {String} val
	 * @private
	 */
	static _setPassword(val) {
		return bcrypt.hashSync(val, 10)
	}

	/**
	 * Normalize a user object such that a Mongoose document
	 * becomes a plain object.
	 * 
	 * Also deletes the password property from the user
	 * 
	 * @static
	 * @param {any} userDoc
	 * @return {Object}
	 */
	static normalizeUser(userDoc) {
		let user

		if (typeof userDoc.toObject === 'function') {
			user = userDoc.toObject({ getters: true, setters: true })
		} else {
			user = userDoc
		}

		delete user.password
		return user
	}
}

module.exports = Authentication
