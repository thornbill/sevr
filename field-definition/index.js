'use strict'

const Links = require('../links')

class FieldDefinition {
	constructor(name, label, type) {
		if (!name) throw new Error('Cannot create a field without a name')

		this.name = name
		this.label = label || this.name[0].toUpperCase() + this.name.slice(1)
		this.isMultiValue = false

		if (Array.isArray(type)) {
			this.type = type[0]
			this.isMultiValue = true
		} else if(type) {
			this.type = type
		} else {
			this.type = String
		}

		if (this.isLinked) {
			Links.set(this, this.type.ref)
		}
	}

	/**
	 *  Whether the field is linked to another collection
	 * 
	 * @readonly
	 * @memberOf FieldDefinition
	 */
	get isLinked() {
		return Object.hasOwnProperty.call(this.type, 'ref')
	}

	/**
	 * Get the collection that the field is linked to if it is
	 * 
	 * @returns {Collection}
	 * @memberOf FieldDefinition
	 */
	getLinkedCollection() {
		return Links.getCollection(this)
	}

	/**
	 * Get the name of the display field for the linked collection
	 * 
	 * @returns {String}
	 * @memberOf FieldDefinition
	 */
	getLinkedDisplay() {
		return this.type.display
	}

	/**
	 * Get an array of field types associated with the field
	 * 
	 * Values are in the following order:
	 * 1. Field name
	 * 2. Schema name
	 * 3. Mongoose schema type name (usually a constructor)
	 * 4. 'COMPLEX'
	 * 
	 * 'COMPLEX' is used for fields that have a nested property structure
	 * 
	 * @returns {Array}
	 * @memberOf FieldDefinition
	 */
	getTypeNames() {
		const names = [this.name]

		if (this.type.hasOwnProperty('name')) {
			names.push(this.type.name)
		}

		if (this.type.hasOwnProperty('type') && this.type.type.hasOwnProperty('name')) {
			names.push(this.type.type.name.replace(/Schema/, ''))
		}

		if (typeof this.type !== 'function' && !this.type.hasOwnProperty('type')){
			names.push('COMPLEX')
		}

		return names
	}

	/**
	 * Get a mapping of subfields for this field in dot notation
	 * 
	 * @returns {Object}
	 * @memberOf FieldDefinition
	 */
	getFlatFields() {
		if (typeof this.type !== 'function' && !this.type.hasOwnProperty('type')) {
			return flattenObject(this.name, this.type)
		} else {
			return { [this.name]: this }
		}
	}

	/**
	 * Extend the field type
	 * 
	 * @param {String} prop
	 * @param {*} value
	 * @returns {FieldDefinition}
	 * @memberOf FieldDefinition
	 */
	extendType(prop, value) {
		if (typeof this.type !== 'function') {
			this.type[prop] = value
		} else {
			this.type = {
				type: this.type,
				[prop]: value
			}
		}

		return this
	}

	/**
	 * Get an object suitable to be used as a Mongoose schemaType.
	 * 
	 * If `flatten` is true, the nested fields will be flattened
	 * to dot notation.
	 * 
	 * @param {Boolean} flatten
	 * @returns {Object}
	 * 
	 * @memberOf FieldDefinition
	 */
	getSchemaType(flatten) {
		let schemaType

		if (typeof this.type === 'function' || this.isMultiValue) {
			schemaType = flatten ? { [this.name]: this.type } : this.type
		} else {
			schemaType = Object.assign({}, this.type)

			if (schemaType.ref && schemaType.ref.model) {
				schemaType.ref = schemaType.ref.model.modelName
			}

			// This is a nested structure
			if (!schemaType.type) {
				schemaType = Object.keys(schemaType).reduce((acc, key) => {
					return Object.assign({}, acc, {
						[key]: schemaType[key].getSchemaType()
					})
				}, {})

				// Flatten a nested object so that keys use dot notation
				if (flatten) {
					schemaType = flattenObject(this.name, schemaType)
				}
			} else {
				if (flatten) {
					schemaType = { [this.name]: this.type }
				}
			}
		}

		return this.isMultiValue ? [schemaType] : schemaType
	}

	toObject() {
		let schemaType = this.type

		if (typeof this.type !== 'function' && !this.type.hasOwnProperty('type')) {
			schemaType = Object.keys(schemaType).reduce((acc, key) => {
				return Object.assign({}, acc, {
					[key]: schemaType[key].toObject()
				})
			}, {})
		}

		return {
			name: this.name,
			label: this.label,
			schemaType
		}
	}
}

function flattenObject(root, obj) {
	return Object.keys(obj).reduce((acc, key) => {
		let val = obj[key]
		
		if (typeof val !== 'function' && !val.hasOwnProperty('type')) {
			return Object.assign({}, acc, flattenObject(`${root}.${key}`, val))
		} else if (val instanceof FieldDefinition && typeof val.type !== 'function' && !val.type.hasOwnProperty('type')) {
			return Object.assign({}, acc, flattenObject(`${root}.${key}`, val.type))
		}

		return Object.assign({}, acc, {
			[`${root}.${key}`]: val
		})
	}, {})
}



module.exports = FieldDefinition