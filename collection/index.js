'use strict'

const format        = require('util').format
const _             = require('lodash')
const mongoose      = require('mongoose')
const SchemaBuilder = require('../lib/schema-builder')
const ModelFactory  = require('../lib/model-factory')()

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

mongoose.Promise = global.Promise

/**
 * Collection
 * 
 * The Collection class is used primarily for interfacing with
 * the data
 * 
 * @class Collection
 */
class Collection {
	constructor(name, def, factory) {
		this._name = name
		this._definition = _.defaultsDeep({}, def)
		this._factory = factory
		this._connection = this._factory.connection

		// Normalize definition fields by adding a name property
		// tht matches the field key
		Object.keys(this._definition.fields).forEach(key => {
			this._definition.fields[key].name = key
		})

		// Check for required properties
		if (!this._definition.hasOwnProperty('singular')) {
			throw new Error(format('Collection `%s` must contain `singular` property', this._name))
		}

		// Create the mongoose model
		try {
			// Do not attempt to recreate the model if it already exists
			if (!this._connection.models.hasOwnProperty(this._definition.singular)) {
				this._model = ModelFactory.create(this._connection.model(this._definition.singular, SchemaBuilder.create(this._definition)))
			} else {
				this._model = ModelFactory.create(this._connection.models[this._definition.singular])
			}
		} catch (err) {
			throw new Error(format('Failed to create collection `%s`:', this._name, err))
		}
	}

	/**
	 * Check if a collection definition is valid
	 * 
	 * @param {Object} definition
	 * @param {Array} [errors] Mutated by the method to return all errors
	 * @return {Boolean}
	 * @static
	 */
	static isValidDefinition(definition, errors) {
		let isValid = true

		requiredProperties.base.forEach(required => {
			if (!definition.hasOwnProperty(required.prop)) {
				errors.push(format('must contain the `%s` property', required.prop))
				isValid = false
			}

			let requiredTypes = Array.isArray(required.type) ? required.type : [required.type]
			let validType = false

			requiredTypes.forEach(type => {
				if (_['is' + type](definition[required.prop])) {
					validType = true
				}
			})

			if (!validType) {
				errors.push(format('`%s` must be of type %s', required.prop, requiredTypes))
				isValid = false
			}
		})

		return isValid
	}


	/**
	 * Check if a field definition is valid
	 * 
	 * @param  {Object} fieldDef
	 * @param  {Array} errors
	 * @return {Boolean}
	 * @static
	 */
	static isValidField(fieldDef, errors) {
		let isValid = true

		requiredProperties.field.forEach(required => {
			if (!fieldDef.hasOwnProperty(required.prop)) {
				errors.push(format('field must contain `%s` property', required.prop))
				isValid = false
			}

			let requiredTypes = Array.isArray(required.type) ? required.type : [required.type]
			let validType = false

			requiredTypes.forEach(type => {
				if (_['is' + type](fieldDef[required.prop])) {
					validType = true
				}
			})

			if (!validType) {
				errors.push(format('`%s` must be of type %s', required.prop, requiredTypes))
				isValid = false
			}
		})

		return isValid
	}

	/**
	 * The Collection name
	 * 
	 * @readonly
	 * @memberOf Collection
	 */
	get name() {
		return this._name
	}

	/**
	 * The collection definition
	 * 
	 * @readonly
	 * @memberOf Collection
	 */
	get definition() {
		return _.defaultsDeep({}, this._definition)
	}

	/**
	 * The name of the collection model
	 * 
	 * @readonly
	 * @memberOf Collection
	 */
	get modelName() {
		return this._definition.singular
	}

	/**
	 * An array of fields that will be populated by
	 * other collections
	 * 
	 * @readonly
	 * @memberOf Collection
	 */
	get populationFields() {
		return Object.keys(
			_.pickBy(this._definition.fields, (field) => {
				if (Array.isArray(field.schemaType)) {
					return field.schemaType[0].hasOwnProperty('ref')
				} else {
					return field.schemaType.hasOwnProperty('ref')
				}
			})
		)
	}

	
	/**
	 * The Mongoose model
	 * 
	 * @readonly
	 * @memberOf Collection
	 */
	get model() {
		return this._model
	}

	/**
	 * The model schema
	 * 
	 * @readonly
	 * @memberOf Collection
	 */
	get schema() {
		return this._model.schema
	}

	/**
	 * The collection's metadata as defined in the
	 * collection definition'
	 * 
	 * @readonly
	 * @memberOf Collection
	 */
	get meta() {
		return this.getMeta()
	}

	/**
	 * The default field specified in the collection.
	 * Defaults to `_id`
	 * 
	 * @readonly
	 * @memberOf Collection
	 */
	get defaultField() {
		if (this._definition.hasOwnProperty('defaultField')) {
			return this._definition.defaultField
		} else {
			return '_id'
		}
	}

	/**
	 * Get the field ref from a field definition
	 * 
	 * @param  {Object} fieldDef
	 * @return {String}
	 * @static
	 */
	static getFieldRef(fieldDef) {
		const schemaType = fieldDef.schemaType

		if (Array.isArray(schemaType)) {
			return schemaType[0].ref
		} else {
			return schemaType.ref
		}
	}

	/**
	 * Get the field name used for displaying a refrence field
	 * 
	 * @param  {Object} fieldDef
	 * @return {String}
	 * @static
	 */
	static getFieldRefDisplay(fieldDef) {
		const schemaType = fieldDef.schemaType

		if (Array.isArray(schemaType)) {
			return schemaType[0].display
		} else {
			return schemaType.display
		}
	}

	/**
	 * Return all collection field definitions
	 * 
	 * If flatten is true, the result will flatten all
	 * nested properties.
	 * 
	 * @param  {Boolean} [flatten=false]
	 * @return {Object}
	 */
	getFields(flatten) {
		const fields = {}

		_.values(this._definition.fields).forEach(field => {
			let fieldParsed = this.getField(field.name, flatten)

			// Coerce all fields to an array for consistency
			if (!Array.isArray(fieldParsed)) fieldParsed = [fieldParsed]

			fieldParsed.forEach(subField => {
				fields[subField.name] = subField
			})
		})

		return fields
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
	 * @param  {Object} flattened
	 * @return {Object}
	 */
	inflateFields(flattened) {
		return Object.keys(flattened)
			.reduce((prev, key) => {
				const field = flattened[key]

				if (!field.flattened) return prev.concat(key)

				const parts = key.split('.')
				const parent = parts[0]

				if (prev.indexOf(parent) < 0) {
					return prev.concat(parent)
				} else {
					return prev
				}
			}, [])
			.reduce((prev, key) => {
				return Object.assign({}, prev, {
					[key]: this.getField(key)
				})
			}, {})
	}

	/**
	 * Return a field from the definition.
	 * 
	 * If the field has a ref, add `referenceModel` property.
	 * Optionally flatten a nested property structure.
	 * 
	 * @param  {String}  fieldName
	 * @param  {Boolean} [flatten=false]
	 * @return {Object|Array}
	 */
	getField(fieldName, flatten) {
		if (!this._definition.fields.hasOwnProperty(fieldName)) {
			return
		}

		const field = _.assign({}, this._definition.fields[fieldName])
		const ref = Collection.getFieldRef(field)

		if (ref) {
			field.referenceModel = this._factory.getInstanceWithModel(ref).model
			field.referenceCollection = this._factory.getInstanceWithModel(ref)
		} else if (flatten && !Array.isArray(field.schemaType) && !field.schemaType.hasOwnProperty('type')) {
			// Flatten nested field
			return Object.keys(field.schemaType).map(fieldKey => {
				const subField = field.schemaType[fieldKey]

				return {
					label: subField.label,
					name: `${field.name}.${fieldKey}`,
					schemaType: { type: subField.type },
					flattened: true
				}
			})
		}

		return field
	}

	/**
	 * Get the available options for all reference fields
	 * 
	 * @return {Promise}
	 */
	getRefOptions() {
		const allFields = this.getFields()
		const refFields = Object.keys(allFields).filter(key => {
			return allFields[key].hasOwnProperty('referenceCollection')
		})
		.reduce((map, key) => {
			return Object.assign({}, map, {
				[key]: allFields[key]
			})
		}, {})

		let promises = []

		Object.keys(refFields).forEach(key => {
			const field = refFields[key]
			const display = Collection.getFieldRefDisplay(field)

			promises.push(new Promise((res, rej) => {
				field.referenceCollection
					.read(null, display)
					.then(docs => {
						res({
							field: key,
							options: docs
						})
					})
					.catch(err => rej(err))
			}))
		})

		return Promise.all(promises)
	}

	/**
	 * Get the field type name
	 * 
	 * Normalizes the name for fields that may
	 * contain an array of values.
	 * 
	 * @param  {String} fieldName
	 * @return {String}
	 */
	getFieldTypeName(fieldName) {
		const fieldsFlat = this.getFields(true)
		const fieldDef = fieldsFlat[fieldName]

		if (Array.isArray(fieldDef.schemaType)) {
			return fieldDef.schemaType[0].name
		} else {
			return fieldDef.schemaType.name
		}
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
	 * @param  {String} fieldName
	 * @return {Array}
	 */
	getFieldTypes(fieldName) {
		const fields = this._definition.fields
		const fieldsFlat = this.getFields(true)

		let field

		if (fields.hasOwnProperty(fieldName)) {
			field = _.assign({}, fields[fieldName])
		} else if (fieldsFlat.hasOwnProperty(fieldName)) {
			field = _.assign({}, fieldsFlat[fieldName])
		} else {
			return
		}

		const types = [fieldName]
		const schema = Array.isArray(field.schemaType) ? field.schemaType[0] : field.schemaType

		if (schema.hasOwnProperty('name')) {
			types.push(schema.name)
			types.push(schema.type.name.replace(/Schema/, ''))
		} else {
			types.push('COMPLEX')
		}

		return types
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
		if (!this._definition.meta) return

		if (!prop) {
			return _.assign({}, this._definition.meta)
		}

		if (typeof this._definition.meta[prop] == 'object') {
			return _.assign({}, this._definition.meta[prop])
		} else {
			return this._definition.meta[prop]
		}
	}

	/**
	 * Extend a field schema
	 * 
	 * @param  {String} field
	 * @param  {String} prop
	 * @param  {*} value
	 * @return {Collection}
	 */
	extendFieldSchema(field, prop, value) {
		if (!this.getField(field)) return
		if (typeof this.schema.path(field)[prop] !== 'function') return

		this.schema.path(field)[prop](value)
		return this
	}

	/**
	 * Add a field to the collection definition
	 * 
	 * @param {String} name
	 * @param {String} label
	 * @param {*}      schemaType
	 * @return {Collection}
	 */
	addField(name, label, schemaType) {
		this._definition.fields[name] = {
			name: name,
			label: label,
			schemaType: schemaType
		}

		SchemaBuilder.addPath(name, schemaType, this.schema)

		return this
	}

	/**
	 * Attach a hook to the schema
	 * 
	 * `when` must be 'pre' or 'post'.
	 * `type` can be any Mongoose hook type.
	 * 
	 * @param  {String}   when
	 * @param  {String}   type
	 * @param  {Function} cb
	 * @return {Collection}
	 */
	attachHook(when, type, cb) {
		if (when !== 'pre' && when !== 'post') {
			throw new Error('Must include "pre" or "post" when attaching a hook')
		}

		this.schema[when].call(this.schema, type, cb)
		return this
	}

	/**
	 * Add `before` middleware for query operation
	 * 
	 * The callback function will be passed a query
	 * instance, and must return a value in order for
	 * the next middleware to be called. for
	 * asynchronous actions, the callback can return a
	 * Promise. An error can be thrown to exit the middleware
	 * chain.
	 * 
	 * @example
	 * collection.useBefore('read', query => {
	 *     console.log(`called read with ${query}`)
	 *     return query
	 * })
	 * 
	 * @param   {String}     op
	 * @param   {Function}   fn
	 * @return {Collection}
	 */
	useBefore(op, fn) {
		this.model.useBefore(op, fn)
		return this
	}

	/**
	 * Add `after` middleware for query operation
	 * 
	 * The callback function will be passed the resulting
	 * object from the database call.
	 * 
	 * @example
	 * collection.useAfter('read', result => {
	 *     console.log(`called succeeded with ${result}`)
	 *     return result
	 * })
	 * 
	 * @param   {String}     op
	 * @param   {Function}   fn
	 * @return {Collection}
	 */
	useAfter(op, fn) {
		this.model.useAfter(op, fn)
		return this
	}


	// CRUD operations
	// ------------------------------------------------------------

	/**
	 * Read the collection
	 * 
	 * Promise resolves with an array of found documents
	 * or a single document object if `single` is true.
	 * 
	 * @example
	 * // Read all documents from the collection
	 * collection.read()
	 *     .then(res => {
	 *         console.log(res)
	 *     })
	 * 
	 * // Read all documents where qty > 10
	 * collection.read({ qty: { $gt: 10 }})
	 *     .then(res => {
	 *         console.log(res)
	 *     })
	 * 
	 * @param   {Object}  [query]
	 * @param   {Array}   [selectFields]
	 * @param   {Boolean} [populate=false]
	 * @param   {Boolean} [single=false]
	 * @param   {Boolean} [returnQuery=false]
	 * @return {Promise|Query}
	 */
	read(query, selectFields, populate, single, returnQuery) {
		const popFields = populate ? this.populationFields : []
		let modelQuery = this.model

		if (selectFields && !Array.isArray(selectFields)) {
			selectFields = [selectFields]
		}

		if (single) {
			modelQuery = modelQuery.findOne(query)
		} else {
			modelQuery = modelQuery.find(query)
		}

		modelQuery = modelQuery.populate(popFields)

		if (selectFields) {
			modelQuery = modelQuery.select(selectFields.join(' '))
		}

		if (returnQuery) {
			return modelQuery
		} else {
			return modelQuery.exec()
		}
	}

	/**
	 * Read a single document by id
	 * 
	 * Promise resolves with a single document object
	 * 
	 * @param   {ObjectId|String|Number} id
	 * @param   {Array} [selectFields]
	 * @param   {Boolean} [populate=false]
	 * @param   {Boolean} [returnQuery=false]
	 * @return {Promise|Query}
	 */
	readById(id, selectFields, populate, returnQuery) {
		const popFields = populate ? this.populationFields : []
		let modelQuery

		if (selectFields && !Array.isArray(selectFields)) {
			selectFields = [selectFields]
		}

		modelQuery = this.model
			.findById(id)
			.populate(popFields)

		if (selectFields) {
			modelQuery = modelQuery.select(selectFields.join(' '))
		}

		if (returnQuery) {
			return modelQuery
		} else {
			return modelQuery.exec()
		}
	}

	/**
	 * Create a new document within the collection
	 * 
	 * The resolved document will populate all referenced fields
	 * 
	 * @example
	 * collection.create({
	 *     name: { first: 'John', last: 'Doe' }
	 * })
	 * 
	 * @param   {Object}  data
	 * @return {Promise}
	 */
	create(data) {
		const popFields = this.populationFields

		return this.model.create(data)
			.then(doc => {
				if (popFields.length) {
					return doc.populate(popFields.join(' ')).execPopulate()
				} else {
					return doc
				}
			})
	}

	/**
	 * Overwrite the collection with new documents
	 * 
	 * Promise resolves with the array of documents
	 * 
	 * @example
	 * colleciton.update([
	 *     {
	 *         name: 'Shirt'
	 *         qty: 10
	 *     },
	 *     {
	 *         name: 'Pants'
	 *         qty: 5
	 *      }
	 * ])
	 * 
	 * @param   {Array}   docs
	 * @return {Promise}
	 */
	update(docs) {
		const self = this

		return new Promise((res, rej) => {
			// Check for the existence of the collection
			this._connection.db.listCollections({
				name: self.name
			})
			.next((err, info) => {
				if (err) return rej(err)
				res(info ? true : false)
			})
		})
		// Drop the collection if it exists
		.then(hasCollection => {
			if (hasCollection) {
				return self.model.remove({}).exec()
			} else {
				return
			}
		})
		// Insert the new documents
		.then(() => {
			return self.model.insertMany(docs)
		})
	}

	/**
	 * Update a single document by id
	 * 
	 * Promise resolves with the updated document
	 * 
	 * @param   {ObjectId|String|Number} id
	 * @param   {Object}                 data
	 * @return {Promise}
	 */
	updateById(id, data) {
		return this.model.findByIdAndUpdate(id, data, {
			new: true,
			runValidators: true
		}).exec()
	}

	/**
	 * Delete all documents from the collection
	 * 
	 * Promise will resolve with an array of the
	 * documents removed.
	 * 
	 * @returns{Promise}
	 */
	del() {
		return this.model.find().exec()
			.then(docs => {
				let promises = []

				docs.forEach(doc => {
					promises.push(doc.remove())
				})

				return Promise.all(promises)
			})
	}

	/**
	 * Delete a single document from the collection
	 * 
	 * @param   {ObjectId|String|Number} id
	 * @return {Promise}
	 */
	delById(id) {
		return this.model.findByIdAndRemove(id).exec()
	}
}

module.exports = Collection
