'use strict'

const bcrypt       = require('bcryptjs')
const jwt          = require('jsonwebtoken')
const EventEmitter = require('events').EventEmitter
const Errors       = require('../errors')

class Authentication {
	constructor(tokenSecret, metadata) {
		this._enabled = false
		this._collection = undefined
		this._tokenSecret = tokenSecret
		this._user = null
		this._events = new EventEmitter()
		this._metadata = metadata
	}

	get isEnabled() {
		return this._enabled
	}

	get collection() {
		return this._collection
	}

	get events() {
		return this._events
	}

	get user() {
		return this._user
	}

	set user(userDoc) {
		let user

		if (typeof userDoc.toObject === 'function') {
			user = userDoc.toObject({ getters: true, setters: true })
		} else {
			user = userDoc
		}

		delete user.password
		this._user = user
	}

	invalidate() {
		this._user = null
		return this
	}

	/**
	 * Enable authentication and add the authentication collection. Sets
	 * the `firstEnable` meta key if this is the first time authentication
	 * has been enabled
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

		return this._metadata.get('initialAuthEnable')
			.then(value => {
				if (value === undefined) {
					return this._metadata.put('initialAuthEnable', true)
				} else if (value) {
					return this._metadata.put('initialAuthEnable', false)
				}
			})
			.then(() => {
				this.events.emit('auth-enabled')
			})
	}

	/**
	 * Attempt to validate user credentials.
	 * When successful, resolves with user document
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
	 * Create a JWT token with the given
	 * user information.
	 * Returned promise resolves with the token
	 * @param  {Object} user
	 * @return {Promise}
	 */
	createToken(user) {
		return new Promise((res, rej) => {
			try {
				jwt.sign(user.toObject(), this._tokenSecret, null, token => {
					res(token)
				})
			} catch(err) {
				rej(err)
			}
		})
	}

	/**
	 * Verify a JWT token.
	 * Returned promise resolves with the user document
	 * @param  {String} token
	 * @return {Promise}
	 */
	verifyToken(token) {
		return new Promise((res, rej) => {
			jwt.verify(token, this._tokenSecret, (err, user) => {
				if (err) {
					return rej(err)
				}

				this.user = user
				res(this.user)
			})
		})
	}

	/**
	 * Password field setter
	 * @param {String} val
	 * @private
	 */
	static _setPassword(val) {
		return bcrypt.hashSync(val, 10)
	}
}

module.exports = Authentication
