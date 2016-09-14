/*eslint-env node, mocha */
'use strict'

const chai              = require('chai')
const mongoose          = require('mongoose')
const Collection        = require('../../../collection')
const CollectionFactory = require('../../../collection-factory')
const config            = require('../../fixtures/sevr-config')

const expect = chai.expect

describe('CollectionFactory', () => {

	let factory
	let db

	before(function() {
		db = mongoose.createConnection(`mongodb://${config.connection.host}:${config.connection.port}/${config.connection.database}`)
		factory = new CollectionFactory({
			users: {
				singular: 'User',
				fields: {}
			},
			posts: {
				singular: 'Post',
				fields: {}
			}
		}, db)
	})

	after(function() {
		CollectionFactory._destroy()
		delete db.models['User']
		delete db.models['Post']
		db.close()
	})

	describe('constructor()', function() {
		it('should instantiate a collection for each definition', function() {
			expect(factory._instances).to.be.instanceof(Object)
			expect(factory._instances).to.haveOwnProperty('users')
			expect(factory._instances).to.haveOwnProperty('posts')
			expect(factory._instances['users']).to.be.instanceof(Collection)
			expect(factory._instances['posts']).to.be.instanceof(Collection)
		})

		it('should be a singleton', function() {
			expect(new CollectionFactory).to.equal(factory)
		})
	})

	describe('getInstance()', function() {
		it('should return the collection instance', function() {
			const result = factory.getInstance('users')
			expect(result).to.be.instanceof(Collection)
			expect(result.modelName).to.equal('User')
		})

		it('should return undefined for non-existant collection', function() {
			expect(factory.getInstance('foo')).to.be.undefined
		})

		it('should not recreate an existing instance', function() {
			const first = factory.getInstance('users')
			const second = factory.getInstance('users')

			expect(first).to.equal(second)
		})
	})

	describe('getInstanceWithModel()', function() {
		it('should return the collection instance with matching model', function() {
			const result = factory.getInstanceWithModel('User')
			expect(result).to.be.instanceof(Collection)
			expect(result.modelName).to.equal('User')
		})

		it('should return undefined for non-existant model', function() {
			expect(factory.getInstanceWithModel('Foo')).to.be.undefined
		})
	})

})
