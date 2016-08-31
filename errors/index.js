'use strict'

class AuthError extends Error {
	constructor(...args) {
		super(...args)
		this.name = 'Authentication Error'
	}
}
exports.AuthError = AuthError
