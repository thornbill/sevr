'use strict'

/**
 * TypeLoader
 * ---
 * Load all type definitions from a single
 * directory and extend the default mongoose
 * types. Directory path is relative to
 * `process.cwd()`.
 *
 * ## Usage
 * ```
 * const types = TypeLoader('path/to/types')
 * ```
 */

const requireAll = require('require-all')
const Types      = require('mongoose').Schema.Types

module.exports = defPath => {
	let loadedModules

	// Load types from directory
	if (defPath) {
		loadedModules = requireAll({
			dirname: process.cwd() + '/' + defPath,
			map: name => {
				return name.replace(/^([a-z])/, (match, char) => {
					return char.toUpperCase()
				})
				.replace(/[-_]([a-z0-9])/g, (match, char) => {
					return char.toUpperCase()
				})
			},
			resolve: type => {
				return ext => {
					let typeObj = Object.assign({}, type(Types), ext)
					if(!typeObj.name){
						typeObj.name = typeObj.type.name
					}
					return typeObj
				}
			}
		})
	} else {
		loadedModules = {}
	}

	// Wrap the default mongoose types
	const defaultTypes = Object.keys(Types).reduce((obj, key) => {
		const name = key.replace(/^(A-Z)/, (match, char) => {
			return char.toLowerCase()
		})

		const tmpObj = Object.assign({}, obj, {
			[key]: ext => {
				return Object.assign({}, {
					name,
					type: Types[key]
				}, ext)
			}
		})
		
		return tmpObj
	}, {})
	
	return Object.assign({}, defaultTypes, loadedModules)
}
