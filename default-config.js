'use strict'

/**
 * Default Ichabod Configuration
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
		database: 'ichabod'
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
	types: 'types'
}
