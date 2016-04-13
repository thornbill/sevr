'use strict'

/**
 * DefinitionLoader
 * ---
 * Load all collection definitions from a single
 * directory. Directory path is relative to
 * `process.cwd()`.
 *
 * ## Usage
 * ```
 * const defs = DefinitionLoader('path/to/definitions', types)
 * ```
 */

const requireAll = require('require-all')

module.exports = (defPath, types) => {
	return requireAll({
		dirname: process.cwd() + '/' + defPath,
		map: name => {
			return name.replace(/[-_]([a-z0-9])/g, (match, char) => {
				return char.toUpperCase()
			})
		},
		resolve: def => {
			return def(types)
		}
	})
}
