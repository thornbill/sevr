'use strict'

const _               = require('lodash')
const mongoose        = require('mongoose')
const FieldDefinition = require('../field-definition')
const ModelFactory    = require('../lib/model-factory')()

class CollectionDefinition {
	constructor(name, singular, connection) {
		this.name = name
		this.singular = singular
		this._meta = {}
		this.defaultField = '_id'
		this._fields = {}
		this.virtuals = {}
		this.versioned = true
		this._locked = false
		this._schema = new mongoose.Schema()
		this.connection = connection
	}

	/**
	 * Array of field names to be populated
	 * 
	 * @readonly
	 * @memberOf CollectionDefinition
	 */
	get populationFields() {
		return Object.keys(
			_.pickBy(this._fields, field => {
				return field.isLinked
			})
		)
	}

	/**
	 * The Mongoose schema for the collection
	 * 
	 * @readonly
	 * @memberOf CollectionDefinition
	 */
	get schema() {
		Object.keys(this._fields).forEach(key => {
			const field = this._fields[key]

			this._schema.path(key, field.getSchemaType())
		})
		
		return this._schema
	}

	/**
	 * The collection's meta properties
	 * 
	 * @memberOf CollectionDefinition
	 */
	get meta() {
		return Object.assign({}, this._meta)
	}

	set meta(meta) {
		this._meta = Object.assign({}, meta)
	}

	/**
	 * Get the meta property, or all meta if no property provided
	 * 
	 * If the property value is an object, a copy of the object
	 * is returned in order to maintain immutability.
	 * 
	 * @param  {String} [prop]
	 * @return {*}
	 */
	getMeta(prop) {
		if (!prop) {
			return Object.assign({}, this._meta)
		}

		if (typeof this._meta[prop] === 'object') {
			return Object.assign({}, this._meta[prop])
		} else {
			return this._meta[prop]
		}
	}

	/*
	 * Methods for accessing definition fields
	 * ---
	 */

	/**
	 * Get a map of collection fields.
	 * 
	 * If `flatten` return map in dot notation for any nested fields
	 * 
	 * @param {Boolean} flatten
	 * @returns {Object}
	 * @memberOf CollectionDefinition
	 */
	getFields(flatten) {
		if (!flatten) {
			return this._fields
		}

		return Object.keys(this._fields).reduce((acc, key) => {
			return Object.assign({}, acc, this._fields[key].getFlatFields())
		}, {})
	}

	/**
	 * Get a single field
	 * 
	 * @param {String} name
	 * @returns {FieldDefinition}
	 * @memberOf CollectionDefinition
	 */
	getField(name) {
		return name.indexOf('.') + 1 ? this.getFields(true)[name] : this._fields[name]
	}

	/**
	 * Get an array of field names
	 * 
	 * @returns {Array}
	 * @memberOf CollectionDefinition
	 */
	getFieldNames() {
		return Object.keys(this._fields)
	}

	/**
	 * Get a map of field objects suitable for use as a Mongoose schemaType.
	 * 
	 * If `flatten` nested fields will use the dot notation.
	 * 
	 * @param {Boolean} flatten
	 * @returns {Object}
	 * @memberOf CollectionDefinition
	 */
	getFieldSchemaTypes(flatten) {
		const initial = flatten ? { flattened: true } : {}

		return Object.keys(this._fields).reduce((acc, key) => {
			let schemaType = this._fields[key].getSchemaType(flatten)

			if (flatten && this._fields[key].isMultiValue) {
				schemaType = { [key]: [schemaType[0][key]] }
			}

			return Object.assign({}, acc,
				flatten ? schemaType : { [key]: schemaType }
			)
		}, initial)
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
	 * @param {String} name
	 * @returns {Array}
	 * @memberOf CollectionDefinition
	 */
	getFieldTypes(name) {
		const flatFields = this.getFields(true)
		
		if (this._fields[name]) {
			return this._fields[name].getTypeNames()
		} else if (flatFields[name]) {
			return flatFields[name].getTypeNames()
		} else {
			return
		}
	}

	/**
	 * Inflate fields that have been flattened
	 * 
	 * @example
	 * const fields = {
	 *     'name.first': {
	 *         flattened: true,
	 *         label: 'First',
	 *         schemaType: { type: String }
	 *     },
	 *     'name.last': {
	 *         flattened: true,
	 *         label: 'Last',
	 *         schemaType: { type: String }
	 *     },
	 * }
	 * 
	 * inflateFields(fields)
	 * // {
	 * //     name: {
	 * //        label: 'Name',
	 * //        schemaType: {
	 * //            first: { label: 'First', type: String },
	 * //            last: { label: 'Last', type: String }
	 * //        }
	 * //     }
	 * // }
	 * 
	 * @param {Object} fields
	 * @returns {Object}
	 * @memberOf CollectionDefinition
	 */
	inflateFields(fields) {
		return Object.keys(fields).reduce((acc, key) => {
			const root = key.split('.')[0]

			return Object.assign({}, acc, {
				[root]: this._fields[root]
			})
		}, {})
	}

	/**
	 * Add a new field to the collection.
	 * 
	 * This cannot be done to a collection that is locked
	 * by building a model.
	 * 
	 * @param {FieldDefinition} field
	 * @returns {CollectionDefinition}
	 * @memberOf CollectionDefinition
	 */
	addField(field) {
		if (this._locked) throw new Error('Attempting to add a new field to a locked collection')
		if (!(field instanceof FieldDefinition)) throw new Error('Cannot add a field that is not a valid FieldDefinition')

		this._fields[field.name] = field
		this.schema.path(field.name, field.getSchemaType())

		return this
	}

	/**
	 * Remove a field from the collection
	 * 
	 * This cannot be done to a collection that is locked
	 * by building a model.
	 * 
	 * @param {String} name
	 * @returns {CollectionDefinition}
	 * @memberOf CollectionDefinition
	 */
	removeField(name) {
		if (this._locked) throw new Error('Attempting to remove a field from a locked collection')
		
		delete this._fields[name]
		this.schema.remove(name)

		return this
	}

	/**
	 * Get the available options for all linked fields
	 * 
	 * @return {Promise}
	 */
	getLinkedOptions() {
		const fieldsWithLinks = Object.keys(this._fields)
			.filter(key => {
				return this._fields[key].isLinked
			})
			.reduce((acc, key) => {
				return Object.assign({}, acc, {
					[key]: this._fields[key]
				})
			}, {})
		
		const promises = Object.keys(fieldsWithLinks).map(key => {
			const field = fieldsWithLinks[key]
			const display = field.getLinkedDisplay()

			return new Promise((res, rej) => {
				field.getLinkedCollection()
					.read(null, display)
					.then(docs => {
						res({
							field: key,
							options: docs
						})
					})
					.catch(err => rej(err))
			})
		})

		return Promise.all(promises)
	}

	/*
	 * Methods for accessing virtual fields
	 * ---
	 */

	addVirtual(path, method, fn) {
		if (this._locked) throw new Error('Attempting to add a new virtual to locked collection')

		this.schema.virtual(path)[method](fn)
		return this
	}

	removeVirtual(path, method) {
		if (this._locked) throw new Error('Attempting to remove a virtual to locked collection')
	
		this.schema.virtuals(path)[method](() => {})
		return this
	}

	buildModel() {
		this._locked = true

		return ModelFactory.create(
			this.connection.model(this.singular, this.schema)
		)
	}

	attachHook(when, type, cb) {
		if (when !== 'pre' && when !== 'post') {
			throw new Error('Must include "pre" or "post" when attaching a hook')
		}

		this.schema[when].call(this.schema, type, cb)
		return this
	}
}

module.exports = CollectionDefinition