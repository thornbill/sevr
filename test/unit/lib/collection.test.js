/*eslint-env node, mocha */
'use strict'

const chai            = require('chai')
const chaiAsPromised  = require('chai-as-promised')
const mongoose        = require('mongoose')
const Collection      = require('../../../collection')
const collectionDefs  = require('../../fixtures/collections')
const config          = require('../../fixtures/ichabod-config')

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

describe('Collection', function() {

	let db
	let factory = {
		connection: null
	}

	before(function() {
		db = mongoose.createConnection(`mongodb://${config.connection.host}:${config.connection.port}/${config.connection.database}`)
		factory.connection = db
	})

	after(function() {
		db.close()
	})

	describe('constructor()', function() {
		let testCollection

		before(function() {
			testCollection = new Collection('test1', fixtures.definitions.test1, factory)
		})

		after(function() {
			delete db.models['Test1']
		})

		it('should set the collection name', function() {
			expect(testCollection.name).to.equal('test1')
		})

		it('should set the definition', function() {
			expect(testCollection.definition).to.be.instanceof(Object)
		})

		it('should set the model name to the singular property', function() {
			expect(testCollection.modelName).to.equal(fixtures.definitions.test1.singular)
		})

		it('should set the population fields', function() {
			const populationFields = testCollection.populationFields
			expect(populationFields).to.be.instanceof(Array)
			expect(populationFields).to.eql(['field2'])
		})

		it('should set the default read/write permissions to *', function() {
			expect(testCollection._permissions).to.eql({
				read: '*',
				write: '*'
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
			}, errors)).to.be.true
		})

		it('should return false for when `label` is missing', function() {
			let errors = []
			expect(Collection.isValidField({
				schemaType: { type: String }
			}, errors)).to.be.false
			expect(errors).to.have.length(2)
		})

		it('should return false for when `schemaType` is missing', function() {
			let errors = []
			expect(Collection.isValidField({
				label: 'Text'
			}, errors)).to.be.false

			expect(errors).to.have.length(2)
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
		let testCollection

		before(function() {
			testCollection = new Collection('test1', fixtures.definitions.test1, {
				getInstanceWithModel: function() {
					return {
						model: {}
					}
				},
				connection: factory.connection
			})
		})

		after(function() {
			delete db.models['Test1']
		})

		it('should return a field object', function() {
			const field = testCollection.getField('field1')
			expect(field).to.be.instanceof(Object)
		})

		it('should return a field object with referenceModel', function() {
			const field = testCollection.getField('field2')
			expect(field).to.be.instanceof(Object)
			expect(field).to.haveOwnProperty('referenceModel')
		})
	})

	describe('getFields()', function() {
		let testCollection

		before(function() {
			testCollection = new Collection('test1', fixtures.definitions.test1, {
				getInstanceWithModel: function() {
					return {
						model: {}
					}
				},
				connection: factory.connection
			})
		})

		after(function() {
			delete db.models['Test1']
		})

		it('should return all field definitions', function() {
			const fields = testCollection.getFields()
			expect(fields).to.be.instanceOf(Object)
			expect(fields).to.haveOwnProperty('field1')
			expect(fields).to.haveOwnProperty('field2')
		})
	})

	describe('getFieldTypeName()', function() {
		let testCollection

		before(function() {
			testCollection = new Collection('test1', {
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
		})

		after(function() {
			delete db.models['Test1']
		})

		it('should return the type name if schemaType is object', function() {
			expect(testCollection.getFieldTypeName('field1')).to.equal('stringType')
		})

		it('should return the type name if schemaType is array', function() {
			expect(testCollection.getFieldTypeName('field2')).to.equal('emailType')
		})
	})

	describe('getMeta()', function() {
		let collectionWithMeta
		let collectionWithoutMeta

		before(function() {
			collectionWithMeta = new Collection('users', collectionDefs.users, factory)
			collectionWithoutMeta = new Collection('posts', collectionDefs.posts, factory)
		})

		after(function() {
			db.db.dropDatabase()
		})

		it('should return the meta property specified', function() {
			expect(collectionWithMeta.getMeta('description'))
				.to.equal(collectionDefs.users.meta.description)
		})

		it('should return all meta data if none specified', function() {
			expect(collectionWithMeta.getMeta()).to.eql(collectionDefs.users.meta)
			expect(collectionWithMeta.getMeta()).to.not.equal(collectionDefs.users.meta)

			expect(collectionWithMeta.meta).to.eql(collectionDefs.users.meta)
		})

		it('should return undefined if property does not exist', function() {
			expect(collectionWithMeta.getMeta('foo')).to.be.undefined
		})

		it('should return undefined if no metadata exists', function() {
			expect(collectionWithoutMeta.getMeta()).to.be.undefined
			expect(collectionWithoutMeta.getMeta('description')).to.be.undefined

			expect(collectionWithoutMeta.meta).to.be.undefined
		})
	})

	describe('canUserRead()', function() {
		let usersCollection
		let postsCollection

		before(function() {
			usersCollection = new Collection('users', collectionDefs.users, factory)
			postsCollection = new Collection('posts', collectionDefs.posts, factory)
		})

		after(function() {
			db.db.dropDatabase()
		})

		it('should return true if read permission matches user', function() {
			expect(usersCollection.canUserRead('admin')).to.be.true
		})

		it('should return true if read permission is wildcard', function() {
			expect(postsCollection.canUserRead('admin')).to.be.true
		})

		it('should return false if read permission does not match user', function() {
			expect(usersCollection.canUserRead('pete')).to.be.false
		})
	})

	describe('userCanWrite()', function() {
		let usersCollection
		let postsCollection
		let tagsCollection

		before(function() {
			usersCollection = new Collection('users', collectionDefs.users, factory)
			postsCollection = new Collection('posts', collectionDefs.posts, factory)
			tagsCollection = new Collection('tags', collectionDefs.tags, factory)
		})

		after(function() {
			db.db.dropDatabase()
		})

		it('should return true if write permission matches user', function() {
			expect(usersCollection.canUserWrite('admin')).to.be.true
			expect(tagsCollection.canUserWrite('author')).to.be.true
		})

		it('should return true if write permission is wildcard', function() {
			expect(postsCollection.canUserWrite('admin')).to.be.true
		})

		it('should return false if write permission does not match user', function() {
			expect(usersCollection.canUserWrite('pete')).to.be.false
			expect(tagsCollection.canUserWrite('contributor')).to.be.false
		})
	})

	describe('CRUD operations', function() {
		let usersCollection
		let postsCollection
		let ids = [
			new mongoose.Types.ObjectId(),
			new mongoose.Types.ObjectId()
		]

		before(function(done) {
			usersCollection = new Collection('users', collectionDefs.users, factory)
			postsCollection = new Collection('posts', collectionDefs.posts, factory)

			usersCollection.model.create([
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
			], (err) => {
				done(err)
			})
		})

		after(function() {
			db.db.dropDatabase()
		})

		describe('readById()', function() {
			let postId

			before(function(done) {
				postsCollection.model.create({
					title: 'Test Post',
					author: ids[0]
				}, (err, doc) => {
					postId = doc._id
					done(err)
				})
			})

			it('should return a promise', function() {
				expect(usersCollection.readById(12345)).to.be.instanceof(Promise)
			})

			it('should resolve with a single document', function() {
				const result = usersCollection.readById(ids[0].toString())

				return Promise.all([
					expect(result).to.eventually.have.property('username', 'testDoc'),
					expect(result).to.eventually.have.property('email', 'test@doc.com')
				])
			})

			it('should include populated fields with resolved document', function() {
				const result = postsCollection.readById(postId, null, true)

				return Promise.all([
					expect(result).to.eventually.have.deep.property('author.username', 'testDoc'),
					expect(result).to.eventually.have.deep.property('author.email', 'test@doc.com')
				])
			})

			it('should not include fields where `select` is false in document', function() {
				const result = postsCollection.readById(postId, null, true)

				return result
					.then(post => {
						expect(post.version).to.be.undefined
					})
			})

			it('should resolve with null when no matching id', function() {
				const result = usersCollection.readById(new mongoose.Types.ObjectId())

				return expect(result).to.eventually.be.null
			})
		})

		describe('create()', function() {
			it('should return a promise', function() {
				const result = postsCollection.create({
					title: 'Test 1',
					content: 'Test 1 content',
					author: ids[0]
				})

				expect(result).to.be.instanceof(Promise)
			})

			it('should resolve with the new document', function() {
				const result = postsCollection.create({
					title: 'Test 2',
					content: 'Test 2 content',
					author: ids[0]
				})

				return Promise.all([
					expect(result).to.eventually.have.deep.property('title', 'Test 2'),
					expect(result).to.eventually.have.deep.property('content', 'Test 2 content'),
					expect(result).to.eventually.have.deep.property('author.username', 'testDoc'),
					expect(result).to.eventually.have.property('_id')
				])
			})

			it('should reject with validation errors', function(done) {
				const result = postsCollection.create({
					content: 'No title content',
					author: ids[0]
				})

				result.catch(err => {
					expect(err).to.have.deep.property('errors.title')
					done()
				})
			})
		})

		describe('update()', function() {
			it('should return a promise', function() {
				const result = postsCollection.update([
					{ title: 'test1', content: '', author: ids[0] }
				])

				expect(result).to.be.instanceof(Promise)
				return result
			})

			it('should resolve with the updated collection', function() {
				const result = postsCollection.update([
					{ title: 'test1', content: '', author: ids[0] }
				])

				return Promise.all([
					expect(result).to.eventually.be.instanceof(Array),
					expect(result).to.eventually.have.deep.property('[0].title', 'test1'),
					expect(result).to.eventually.have.deep.property('[0].content', '')
				])
			})

			it('should overwrite the existing documents', function() {
				const result = postsCollection.update([
					{ title: 'test2', content: '', author: ids[0] }
				])
				.then(function() {
					return postsCollection.model.find().exec()
				})

				return Promise.all([
					expect(result).to.eventually.be.instanceof(Array),
					expect(result).to.eventually.have.length(1),
					expect(result).to.eventually.not.have.deep.property('[0].title', 'test1'),
					expect(result).to.eventually.have.deep.property('[0].title', 'test2')
				])
			})

			it('should reject with validation errors', function(done) {
				const result = postsCollection.update([
					{ content: '', author: ids[0] }
				])

				result.catch(err => {
					expect(err).to.have.deep.property('errors.title')
					done()
				})
			})
		})

		describe('updateById()', function() {
			let updateId

			before(function(done) {
				postsCollection.model.create({
					title: 'Update Document',
					content: '',
					author: ids[0]
				}, (err, doc) => {
					updateId = doc._id
					done()
				})
			})

			after(function() {
				db.db.dropCollection('posts')
			})

			it('should return a promise', function() {
				const result = postsCollection.updateById(updateId, {
					content: 'test1'
				})

				expect(result).to.be.instanceof(Promise)
			})

			it('should resolve with the updated document', function() {
				const result = postsCollection.updateById(updateId, {
					content: 'test1'
				})

				return Promise.all([
					expect(result).to.eventually.have.deep.property('title', 'Update Document'),
					expect(result).to.eventually.have.deep.property('content', 'test1')
				])
			})

			it('should reject with validation errors', function(done) {
				const result = postsCollection.updateById(updateId, {
					content: 'foobar'
				})

				result.catch(err => {
					expect(err).to.have.deep.property('errors.content')
					expect(err).to.have.deep.property('errors.content.message', 'content must not equal foobar')
					done()
				})
			})
		})

		describe('del()', function() {
			beforeEach(function(done) {
				postsCollection.model.create([
					{
						title: 'Delete1',
						author: ids[0]
					},
					{
						title: 'Delete2',
						author: ids[0]
					}
				], (err) => {
					done(err)
				})
			})

			after(function() {
				db.db.dropCollection('posts')
			})

			it('should return a promise', function() {
				const result = postsCollection.del()

				expect(result).to.eventually.be.instanceof(Promise)
			})

			it('should resolve with the deleted documents', function() {
				const result = postsCollection.del()

				return Promise.all([
					expect(result).to.eventually.have.length(2),
					expect(result).to.eventually.have.deep.property('[0].title', 'Delete1'),
					expect(result).to.eventually.have.deep.property('[1].title', 'Delete2')
				])
			})

			it('should delete all documents from the collection', function() {
				const result = postsCollection.del()

				return result.then(function() {
					return postsCollection.model.find().exec()
				})
				.then(docs => {
					expect(docs).to.be.empty
				})
			})
		})

		describe('delById()', function() {
			let deleteId

			beforeEach(function(done) {
				postsCollection.model.create({
					title: 'Delete1',
					author: ids[0]
				}, (err, doc) => {
					deleteId = doc._id
					done(err)
				})
			})

			after(function() {
				db.db.dropCollection('posts')
			})

			it('should return a promise', function() {
				const result = postsCollection.delById(deleteId)

				expect(result).to.be.instanceof(Promise)
			})

			it('should resolve with the deleted document', function() {
				const result = postsCollection.delById(deleteId)

				return expect(result).to.eventually.have.deep.property('title', 'Delete1')
			})
		})
	})

})
