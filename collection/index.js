'use strict'

const mongoose             = require('mongoose')
const VersionControl       = require('../lib/version-control')
const FieldDefinition      = require('../field-definition')
const DefinitionJsonParser = require('../lib/definition-json-parser')

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
		this._factory = factory
		this._connection = this._factory.connection

		this._definition = DefinitionJsonParser(name, def, this._connection)

		if (this._definition.versioned) {
			VersionControl.applyCollectionMethods(this, this._definition.schema)
		}
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
		return this._definition
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
	 * The name of the collection model
	 * 
	 * @readonly
	 * @memberOf Collection
	 */
	get modelName() {
		return this._model.modelName
	}

	/**
	 * An array of fields that will be populated by
	 * other collections
	 * 
	 * @readonly
	 * @deprecated
	 * @memberOf Collection
	 */
	get populationFields() {
		return this._definition.populationFields
	}

	/**
	 * The model schema
	 * 
	 * @readonly
	 * @deprecated
	 * @memberOf Collection
	 */
	get schema() {
		return this._definition.schema
	}

	/**
	 * The collection's metadata as defined in the
	 * collection definition'
	 * 
	 * @readonly
	 * @deprecated
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
	 * @deprecated
	 * @memberOf Collection
	 */
	get defaultField() {
		return this._definition.defaultField
	}

	/**
	 * Get the field ref from a field definition
	 * 
	 * @param  {Object} fieldDef
	 * @return {String}
	 * @static
	 * @deprecated
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
	 * @deprecated
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
	 * @deprecated
	 */
	getFields(flatten) {
		return this._definition.getFieldNames().reduce((acc, name) => {
			let data

			if (flatten) {
				data = this.getField(name, flatten).reduce((fields, field) => {
					return Object.assign({}, fields, {
						[field.name]: field
					})
				}, {})
			} else {
				data = { [name]: this.getField(name) }
			}
			
			return Object.assign({}, acc, data)
		}, {})
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
	 * @deprecated
	 */
	inflateFields(flattened) {
		return this._definition.inflateFields(flattened)
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
	 * @deprecated
	 */
	getField(fieldName, flatten) {
		const field = this._definition.getField(fieldName)

		if (!field) return
		
		if (!flatten || field.isMultiValue) {
			return Object.assign({}, field.toObject(), {
				referenceModel: field.isLinked ? field.getLinkedCollection().model : undefined,
				refrenceCollection: field.isLinked ? field.getLinkedCollection() : undefined,
			})
		}

		const flatFields = field.getFlatFields()

		return Object.keys(flatFields).map(key => {
			return {
				name: key,
				label: flatFields[key].label,
				flattened: true,
				schemaType: flatFields[key].toObject()
			}
		})
	}

	/**
	 * Get the available options for all reference fields
	 * 
	 * @return {Promise}
	 * @deprecated
	 */
	getRefOptions() {
		return this._definition.getLinkedOptions()
	}

	/**
	 * Get the field type name
	 * 
	 * Normalizes the name for fields that may
	 * contain an array of values.
	 * 
	 * @param  {String} fieldName
	 * @return {String}
	 * @deprecated
	 */
	getFieldTypeName(fieldName) {
		return this._definition.getField(fieldName).type.name
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
	 * @deprecated
	 */
	getFieldTypes(fieldName) {
		return this._definition.getFieldTypes(fieldName)
	}

	/**
	 * Get the meta property, or all meta if no property provided
	 * 
	 * If the property value is an object, a copy of the object
	 * is returned in order to maintain immutability.
	 * 
	 * @param  {String} [prop]
	 * @return {*}
	 * @deprecated
	 */
	getMeta(prop) {
		return this._definition.getMeta(prop)
	}

	/**
	 * Extend a field schema
	 * 
	 * @param  {String} fieldName
	 * @param  {String} prop
	 * @param  {*} value
	 * @return {Collection}
	 * @deprecated
	 */
	extendFieldSchema(fieldName, prop, value) {
		const field = this._definition.getField(fieldName)
		
		if (field) field.extendType(prop, value)
		return this
	}

	/**
	 * Add a field to the collection definition
	 * 
	 * @param {String} name
	 * @param {String} label
	 * @param {*}      schemaType
	 * @return {Collection}
	 * @deprecated
	 */
	addField(name, label, schemaType) {
		const field = new FieldDefinition(name, label, schemaType)

		this._definition.addField(field)
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
	 * @deprecated
	 */
	attachHook(when, type, cb) {
		this._definition.attachHook(when, type, cb)
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

	/**
	 * Register the collection model
	 * 
	 * @return {Collection}
	 */
	register() {
		this._model = this._definition.buildModel()

		// Force update operations to return the updated documents
		// rather than the originals
		this.useAfter('update', docs => {
			if (Array.isArray(docs)) {
				return Promise.all(
					docs.map(d => {
						return this.readById(d.id)
					})
				)
			} else {
				return this.readById(docs.id)
			}
		})

		// Save a new version when the document is updated
		if (this._definition.versioned) {
			this.useAfter('update', saveDocsVersions)
			this.useAfter('create', saveDocsVersions)
		}

		function saveDocsVersions(docs) {
			if (Array.isArray(docs)) {
				return Promise.all(
					docs.map(d => {
						return d.saveVersion().then(() => d) 
					})
				)
			} else if (docs) {
				return docs
					.saveVersion()
					.then(() => {
						return docs
					})
			} else {
				return docs
			}
		}

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
		return this.model
			.findByIdAndUpdate(id, data, {
				new: true,
				runValidators: true
			})
			.then(doc => {
				return doc
					.saveVersion()
					.then(() => {
						return doc
					})
			})
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
