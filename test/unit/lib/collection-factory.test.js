/*eslint-env node, mocha */
'use strict'

const chai              = require('chai')
const mongoose          = require('mongoose')
const Collection        = require('../../../collection')
const CollectionFactory = require('../../../collection-factory')
const Links             = require('../../../links')
const config            = require('../../fixtures/sevr-config')

const expect = chai.expect

describe.only('CollectionFactory', () => {

	let db

	before(function() {
		db = mongoose.createConnection(`mongodb://${config.connection.host}:${config.connection.port}/${config.connection.database}`)
	})

	after(function() {
		delete db.models['User']
		delete db.models['Post']
		db.close()
	})

	afterEach(function() {
		Links.clear()
		CollectionFactory._destroy()
	})

	describe('constructor()', function() {
		it('should instantiate a collection for each definition', function() {
			const factory = new CollectionFactory({
				users: {
					singular: 'User',
					fields: {}
				},
				posts: {
					singular: 'Post',
					fields: {}
				}
			}, db)

			expect(factory._instances).to.be.instanceof(Object)
			expect(factory._instances).to.haveOwnProperty('users')
			expect(factory._instances).to.haveOwnProperty('posts')
			expect(factory._instances['users']).to.be.instanceof(Collection)
			expect(factory._instances['posts']).to.be.instanceof(Collection)
		})

		it('should be a singleton', function() {
			const factory = new CollectionFactory({
				users: {
					singular: 'User',
					fields: {}
				},
				posts: {
					singular: 'Post',
					fields: {}
				}
			}, db)
			expect(new CollectionFactory).to.equal(factory)
		})

		it('should throw an error when missing link is found', function() {
			const defs = {
				tests: {
					singular: 'Test',
					fields: {
						field1: {
							label: 'Field1',
							schemaType: {
								type: mongoose.Schema.Types.ObjectId,
								ref: 'Test2'
							}
						}
					}
				}
			}
			const fn = () => { new CollectionFactory(defs, db) }

			expect(fn).to.throw('Collection references unknown model: \'Test2\'')
		})
	})

	describe('getInstance()', function() {
		it('should return the collection instance', function() {
			const factory = new CollectionFactory({
				users: {
					singular: 'User',
					fields: {}
				},
				posts: {
					singular: 'Post',
					fields: {}
				}
			}, db)
			const result = factory.getInstance('users')
			expect(result).to.be.instanceof(Collection)
			expect(result.definition.singular).to.equal('User')
		})

		it('should return undefined for non-existant collection', function() {
			const factory = new CollectionFactory({
				users: {
					singular: 'User',
					fields: {}
				},
				posts: {
					singular: 'Post',
					fields: {}
				}
			}, db)

			expect(factory.getInstance('foo')).to.be.undefined
		})

		it('should not recreate an existing instance', function() {
			const factory = new CollectionFactory({
				users: {
					singular: 'User',
					fields: {}
				},
				posts: {
					singular: 'Post',
					fields: {}
				}
			}, db)
			const first = factory.getInstance('users')
			const second = factory.getInstance('users')

			expect(first).to.equal(second)
		})
	})

	describe('getInstanceWithModel()', function() {
		it('should return the collection instance with matching model', function() {
			const factory = new CollectionFactory({
				users: {
					singular: 'User',
					fields: {}
				},
				posts: {
					singular: 'Post',
					fields: {}
				}
			}, db)
			const result = factory.getInstanceWithModel('User')
			expect(result).to.be.instanceof(Collection)
			expect(result.definition.singular).to.equal('User')
		})

		it('should return undefined for non-existant model', function() {
			const factory = new CollectionFactory({
				users: {
					singular: 'User',
					fields: {}
				},
				posts: {
					singular: 'Post',
					fields: {}
				}
			}, db)
			expect(factory.getInstanceWithModel('Foo')).to.be.undefined
		})
	})

})
