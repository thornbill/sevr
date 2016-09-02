/*eslint-env node, mocha */
'use strict'

const chai           = require('chai')
const mongoose       = require('mongoose')
const bcrypt         = require('bcryptjs')
const jwt            = require('jsonwebtoken')
const Authentication = require('../../authentication')
const Collection     = require('../../collection')
const collectionDefs = require('../fixtures/collections')
const config         = require('../fixtures/ichabod-config')

const expect = chai.expect
const secret = 'imasecret'

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

		afterEach(() => {
			delete db.models['Auth']
			db.db.dropDatabase()
		})

		it('should return a promise', function() {
			const coll = new Collection('auth', {
				singular: 'Auth',
				fields: {
					username: { label: 'username', schemaType: String },
					password: { label: 'password', schemaType: String }
				}
			}, factory)
			const auth = new Authentication()
			auth.enable(coll)

			expect(auth.validateCredentials({
				username: 'foo',
				password: 'bar'
			})).to.be.instanceOf(Promise)
		})

		it('should resolve with the matching user document', function(done) {
			const coll = new Collection('auth', {
				singular: 'Auth',
				fields: {
					username: { label: 'username', schemaType: String },
					password: { label: 'password', schemaType: String }
				}
			}, factory)
			const auth = new Authentication()
			auth.enable(coll)

			coll.model.create({
				username: 'validateTest',
				password: 'validate_me'
			})
			.then(user => {
				return auth.validateCredentials({
					username: 'validateTest',
					password: 'validate_me'
				})
			})
			.then(user => {
				expect(user).to.have.deep.property('username', 'validateTest')
				done()
			})
			.catch(done)
		})

		it('should reject when no user is found', function(done) {
			const coll = new Collection('auth', {
				singular: 'Auth',
				fields: {
					username: { label: 'username', schemaType: String },
					password: { label: 'password', schemaType: String }
				}
			}, factory)
			const auth = new Authentication()
			auth.enable(coll)

			return auth.validateCredentials({
				username: 'doesnotexist',
				password: 'bad_pass'
			})
			.then(done)
			.catch(() => { done() })
		})

		it('should reject when password does not match', function(done) {
			const coll = new Collection('auth', {
				singular: 'Auth',
				fields: {
					username: { label: 'username', schemaType: String },
					password: { label: 'password', schemaType: String }
				}
			}, factory)
			const auth = new Authentication()
			auth.enable(coll)

			coll.model.create({
				username: 'validateTest',
				password: 'validate_me'
			})
			.then(() => {
				return auth.validateCredentials({
					username: 'validateTest',
					password: 'bad_pass'
				})
			})
			.then(done)
			.catch(() => { done() })
		})

	})

	describe('createToken()', function() {

		afterEach(() => {
			return authCollection.model.remove({})
		})

		it('should return a promise', function() {
			const auth = new Authentication(secret)
			auth.enable(authCollection)

			expect(auth.createToken()).to.be.instanceof(Promise)
		})

		it('should resolve with a jwt', function(done) {
			const auth = new Authentication(secret)
			auth.enable(authCollection)

			authCollection.model.create({
				username: 'validateTest',
				password: 'validate_me'
			})
			.then(user => {
				return auth.createToken(user)
			})
			.then(token => {
				const decoded = jwt.decode(token, { complete: true })
				expect(decoded).to.haveOwnProperty('header')
				expect(decoded).to.haveOwnProperty('payload')
				done()
			})
			.catch(done)
		})

	})

	describe('verifyToken()', function() {

		afterEach(() => {
			return authCollection.model.remove({})
		})

		it('should return a promise', function() {
			const auth = new Authentication(secret)
			auth.enable(authCollection)

			expect(auth.verifyToken()).to.be.instanceof(Promise)
		})

		it('should resolve with a user document', function(done) {
			this.timeout(2500)
			const auth = new Authentication(secret)
			auth.enable(authCollection)

			authCollection.model.create({
				username: 'validateTest',
				password: 'validate_me'
			})
			.then(user => {
				jwt.sign(user.toObject(), secret, null, token => {
					auth.verifyToken(token)
						.then(user => {
							expect(user).to.haveOwnProperty('username', 'validateTest')
							done()
						})
						.catch(done)
				})
			})
			.catch(done)
		})

	})

})
