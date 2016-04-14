/*eslint-env node, mocha */
'use strict'

const chai     = require('chai')
const Ichabod  = require('../../index')

const expect = chai.expect
const paths = {
	config: '../fixtures/ichabod-config'
}

describe('Ichabod', function() {

	after(function() {
		Ichabod._destroyFactory()
	})

	it('should extend the config', function() {
		const ich = new Ichabod(require(paths.config))
		expect(ich.config).to.have.property('collections', 'test/fixtures/definitions')
		expect(ich.config).to.have.property('types', 'test/fixtures/types')
		expect(ich.config).to.have.deep.property('connection.host', 'localhost')
		expect(ich.config).to.have.deep.property('connection.port', 27017)
	})

	it('should load the collection definitions', function() {
		const ich = new Ichabod(require(paths.config))
		expect(ich.definitions).to.haveOwnProperty('posts')
		expect(ich.definitions).to.haveOwnProperty('authors')
	})

	it('should load the type definitions', function() {
		const ich = new Ichabod(require(paths.config))
		expect(ich.types).to.haveOwnProperty('Email')
		expect(ich.types).to.haveOwnProperty('Foo')
	})

	describe('connect()', function() {

		it('should return a promise', function(done) {
			const ich = new Ichabod(require(paths.config))
			const result = ich.connect()
			expect(result).to.be.instanceof(Promise)
			result.then(done, done)
		})

		it('should resolve with good connection', function(done) {
			const ich = new Ichabod(require(paths.config))
			const result = ich.connect()
			result.then(done).catch(done)
		})

		it('should reject with bad connection', function(done) {
			const ich = new Ichabod(
				Object.assign({}, require(paths.config), {
					connection: { port: 1337 }
				})
			)
			const result = ich.connect()
			result.then(() => {
				done(new Error('Expected promise to be rejected'))
			}).catch(() => {
				done()
			})
		})

		it('should create the collections', function(done) {
			const ich = new Ichabod(require(paths.config))
			const result = ich.connect()
			result.then(() => {
				expect(ich.collections).to.haveOwnProperty('posts')
				expect(ich.collections).to.haveOwnProperty('authors')
				done()
			}).catch(done)
		})

	})

})
