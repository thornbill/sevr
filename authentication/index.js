'use strict'

const bcrypt = require('bcryptjs')

class Authentication {
	constructor() {
		this._enabled = false
		this._collection = undefined
	}

	get isEnabled() {
		return this._enabled
	}

	get collection() {
		return this._collection
	}

	/**
	 * Enable authentication and add the
	 * authentication collection
	 * @param  {Collection} coll
	 */
	enable(coll) {
		if (!coll.getField('username') || !coll.getField('password')) {
			throw new Error('Authentication collection must have "username" and "password"')
		}

		this._collection = coll
		this._collection.extendFieldSchema('password', 'set', Authentication._setPassword)
		this._enabled = true
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
		}, true, true)
		.then(user => {
			return new Promise((res, rej) => {
				bcrypt.compare(creds.password, user.password, (err, valid) => {
					if (err || !valid) {
						return rej()
					}

					res(user)
				})
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
