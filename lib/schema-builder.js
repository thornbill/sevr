'use strict'

const _      = require('lodash')
const Schema = require('mongoose').Schema

class SchemaBuilder {

	/**
	 * Create and return a mongoose schema
	 * @param  {Object} collDef
	 * @return {Schema}
	 */
	static create(collDef) {
		const schemaFields = {}
		const collectionDef = _.defaultsDeep({}, collDef)

		Object.keys(collectionDef.fields).forEach(field => {
			const obj = collectionDef.fields[field]

			if (!Array.isArray(obj.schemaType) && typeof obj.schemaType == 'object') {
				schemaFields[field] = _.assign({}, obj.schemaType)
			} else {
				schemaFields[field] = obj.schemaType
			}
		})

		const schema = new Schema(schemaFields)

		// Add any virtuals
		if (collectionDef.virtuals) {
			Object.keys(collectionDef.virtuals).forEach(path => {
				const virtual = collectionDef.virtuals[path]

				if (virtual.hasOwnProperty('get') && typeof virtual.get == 'function') {
					schema.virtual(path).get(virtual.get)
				}

				if (virtual.hasOwnProperty('set') && typeof virtual.set == 'function') {
					schema.virtual(path).set(virtual.set)
				}
			})
		}

		return schema
	}

	/**
	 * Add a path to a schema
	 * @param  {String} path
	 * @param  {Object} schemaType
	 * @param  {Schema} schema
	 * @return {Schema}
	 */
	static addPath(path, schemaType, schema) {
		if (!Array.isArray(schemaType) && typeof schemaType == 'object') {
			schema.path(path, _.assign({}, schemaType))
		} else {
			schema.path(path, schemaType)
		}

		return schema
	}
}

module.exports = SchemaBuilder
