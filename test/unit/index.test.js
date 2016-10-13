/*eslint-env node, mocha */
'use strict'

const chai  = require('chai')
const _     = require('lodash')
const spies = require('chai-spies')
const Sevr  = require('../../index')

const expect = chai.expect
const paths = {
	config: '../fixtures/sevr-config'
}

chai.use(spies)

describe('Sevr', function() {

	after(function() {
		Sevr._destroyFactory()
	})

	it('should extend the config', function() {
		const ich = new Sevr(require(paths.config))
		expect(ich.config).to.have.property('collections', 'test/fixtures/definitions')
		expect(ich.config).to.have.property('types', 'test/fixtures/types')
		expect(ich.config).to.have.deep.property('connection.host', 'localhost')
		expect(ich.config).to.have.deep.property('connection.port', 27017)
	})

	describe('attach()', function() {

		it('should push the plugin to the plugins array', function() {
			const ich = new Sevr(require(paths.config))
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
				klass: pluginA,
				config: { test: 1 },
				namespace: undefined
			})
			expect(ich._plugins[1]).to.eql({
				klass: pluginB,
				config: { test: 2 },
				namespace: undefined
			})
		})

		it('should throw an error if the plugin is not a function', function() {
			const ich = new Sevr(require(paths.config))
			const badPlugin = { ima: 'not a function' }
			const fn = () => { ich.attach(badPlugin) }

			expect(fn).to.throw('Plugin must be a function')
		})

	})

	describe('connect()', function() {

		it('should return a promise', function(done) {
			const ich = new Sevr(require(paths.config))
			const result = ich.connect()
			expect(result).to.be.instanceof(Promise)
			result.then(done, done)
		})

		it('should resolve with good connection', function(done) {
			const ich = new Sevr(require(paths.config))
			const result = ich.connect()
			result.then(done).catch(done)
		})

		it('should emit "db-ready" when connection successful', function(done) {
			const ich = new Sevr(require(paths.config))
			const result = ich.connect()
			const spy = chai.spy()
			ich.events.on('db-ready', spy)

			result
				.then(() => {
					expect(spy).to.have.been.called.once
					done()
				})
				.catch(done)
		})

		it('should reject with bad connection', function(done) {
			const ich = new Sevr(
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

	})

	describe('_initPlugins()', function() {

		it('should call each plugin function with Sevr instance and config', function() {
			const ich = new Sevr(require(paths.config))
			const pluginA = chai.spy()
			const pluginB = chai.spy()

			ich._plugins = [
				{ fn: pluginA, config: { test: 1 } },
				{ fn: pluginB }
			]

			ich._initPlugins()
				.then(() => {
					expect(pluginA).to.have.been.called.once
					expect(pluginB).to.have.been.called.once
					expect(pluginA).to.have.been.called.with(ich, { test: 1 })
					expect(pluginB).to.have.been.called.with(ich, undefined)
				})
		})

	})

	describe('ready()', function() {
		it('should attach a callback to the "ready" event', function(done) {
			const sevr = new Sevr(require(paths.config))
			const cb = chai.spy()

			sevr.ready(cb)
			sevr.events.emit('ready')
			setTimeout(() => {
				expect(cb).to.have.been.called.once
				done()
			}, 500)
		})
	})

	describe('reset()', function() {
		it('should emit a "reset" event', function() {
			const sevr = new Sevr(require(paths.config))
			sevr.authentication.setMeta({
				remove: () => {}
			})
			
			chai.spy.on(sevr.events, 'emit')
			sevr.reset()
			expect(sevr.events.emit).to.have.been.called.once
		})

		it('it should call the authentication `reset` method', function() {
			const sevr = new Sevr(require(paths.config))
			sevr.authentication.setMeta({
				remove: () => {}
			})

			chai.spy.on(sevr.authentication, 'reset')
			sevr.reset()
			expect(sevr.authentication.reset).to.have.been.called.once
		})
	})
})
