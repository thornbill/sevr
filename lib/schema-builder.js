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

		return new Schema(schemaFields)
	}
}

module.exports = SchemaBuilder
