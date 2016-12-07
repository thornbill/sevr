/*eslint-env node, mocha */
'use strict'

const chai            = require('chai')
const chaiAsPromised  = require('chai-as-promised')
const spies           = require('chai-spies')
const mongoose        = require('mongoose')
const mockgoose       = require('mockgoose')
const Collection      = require('../../../collection')
const VersionControl  = require('../../../lib/version-control')
const collectionDefs  = require('../../fixtures/collections')

const expect = chai.expect
const fixtures = {
	definitions: {
		test1: {
			singular: 'Test1',
			fields: {
				'field1': {
					label: 'Field1',
					schemaType: { type: String }
				},
				'field2': {
					label: 'Field2',
					schemaType: {
						type: mongoose.Schema.Types.ObjectId,
						ref: 'User'
					}
				},
				'field3': {
					label: 'name',
					schemaType: {
						first: { label: 'first', type: String },
						last: { label: 'last', type: String }
					}
				},
				'field4': {
					label: 'values',
					schemaType: [{ type: String }]
				}
			}
		},
		user: {
			singular: 'User',
			fields: {
				'name': {
					label: 'Name',
					schemaType: { type: String }
				}
			}
		}
	}
}

chai.use(chaiAsPromised)
chai.use(spies)

describe('Collection', function() {

	let factory = {
		connection: null,
		getInstanceWithModel: function() {
			return { model: {} }
		}
	}

	describe('constructor()', function() {
		beforeEach(function(done) {
			mockgoose(mongoose)
				.then(() => {
					mongoose.connect('mongodb://testing', err => {
						factory.connection = mongoose.connection
						done(err)
					})
				})
		})

		afterEach(function(done) {
			delete mongoose.connection.models['Test1']
			delete mongoose.connection.models['User']
			mongoose.unmock(done)
		})

		it('should set the collection name', function() {
			const testCollection = new Collection('test1', fixtures.definitions.test1, factory)
			expect(testCollection.name).to.equal('test1')
		})

		it('should set the definition', function() {
			const testCollection = new Collection('test1', fixtures.definitions.test1, factory)
			expect(testCollection.definition).to.be.instanceof(Object)
		})

		it('should set the model name to the singular property', function() {
			const testCollection = new Collection('test1', fixtures.definitions.test1, factory)
			expect(testCollection.modelName).to.equal(fixtures.definitions.test1.singular)
		})

		it('should set the population fields', function() {
			const testCollection = new Collection('test1', fixtures.definitions.test1, factory)
			const populationFields = testCollection.populationFields
			expect(populationFields).to.be.instanceof(Array)
			expect(populationFields).to.eql(['field2'])
		})

		it('should add version control methods to documents by default', function() {
			const usersCollection = new Collection('users', collectionDefs.users, factory)

			return usersCollection.model
				.create({
					_id: mongoose.Types.ObjectId(),
					username: 'testDoc',
					email: 'test@doc.com'
				})
				.then(doc => {
					expect(doc).to.respondTo('getVersions')
					expect(doc).to.respondTo('getLatestVersion')
					expect(doc).to.respondTo('getDiffs')
					expect(doc).to.respondTo('getLatestDiff')
					expect(doc).to.respondTo('saveVersion')
					expect(doc).to.respondTo('restoreVersion')
				})
		})

		it('should not add version control methods to documents when disabled', function() {
			const def = Object.assign({}, collectionDefs.users, { versioned: false })
			const usersCollection = new Collection('users', def, factory)

			return usersCollection.model
				.create({
					_id: mongoose.Types.ObjectId(),
					username: 'testDoc',
					email: 'test@doc.com'
				})
				.then(doc => {
					expect(doc).to.not.respondTo('getVersions')
					expect(doc).to.not.respondTo('getLatestVersion')
					expect(doc).to.not.respondTo('getDiffs')
					expect(doc).to.not.respondTo('getLatestDiff')
					expect(doc).to.not.respondTo('saveVersion')
					expect(doc).to.not.respondTo('restoreVersion')
				})
		})
	})

	describe('isValidDefinition()', function() {
		it('should return true for a valid definition', function() {
			expect(Collection.isValidDefinition({
				singular: 'Users',
				fields: {}
			})).to.be.true

			expect(Collection.isValidDefinition({
				singular: 'Users',
				fields: {
					name: {
						label: 'Name',
						schemaType: { type: String }
					}
				}
			})).to.be.true
		})

		it('should return false when `singular` is missing', function() {
			let errors = []
			expect(Collection.isValidDefinition({
				fields: {}
			}, errors)).to.be.false

			expect(errors).to.have.length(2)
		})

		it('should return false when `fields` is missing', function() {
			let errors = []
			expect(Collection.isValidDefinition({
				singular: 'Test'
			}, errors)).to.be.false

			expect(errors).to.have.length(2)
		})
	})

	describe('isValidField()', function() {
		it('should return true for valid field definition', function() {
			let errors = []
			expect(Collection.isValidField({
				label: 'Text',
				schemaType: { type: String }
			}, 'test', errors)).to.be.true
		})

		it('should return false for when `label` is missing', function() {
			let errors = []
			expect(Collection.isValidField({
				schemaType: { type: String }
			}, 'test', errors)).to.be.false
			expect(errors).to.have.length(2)
		})

		it('should return false for when `schemaType` is missing', function() {
			let errors = []
			expect(Collection.isValidField({
				label: 'Text'
			}, 'test', errors)).to.be.false

			expect(errors).to.have.length(2)
		})
	})

	describe('isValidFieldRef()', function() {
		it('should return true for valid field definition', function() {
			let errors = []
			expect(Collection.isValidFieldRef({
				label: 'Text',
				schemaType: { 
					type: mongoose.Schema.Types.ObjectId,
					ref: 'User'
				}
			}, 'test', ['User'], errors)).to.be.true
		})
		
		it('should return false for when `ref` is not a collection', function() {
			let errors = []
			expect(Collection.isValidFieldRef({
				label: 'Text',
				schemaType: {
					type: mongoose.Schema.Types.ObjectId,
					ref: 'User'
				}
			}, 'test', ['Test'], errors)).to.be.false
			
			expect(errors).to.have.length(1)
		})
	})

	describe('getFieldRef()', function() {
		it('should return the ref when schemaType is an object', function() {
			expect(Collection.getFieldRef({
				schemaType: { type: String, ref: 'TestRef' }
			})).to.equal('TestRef')
		})

		it('should return the ref when schemaType is an array', function() {
			expect(Collection.getFieldRef({
				schemaType: [{ type: String, ref: 'TestRef' }]
			})).to.equal('TestRef')
		})

		it('should return undefined when no ref', function() {
			expect(Collection.getFieldRef({
				schemaType: { type: String }
			})).to.be.undefined
		})
	})

	describe('getField()', function() {
		beforeEach(function(done) {
			mockgoose(mongoose)
				.then(() => {
					mongoose.connect('mongodb://testing', err => {
						factory.connection = mongoose.connection
						done(err)
					})
				})
		})

		afterEach(function(done) {
			delete mongoose.connection.models['Test1']
			mongoose.unmock(done)
		})

		it('should return a field object', function() {
			const testCollection = new Collection('test1', fixtures.definitions.test1, factory)
			const field = testCollection.getField('field1')
			expect(field).to.be.instanceof(Object)
		})

		it('should return a field object with referenceModel', function() {
			const testCollection = new Collection('test1', fixtures.definitions.test1, factory)
			const field = testCollection.getField('field2')
			expect(field).to.be.instanceof(Object)
			expect(field).to.haveOwnProperty('referenceModel')
		})

		it('should flatten the field if nested and enabled', function() {
			const testCollection = new Collection('test1', fixtures.definitions.test1, factory)
			const field3 = testCollection.getField('field3', true)
			expect(field3).to.be.instanceof(Array)
			expect(field3).to.have.deep.property('[0].name', 'field3.first')
			expect(field3).to.have.deep.property('[1].name', 'field3.last')
			expect(field3).to.have.deep.property('[1].flattened', true)
		})

		it('should not flatten fields that store arrays of values', function() {
			const testCollection = new Collection('test1', fixtures.definitions.test1, factory)
			const field4 = testCollection.getField('field4', true)
			expect(field4).to.be.instanceof(Object)
			expect(field4.name).to.eql('field4')
		})
	})

	describe('getFields()', function() {
		beforeEach(function(done) {
			mockgoose(mongoose)
				.then(() => {
					mongoose.connect('mongodb://testing', err => {
						factory.connection = mongoose.connection
						done(err)
					})
				})
		})

		afterEach(function(done) {
			delete mongoose.connection.models['Test1']
			mongoose.unmock(done)
		})

		it('should return all field definitions', function() {
			const testCollection = new Collection('test1', fixtures.definitions.test1, factory)
			const fields = testCollection.getFields()
			expect(fields).to.be.instanceOf(Object)
			expect(fields).to.haveOwnProperty('field1')
			expect(fields).to.haveOwnProperty('field2')
		})

		it('should flatten all nested fields if enabled', function() {
			const testCollection = new Collection('test1', fixtures.definitions.test1, factory)
			const fields = testCollection.getFields(true)

			expect(fields).to.be.instanceOf(Object)
			expect(fields).to.haveOwnProperty('field1')
			expect(fields).to.haveOwnProperty('field2')

			expect(fields).to.haveOwnProperty('field3.first')
			expect(fields).to.haveOwnProperty('field3.last')
			expect(fields['field3.first']).to.haveOwnProperty('label')
			expect(fields['field3.first']).to.haveOwnProperty('name')
			expect(fields['field3.first']).to.haveOwnProperty('schemaType')
			expect(fields['field3.first']).to.haveOwnProperty('flattened')
			expect(fields['field3.last']).to.haveOwnProperty('flattened')
		})
	})

	describe('inflateFields()', function() {
		beforeEach(function(done) {
			mockgoose(mongoose)
				.then(() => {
					mongoose.connect('mongodb://testing', err => {
						factory.connection = mongoose.connection
						done(err)
					})
				})
		})

		afterEach(function(done) {
			delete mongoose.connection.models['Test1']
			mongoose.unmock(done)
		})

		it('should expand flattened fields', function() {
			const testCollection = new Collection('test1', fixtures.definitions.test1, factory)
			const fieldsFlat = {
				'field1': {
					label: 'Field1',
					schemaType: { type: String }
				},
				'field2': {
					label: 'Field2',
					schemaType: {
						type: mongoose.Schema.Types.ObjectId,
						ref: 'User'
					}
				},
				'field3.first': {
					flattened: true,
					label: 'first',
					schemaType: { type: String }
				},
				'field3.last': {
					flattened: true,
					label: 'last',
					schemaType: { type: String }
				}
			}
			const fieldsExpanded = testCollection.inflateFields(fieldsFlat)

			expect(fieldsExpanded).to.have.deep.property('field1.name', 'field1')
			expect(fieldsExpanded).to.have.deep.property('field2.name', 'field2')
			expect(fieldsExpanded).to.have.deep.property('field3.name', 'field3')
			expect(fieldsExpanded).to.have.deep.property('field3.label', 'name')
		})
	})

	describe('getFieldTypeName()', function() {
		beforeEach(function(done) {
			mockgoose(mongoose)
				.then(() => {
					mongoose.connect('mongodb://testing', err => {
						factory.connection = mongoose.connection
						done(err)
					})
				})
		})

		afterEach(function(done) {
			delete mongoose.connection.models['Test1']
			mongoose.unmock(done)
		})

		it('should return the type name if schemaType is object', function() {
			const testCollection = new Collection('test1', {
				singular: 'Test1',
				fields: {
					field1: {
						label: 'name',
						schemaType: { name: 'stringType', type: String }
					},
					field2: {
						label: 'email',
						schemaType: [{ name: 'emailType', type: String }]
					}
				}
			}, factory)

			expect(testCollection.getFieldTypeName('field1')).to.equal('stringType')
		})

		it('should return the type name if schemaType is array', function() {
			const testCollection = new Collection('test1', {
				singular: 'Test1',
				fields: {
					field1: {
						label: 'name',
						schemaType: { name: 'stringType', type: String }
					},
					field2: {
						label: 'email',
						schemaType: [{ name: 'emailType', type: String }]
					}
				}
			}, factory)

			expect(testCollection.getFieldTypeName('field2')).to.equal('emailType')
		})
	})

	describe('getFieldTypes()', function() {
		beforeEach(function(done) {
			mockgoose(mongoose)
				.then(() => {
					mongoose.connect('mongodb://testing', err => {
						factory.connection = mongoose.connection
						done(err)
					})
				})
		})

		afterEach(function(done) {
			delete mongoose.connection.models['Test1']
			mongoose.unmock(done)
		})

		it('should return an array of type values', function() {
			const testCollection = new Collection('test1', {
				singular: 'Test1',
				fields: {
					field1: {
						label: 'name',
						schemaType: { name: 'stringType', type: String }
					},
					field2: {
						label: 'email',
						schemaType: [{ name: 'emailType', type: mongoose.Schema.Types.String }]
					},
					field3: {
						label: 'full name',
						schemaType: {
							first: { name: 'text', label: 'First', type: String },
							last: { name: 'text', label: 'Last', type: String }
						}
					}
				}
			}, factory)

			expect(testCollection.getFieldTypes('field1')).to.eql([
				'field1',
				'stringType',
				'String'
			])
			expect(testCollection.getFieldTypes('field2')).to.eql([
				'field2',
				'emailType',
				'String'
			])
		})

		it('should include "COMPLEX" for fields with nested values', function() {
			const testCollection = new Collection('test1', {
				singular: 'Test1',
				fields: {
					field1: {
						label: 'name',
						schemaType: { name: 'stringType', type: String }
					},
					field2: {
						label: 'email',
						schemaType: [{ name: 'emailType', type: mongoose.Schema.Types.String }]
					},
					field3: {
						label: 'full name',
						schemaType: {
							first: { name: 'text', label: 'First', type: String },
							last: { name: 'text', label: 'Last', type: String }
						}
					}
				}
			}, factory)

			expect(testCollection.getFieldTypes('field3')).to.eql([
				'field3',
				'COMPLEX'
			])
		})
	})

	describe('getMeta()', function() {
		beforeEach(function(done) {
			mockgoose(mongoose)
				.then(() => {
					mongoose.connect('mongodb://testing', err => {
						factory.connection = mongoose.connection
						done(err)
					})
				})
		})

		afterEach(function(done) {
			delete mongoose.connection.models['User']
			delete mongoose.connection.models['Post']
			mongoose.unmock(done)
		})

		it('should return the meta property specified', function() {
			const collectionWithMeta = new Collection('users', collectionDefs.users, factory)

			expect(collectionWithMeta.getMeta('description'))
				.to.equal(collectionDefs.users.meta.description)
		})

		it('should return all meta data if none specified', function() {
			const collectionWithMeta = new Collection('users', collectionDefs.users, factory)

			expect(collectionWithMeta.getMeta()).to.eql(collectionDefs.users.meta)
			expect(collectionWithMeta.getMeta()).to.not.equal(collectionDefs.users.meta)

			expect(collectionWithMeta.meta).to.eql(collectionDefs.users.meta)
		})

		it('should return undefined if property does not exist', function() {
			const collectionWithMeta = new Collection('users', collectionDefs.users, factory)

			expect(collectionWithMeta.getMeta('foo')).to.be.undefined
		})

		it('should return undefined if no metadata exists', function() {
			const collectionWithoutMeta = new Collection('posts', collectionDefs.posts, factory)

			expect(collectionWithoutMeta.getMeta()).to.be.undefined
			expect(collectionWithoutMeta.getMeta('description')).to.be.undefined

			expect(collectionWithoutMeta.meta).to.be.undefined
		})
	})

	describe('defaultField()', function() {
		beforeEach(function(done) {
			mockgoose(mongoose)
				.then(() => {
					mongoose.connect('mongodb://testing', err => {
						factory.connection = mongoose.connection
						done(err)
					})
				})
		})

		afterEach(function(done) {
			delete mongoose.connection.models['Test1']
			delete mongoose.connection.models['Test2']
			mongoose.unmock(done)
		})

		it('should return the definition property `defaultField` if present', function() {
			const testCollection1 = new Collection('test1', {
				singular: 'Test1',
				fields: {
					name: {
						label: 'name',
						schemaType: { name: 'stringType', type: String }
					}
				},
				defaultField: 'name'
			}, factory)

			expect(testCollection1.defaultField).to.eql('name')
		})

		it('should return `_id` if `defaultField` is not defined', function() {
			const testCollection2 = new Collection('test2', {
				singular: 'Test2',
				fields: {
					email: {
						label: 'email',
						schemaType: { name: 'stringType', type: String }
					}
				}
			}, factory)

			expect(testCollection2.defaultField).to.eql('_id')
		})
	})

	describe('addField()', function() {
		beforeEach(function(done) {
			mockgoose(mongoose)
				.then(() => {
					mongoose.connect('mongodb://testing', err => {
						factory.connection = mongoose.connection
						done(err)
					})
				})
		})

		afterEach(function(done) {
			delete mongoose.connection.models['Collection']
			mongoose.unmock(done)
		})
		
		it('should add a new path to the schema', function() {
			const coll = new Collection('coll', {
				singular: 'Collection',
				fields: {
					field1: {
						label: 'Field1',
						schemaType: String
					}
				}
			}, factory)

			coll.addField('field2', 'Field2', String)

			expect(coll.schema.path('field2')).to.not.be.undefined
		})

		it('should add a field to the collection definition', function() {
			const coll = new Collection('coll', {
				singular: 'Collection',
				fields: {
					field1: {
						label: 'Field1',
						schemaType: String
					}
				}
			}, factory)

			coll.addField('field2', 'Field2', String)

			expect(coll.definition).to.have.deep.property('fields.field2')
			expect(coll.definition.fields.field2).to.have.property('label', 'Field2')
			expect(coll.definition.fields.field2).to.have.property('schemaType', String)
		})
	})

	describe('attachHook', function () {
		beforeEach(function(done) {
			mockgoose(mongoose)
				.then(() => {
					mongoose.connect('mongodb://testing', err => {
						factory.connection = mongoose.connection
						done(err)
					})
				})
		})

		afterEach(function(done) {
			delete mongoose.connection.models['User']
			mongoose.unmock(done)
		})

		it('should add a pre hook', function() {
			const users = new Collection('users', collectionDefs.users, factory)
			const hook = chai.spy((next) => { next() })

			users.attachHook('pre', 'save', hook)
			return users.create({
				username: 'testUser',
				email: 'test@testerson.com'
			}).then(() => {
				expect(hook).to.have.been.called.exactly.once
			})
		})

		it('should add a post hook', function() {
			const users = new Collection('users', collectionDefs.users, factory)
			const hook = chai.spy((doc, next) => { next() })

			users.attachHook('post', 'save', hook)
			return users.model.create({
				username: 'testUser',
				email: 'test@testerson.com'
			}).then(() => {
				expect(hook).to.have.been.called.exactly.once
			})
		})

		it('should throw an error if `when` is not "pre" or "post"', function() {
			const users = new Collection('users', collectionDefs.users, factory)
			const hook = chai.spy((doc, next) => { next() })
			const fn = () => { users.attachHook('foo', 'save', hook) }

			expect(fn).to.throw('Must include "pre" or "post" when attaching a hook')
		})
	})

	describe('CRUD operations', function() {
		let ids = [
			new mongoose.Types.ObjectId(),
			new mongoose.Types.ObjectId()
		]

		describe('readById()', function() {
			beforeEach(function(done) {
				mockgoose(mongoose)
					.then(() => {
						mongoose.connect('mongodb://testing', err => {
							factory.connection = mongoose.connection
							done(err)
						})
					})
			})

			afterEach(function(done) {
				delete mongoose.connection.models['posts']
				mongoose.unmock(done)
			})

			it('should return a promise', function() {
				const usersCollection = new Collection('users', collectionDefs.users, factory)

				expect(usersCollection.readById(12345)).to.be.instanceof(Promise)
			})

			it('should return a query', function() {
				const usersCollection = new Collection('users', collectionDefs.users, factory)

				expect(usersCollection.readById(12345, null, null, true)).to.be.instanceof(mongoose.Query)
			})

			it('should resolve with a single document', function() {
				const usersCollection = new Collection('users', collectionDefs.users, factory)

				return usersCollection.model
					.create([
						{
							_id: ids[0],
							username: 'testDoc',
							email: 'test@doc.com'
						},
						{
							_id: ids[1],
							username: 'johndoe',
							email: 'jdoe@gmail.com'
						}
					])
					.then(() => {
						return usersCollection.readById(ids[0].toString())
					})
					.then(result => {
						expect(result).to.have.property('username', 'testDoc')
						expect(result).to.have.property('email', 'test@doc.com')
					})
			})

			it('should include populated fields with resolved document', function() {
				const usersCollection = new Collection('users', collectionDefs.users, factory)
				const postsCollection = new Collection('posts', collectionDefs.posts, factory)

				return usersCollection.model
					.create([
						{
							_id: ids[0],
							username: 'testDoc',
							email: 'test@doc.com'
						},
						{
							_id: ids[1],
							username: 'johndoe',
							email: 'jdoe@gmail.com'
						}
					])
					.then(() => {
						return postsCollection.model
							.create({
								title: 'Test Post',
								author: ids[0]
							})
					})
					.then(doc => {
						return postsCollection.readById(doc._id, null, true)
					})
					.then(result => {
						expect(result).to.have.deep.property('author.username', 'testDoc')
						expect(result).to.have.deep.property('author.email', 'test@doc.com')
					})
			})

			it('should not include fields where `select` is false in document', function() {
				const usersCollection = new Collection('users', collectionDefs.users, factory)
				const postsCollection = new Collection('posts', collectionDefs.posts, factory)

				return usersCollection.model
					.create([
						{
							_id: ids[0],
							username: 'testDoc',
							email: 'test@doc.com'
						},
						{
							_id: ids[1],
							username: 'johndoe',
							email: 'jdoe@gmail.com'
						}
					])
					.then(() => {
						return postsCollection.model
							.create({
								title: 'Test Post',
								author: ids[0]
							})
					})
					.then(doc => {
						return postsCollection.readById(doc._id, null, true)
					})
					.then(post => {
						expect(post.version).to.be.undefined
					})
			})

			it('should include selected fields when overriding `select` from schema', function() {
				const usersCollection = new Collection('users', collectionDefs.users, factory)
				const postsCollection = new Collection('posts', collectionDefs.posts, factory)

				return usersCollection.model
					.create([
						{
							_id: ids[0],
							username: 'testDoc',
							email: 'test@doc.com'
						},
						{
							_id: ids[1],
							username: 'johndoe',
							email: 'jdoe@gmail.com'
						}
					])
					.then(() => {
						return postsCollection.model
							.create({
								title: 'Test Post',
								author: ids[0]
							})
					})
					.then(doc => {
						return postsCollection.readById(doc._id, '+version', true)
					})
					.then(post => {
						expect(post.version).to.equal(1)
					})
			})

			it('should resolve with null when no matching id', function() {
				const usersCollection = new Collection('users', collectionDefs.users, factory)
				const result = usersCollection.readById(new mongoose.Types.ObjectId())

				return expect(result).to.eventually.be.null
			})
		})

		describe('create()', function() {
			beforeEach(function(done) {
				mockgoose(mongoose)
					.then(() => {
						mongoose.connect('mongodb://testing', err => {
							factory.connection = mongoose.connection
							done(err)
						})
					})
			})

			afterEach(function(done) {
				delete mongoose.connection.models['posts']
				mongoose.unmock(done)
			})

			it('should return a promise', function() {
				const postsCollection = new Collection('posts', collectionDefs.posts, factory)

				const result = postsCollection.create({
					title: 'Test 1',
					content: 'Test 1 content',
					author: ids[0]
				})

				expect(result).to.be.instanceof(Promise)
			})

			it('should resolve with the new document', function() {
				const usersCollection = new Collection('users', collectionDefs.users, factory)
				const postsCollection = new Collection('posts', collectionDefs.posts, factory)

				return usersCollection.model
					.create([
						{
							_id: ids[0],
							username: 'testDoc',
							email: 'test@doc.com'
						},
						{
							_id: ids[1],
							username: 'johndoe',
							email: 'jdoe@gmail.com'
						}
					])
					.then(() => {
						return postsCollection
							.create({
								title: 'Test 2',
								content: 'Test 2 content',
								author: ids[0]
							})
					})
					.then(result => {
						expect(result).to.have.deep.property('title', 'Test 2')
						expect(result).to.have.deep.property('content', 'Test 2 content')
						expect(result).to.have.deep.property('author.username', 'testDoc')
						expect(result).to.have.property('_id')
					})
			})

			it('should reject with validation errors', function(done) {
				const usersCollection = new Collection('users', collectionDefs.users, factory)
				const postsCollection = new Collection('posts', collectionDefs.posts, factory)

				return usersCollection.model
					.create([
						{
							_id: ids[0],
							username: 'testDoc',
							email: 'test@doc.com'
						},
						{
							_id: ids[1],
							username: 'johndoe',
							email: 'jdoe@gmail.com'
						}
					])
					.then(() => {
						return postsCollection
							.create({
								content: 'No title content',
								author: ids[0]
							})
					})
					.then(() => done(true))
					.catch(err => {
						expect(err).to.have.deep.property('errors.title')
						done()
					})
			})

			it('should create a document version for the new document', function() {
				const usersCollection = new Collection('users', collectionDefs.users, factory)
				const postsCollection = new Collection('posts', collectionDefs.posts, factory)

				return usersCollection.model
					.create([
						{
							_id: ids[0],
							username: 'testDoc',
							email: 'test@doc.com'
						},
						{
							_id: ids[1],
							username: 'johndoe',
							email: 'jdoe@gmail.com'
						}
					])
					.then(() => {
						return postsCollection
							.create({
								title: 'Test 2',
								content: 'Test 2 content',
								author: ids[0]
							})
					})
					.then(doc => {
						return VersionControl.getVersions(doc._id)
					})
					.then(versions => {
						expect(versions).to.have.length(1)
						expect(versions[0].doc).to.have.property('title', 'Test 2')
					})
			})
		})

		describe('update()', function() {
			beforeEach(function(done) {
				mockgoose(mongoose)
					.then(() => {
						mongoose.connect('mongodb://testing', err => {
							factory.connection = mongoose.connection
							done(err)
						})
					})
			})

			afterEach(function(done) {
				delete mongoose.connection.models['posts']
				mongoose.unmock(done)
			})

			it('should return a promise', function() {
				const postsCollection = new Collection('posts', collectionDefs.posts, factory)
				
				return postsCollection.model
					.create({
						title: 'Initial Document',
						content: '',
						author: ids[0]
					})
					.then(() => {
						const result = postsCollection.update([
							{ title: 'test1', content: '', author: ids[0] }
						])

						expect(result).to.be.instanceof(Promise)
					})
			})

			it('should resolve with the updated collection', function() {
				const postsCollection = new Collection('posts', collectionDefs.posts, factory)
				
				return postsCollection.model
					.create({
						title: 'Initial Document',
						content: '',
						author: ids[0]
					})
					.then(() => {
						return postsCollection.update([
							{ title: 'test1', content: '', author: ids[0] }
						])
					})
					.then(result => {
						expect(result).to.be.instanceof(Array)
						expect(result).to.have.deep.property('[0].title', 'test1')
						expect(result).to.have.deep.property('[0].content', '')
					})
			})

			it('should overwrite the existing documents', function() {
				const postsCollection = new Collection('posts', collectionDefs.posts, factory)
				
				return postsCollection.model
					.create({
						title: 'Initial Document',
						content: '',
						author: ids[0]
					})
					.then(() => {
						return postsCollection.update([
							{ title: 'test2', content: '', author: ids[0] }
						])
					})
					.then(() => {
						return postsCollection.model.find().exec()
					})
					.then(result => {
						expect(result).to.be.instanceof(Array)
						expect(result).to.have.length(1)
						expect(result).to.not.have.deep.property('[0].title', 'test1')
						expect(result).to.have.deep.property('[0].title', 'test2')
					})
			})

			it('should reject with validation errors', function(done) {
				const postsCollection = new Collection('posts', collectionDefs.posts, factory)
				
				return postsCollection.model
					.create({
						title: 'Initial Document',
						content: '',
						author: ids[0]
					})
					.then(() => {
						return postsCollection.update([
							{ content: '', author: ids[0] }
						])
					})
					.then(() => {
						done(true)
					})
					.catch(err => {
						expect(err).to.have.deep.property('errors.title')
						done()
					})
			})

			it('should create a new document version record for each document', function() {
				const postsCollection = new Collection('posts', collectionDefs.posts, factory)
				
				return postsCollection.model
					.create({
						title: 'Initial Document',
						content: '',
						author: ids[0]
					})
					.then(() => {
						return postsCollection.update([
							{ title: 'test2', content: '', author: ids[0] },
							{ title: 'test3', content: '', author: ids[0] }
						])
					})
					.then(docs => {
						const promises = docs.map(doc => {
							return VersionControl.getVersions(doc._id)
						})

						return Promise.all(promises)
					})
					.then(versions => {
						expect(versions).to.have.length(2)
						expect(versions[0]).to.have.length(1)
						expect(versions[1]).to.have.length(1)
						expect(versions[0][0].doc).to.have.property('title', 'test2')
						expect(versions[1][0].doc).to.have.property('title', 'test3')
					})
			})
		})

		describe('updateById()', function() {
			beforeEach(function(done) {
				mockgoose(mongoose)
					.then(() => {
						mongoose.connect('mongodb://testing', err => {
							factory.connection = mongoose.connection
							done(err)
						})
					})
			})

			afterEach(function(done) {
				delete mongoose.connection.models['posts']
				mongoose.unmock(done)
			})

			it('should return a promise', function() {
				const postsCollection = new Collection('posts', collectionDefs.posts, factory)
				
				return postsCollection.model
					.create({
						title: 'Update Document',
						content: '',
						author: ids[0]
					})
					.then(doc => {
						const result = postsCollection.updateById(doc._id, {
							content: 'test1'
						})

						expect(result).to.be.instanceof(Promise)
					})
			})

			it('should resolve with the updated document', function() {
				const postsCollection = new Collection('posts', collectionDefs.posts, factory)

				return postsCollection.model
					.create({
						title: 'Update Document',
						content: '',
						author: ids[0]
					})
					.then(doc => {
						return postsCollection.updateById(doc._id, {
							content: 'test1'
						})
					})
					.then(result => {
						expect(result).to.have.deep.property('title', 'Update Document')
						expect(result).to.have.deep.property('content', 'test1')
					})
			})

			it('should reject with validation errors', function(done) {
				const postsCollection = new Collection('posts', collectionDefs.posts, factory)

				return postsCollection.model
					.create({
						title: 'Update Document',
						content: '',
						author: ids[0]
					})
					.then(doc => {
						return postsCollection.updateById(doc._id, {
							content: 'foobar'
						})
					})
					.then(() => {
						done(true)
					})
					.catch(err => {
						expect(err).to.have.deep.property('errors.content')
						expect(err).to.have.deep.property('errors.content.message', 'content must not equal foobar')
						done()
					})
			})

			it('should store a new document version', function() {
				const postsCollection = new Collection('posts', collectionDefs.posts, factory)

				return postsCollection.model
					.create({
						title: 'Update Document',
						content: '',
						author: ids[0]
					})
					.then(doc => {
						return postsCollection.updateById(doc._id, {
							content: 'test1'
						})
					})
					.then(doc => {
						return VersionControl.getVersions(doc._id)
					})
					.then(versions => {
						expect(versions).to.have.length(1)
						expect(versions[0].doc).to.have.property('content', 'test1')

						return postsCollection.updateById(versions[0].version.documentId, {
							content: 'test2'
						})
					})
					.then(doc => {
						return VersionControl.getVersions(doc._id)
					})
					.then(versions => {
						expect(versions).to.have.length(2)
						expect(versions[0].doc).to.have.property('content', 'test2')
						expect(versions[1].doc).to.have.property('content', 'test1')
					})
			})
		})

		describe('del()', function() {
			beforeEach(function(done) {
				mockgoose(mongoose)
					.then(() => {
						mongoose.connect('mongodb://testing', err => {
							factory.connection = mongoose.connection
							done(err)
						})
					})
			})

			afterEach(function(done) {
				delete mongoose.connection.models['posts']
				mongoose.unmock(done)
			})

			it('should return a promise', function() {
				const postsCollection = new Collection('posts', collectionDefs.posts, factory)

				return postsCollection.model
					.create([
						{
							title: 'Delete1',
							author: ids[0]
						},
						{
							title: 'Delete2',
							author: ids[0]
						}
					])
					.then(() => {
						const result = postsCollection.del()

						expect(result).to.eventually.be.instanceof(Promise) 
					})
			})

			it('should resolve with the deleted documents', function() {
				const postsCollection = new Collection('posts', collectionDefs.posts, factory)

				return postsCollection.model
					.create([
						{
							title: 'Delete1',
							author: ids[0]
						},
						{
							title: 'Delete2',
							author: ids[0]
						}
					])
					.then(() => {
						return postsCollection.del()
					})
					.then(result => {
						expect(result).to.have.length(2)
						expect(result).to.have.deep.property('[0].title', 'Delete1')
						expect(result).to.have.deep.property('[1].title', 'Delete2')
					})
			})

			it('should delete all documents from the collection', function() {
				const postsCollection = new Collection('posts', collectionDefs.posts, factory)

				return postsCollection.model
					.create([
						{
							title: 'Delete1',
							author: ids[0]
						},
						{
							title: 'Delete2',
							author: ids[0]
						}
					])
					.then(() => {
						return postsCollection.del()
					})
					.then(function() {
						return postsCollection.model.find().exec()
					})
					.then(docs => {
						expect(docs).to.be.empty
					})
			})
		})

		describe('delById()', function() {
			beforeEach(function(done) {
				mockgoose(mongoose)
					.then(() => {
						mongoose.connect('mongodb://testing', err => {
							factory.connection = mongoose.connection
							done(err)
						})
					})
			})

			afterEach(function(done) {
				delete mongoose.connection.models['posts']
				mongoose.unmock(done)
			})

			it('should return a promise', function() {
				const postsCollection = new Collection('posts', collectionDefs.posts, factory)

				return postsCollection.model
					.create([
						{
							title: 'Delete1',
							author: ids[0]
						}
					])
					.then(doc => {
						const result = postsCollection.delById(doc._id)

						expect(result).to.be.instanceof(Promise)
					})
			})

			it('should resolve with the deleted document', function() {
				const postsCollection = new Collection('posts', collectionDefs.posts, factory)

				return postsCollection.model
					.create({
						title: 'Delete1',
						content: '',
						author: ids[0]
					})
					.then(doc => {
						return postsCollection.delById(doc._id)
					})
					.then(result => {
						expect(result).to.have.deep.property('title', 'Delete1')
					})
			})
		})
	})

})
