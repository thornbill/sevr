/*eslint-env node, mocha */
'use strict'

const chai           = require('chai')
const mongoose       = require('mongoose')
const bcrypt         = require('bcryptjs')
const Authentication = require('../../authentication')
const Collection     = require('../../collection')
const collectionDefs = require('../fixtures/collections')
const config         = require('../fixtures/ichabod-config')

const expect = chai.expect

describe('Authentication', function() {

	let db
	let factory = {
		connection: null
	}
	let authCollection
	let authErrorCollection

	before(function() {
		db = mongoose.createConnection(`mongodb://${config.connection.host}:${config.connection.port}/${config.connection.database}`)
		factory.connection = db
		authCollection = new Collection('auth', collectionDefs.authCollection, factory)
		authErrorCollection = new Collection('authError', collectionDefs.authErrorCollection, factory)
	})

	after(function() {
		db.db.dropDatabase()
		db.close()
	})

	it('should be disabled by default', function() {
		const auth = new Authentication()
		expect(auth.isEnabled).to.be.false
	})

	describe('enable()', function() {

		afterEach(function() {
			delete db.models['AuthUser']
			delete db.models['AuthErrorUser']
		})

		it('should enabled authentication', function() {
			const auth = new Authentication()
			expect(auth.isEnabled).to.be.false
			auth.enable(authCollection)
			expect(auth.isEnabled).to.be.true
		})

		it('sets `coll` to the collection to authenticate against', function() {
			const auth = new Authentication()
			expect(auth.collection).to.be.undefined
			auth.enable(authCollection)
			expect(auth.collection).to.eql(authCollection)
		})

		it('should error if collection does not have `username` and `password` fields', function() {
			const auth = new Authentication()
			const fn = () => { auth.enable(authErrorCollection) }
			expect(fn).to.throw('Authentication collection must have "username" and "password"')
		})

		it('should add a setter to the `password` field', function() {
			const auth = new Authentication()
			const schema = authCollection.schema
			auth.enable(authCollection)
			expect(schema.path('password').setters[0]).to.be.a('function')

			const setter = schema.path('password').setters[0]
			const pass = 'bad_pass'
			expect(bcrypt.compareSync('bad_pass', setter(pass))).to.be.true
		})

	})

	describe('validateCredentials()', function() {

		it('should return a promise', function() {
			const auth = new Authentication()
			auth.enable(authCollection)
			expect(auth.validateCredentials({
				username: 'foo',
				password: 'bar'
			})).to.be.instanceOf(Promise)
		})

		it('should resolve with the matching user document', function(done) {
			const auth = new Authentication()
			auth.enable(authCollection)

			authCollection.model.create({
				username: 'validateTest',
				password: 'validate_me'
			})
			.then(user => {
				return auth.validateCredentials(user)
			})
			.then(user => {
				expect(user).to.have.deepProperty('username', 'validateTest')
				done()
			})
			.catch(done)
		})

		it('should reject when unmatched', function(done) {
			const auth = new Authentication()
			auth.enable(authCollection)

			auth.validateCredentials({
				username: 'doesnotexit',
				password: 'bad_pass'
			})
			.then(done)
			.catch(done)
		})

	})

})
