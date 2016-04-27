/*eslint-env node, mocha */
'use strict'

const chai     = require('chai')
const _        = require('lodash')
const spies    = require('chai-spies')
const Ichabod  = require('../../index')

const expect = chai.expect
const paths = {
	config: '../fixtures/ichabod-config'
}

chai.use(spies)

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

	describe('attach()', function() {

		it('should push the plugin to the plugins array', function() {
			const ich = new Ichabod(require(paths.config))
			const pluginA = () => { return 'a' }
			const pluginB = () => { return 'b' }

			expect(ich._plugins).to.eql([])
			ich.attach(
				pluginA,
				{ test: 1 }
			)
			ich.attach(
				pluginB,
				{ test: 2 }
			)
			expect(ich._plugins).to.have.length(2)
			expect(ich._plugins[0]).to.eql({
				fn: pluginA,
				config: { test: 1 }
			})
			expect(ich._plugins[1]).to.eql({
				fn: pluginB,
				config: { test: 2 }
			})
		})

		it('should throw an error if the plugin is not a function', function() {
			const ich = new Ichabod(require(paths.config))
			const badPlugin = { ima: 'not a function' }
			const fn = () => { ich.attach(badPlugin) }

			expect(fn).to.throw('Plugin must be a function')
		})

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
				_.merge({}, require(paths.config), {
					connection: { host: 'foobar', port: 1337 }
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

	describe('_initPlugins()', function() {

		it('should call each plugin function with Ichabod instance and config', function() {
			const ich = new Ichabod(require(paths.config))
			const pluginA = chai.spy()
			const pluginB = chai.spy()

			ich._plugins = [
				{ fn: pluginA, config: { test: 1 } },
				{ fn: pluginB }
			]

			ich._initPlugins()
			expect(pluginA).to.have.been.called.once
			expect(pluginB).to.have.been.called.once
			expect(pluginA).to.have.been.called.with(ich, { test: 1 })
			expect(pluginB).to.have.been.called.with(ich, undefined)
		})

	})

	describe('_initMetaCollection()', function() {

		Ichabod._destroyFactory()
		const ich = new Ichabod(require(paths.config))

		before(function() {
			return ich.connect()
		})

		afterEach(function() {
			ich.connection.db.dropDatabase()
		})

		it('should create a meta collection with initial data if it does not exist', function(done) {
			ich._initMetaCollection()
				.then(meta => {
					expect(meta).to.have.property('newDatabase', true)
					expect(meta).to.have.deep.property('collections.authors.new', true)
					expect(meta).to.have.deep.property('collections.posts.new', true)
					done()
				})
				.catch(done)
		})

		it('should should set `newDatabase` to false for an existing meta collection', function(done) {
			ich._initMetaCollection().then(() => {
				ich._initMetaCollection()
					.then(meta => {
						expect(meta).to.have.property('newDatabase', false)
						done()
					})
					.catch(done)
			})
		})

	})
})
