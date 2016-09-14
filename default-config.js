'use strict'

/**
 * Default Sevr Configuration
 * ---
 */

module.exports = {
	/**
	 * The MongoDB connection
	 * @type {Object}
	 */
	connection: {
		host: 'localhost',
		port: 27017,
		username: null,
		password: null,
		database: 'sevr'
	},

	/**
	 * Path to the collections directory
	 * @type {String}
	 */
	collections: 'collections',

	/**
	 * Path to the schema types directory
	 * @type {String}
	 */
	types: 'types',

	/**
	 * Web server configuration
	 * @type {Object}
	 */
	server: {
		host: '127.0.0.1',
		port: 3000
	},

	/**
	 * JWT token secret
	 * @type {String}
	 */
	secret: 'keyboard cat'
}
