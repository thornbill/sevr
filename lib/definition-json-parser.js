'use strict'

const _              = require('lodash')
const CollectionDefinition = require('../collection-definition')
const FieldDefinition = require('../field-definition')

const requiredProperties = {
	base: [
		{ prop: 'singular', type: 'String' },
		{ prop: 'fields', type: 'PlainObject' }
	],
	field: [
		{ prop: 'label', type: 'String' },
		{ prop: 'schemaType', type: ['Array', 'Object'] }
	]
}

module.exports = function DefinitionJsonParser(name, json, connection) {
	const errors = getDefinitionErrors(json)

	// Check for errors in the json
	if (errors.length) {
		throw new Error(
			`${name} collection\n\t${errors.join('\n\t')}`
		)
	}

	const def = new CollectionDefinition(name, json.singular, connection)
	const fields = createFields(name, json.fields)

	// Add each ofthe fields to the CollectionDefinition
	Object.keys(fields).forEach(key => def.addField(fields[key]))

	// Add any virtual paths
	if (json.virtuals) {
		Object.keys(json.virtuals).forEach(key => {
			const virtual = json.virtuals[key]

			if (virtual.get) def.addVirtual(key, 'get', virtual.get)
			if (virtual.set) def.addVirtual(key, 'set', virtual.set)
		})
	}

	// Add the meta
	def.meta = json.meta

	// Versioned
	if (json.versioned === false) def.versioned = false

	// Set the default field
	if (json.defaultField) def.defaultField = json.defaultField

	return def
}

function createFields(collectionName, definition) {
	return Object.keys(definition).reduce((acc, key) => {
		const fieldDef = definition[key]
		const schemaType = fieldDef.schemaType
		const fieldErrors = getFieldErrors(fieldDef, key)

		// Check for errors
		if (fieldErrors.length) {
			throw new Error(
				`${collectionName} collection\n\t${fieldErrors.join('\n\t')}`
			)
		}

		let type
		
		if (!Array.isArray(schemaType) && typeof schemaType !== 'function' && !schemaType.type) {
			type = createFields(collectionName, schemaType)
		} else if (Array.isArray(schemaType) && !schemaType[0].type) {
			type = [createFields(collectionName, schemaType[0])]
		} else {
			type = schemaType
		}

		// Create a new FieldDefinition
		return Object.assign({}, acc, {
			[key]: new FieldDefinition(key, fieldDef.label, type)
		})
	}, {})
}

function getDefinitionErrors(definition) {
	const errors = []

	requiredProperties.base.forEach(required => {
		if (!definition.hasOwnProperty(required.prop)) {
			errors.push(`must contain the \`${required.prop}\` property`)
		}

		let requiredTypes = Array.isArray(required.type) ? required.type : [required.type]
		let validType = false

		requiredTypes.forEach(type => {
			if (_['is' + type](definition[required.prop])) {
				validType = true
			}
		})

		if (!validType) {
			errors.push(`\`${required.prop}\` property must be of type [${requiredTypes}]`)
		}
	})

	return errors
}

function getFieldErrors(fieldDef, fieldName) {
	const errors = []

	requiredProperties.field.forEach(required => {
		if (!fieldDef.hasOwnProperty(required.prop)) {
			errors.push(`\`${fieldName}\` field must contain \`${required.prop}\` property`)
		}

		let requiredTypes = Array.isArray(required.type) ? required.type : [required.type]
		let validType = false

		requiredTypes.forEach(type => {
			if (_['is' + type](fieldDef[required.prop])) {
				validType = true
			}
		})

		if (!validType) {
			errors.push(`\`${fieldName}\` field \`${required.prop}\` property must be of type [${requiredTypes}]`)
		}
	})

	return errors
}