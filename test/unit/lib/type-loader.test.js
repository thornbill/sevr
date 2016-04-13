/*eslint-env node, mocha */
'use strict'

const chai          = require('chai')
const TypeLoader    = require('../../../lib/type-loader')
const mongooseTypes = require('mongoose').Schema.Types

const expect = chai.expect
const paths = {
	normal: 'test/fixtures/types',
	case:   'test/fixtures/types-case',
	error:  'test/fixtures/types-error'
}

describe('TypeLoader', function() {

	it('should return an object', function() {
		const types = TypeLoader(paths.normal)
		expect(types).to.be.instanceof(Object)
	})

	it('should contain a property for each type file', function() {
		const types = TypeLoader(paths.normal)
		expect(types).to.haveOwnProperty('Email')
		expect(types).to.haveOwnProperty('Foo')
	})

	it('should return an object where each property is a function', function() {
		const types = TypeLoader(paths.normal)
		expect(types.Email).to.be.instanceof(Function)
		expect(types.Foo).to.be.instanceof(Function)
	})

	it('should contain a property for each mongoose type', function() {
		const types = TypeLoader(paths.normal)
		Object.keys(mongooseTypes).forEach(mType => {
			expect(types).to.haveOwnProperty(mType)
			expect(types[mType]).to.be.instanceof(Function)
		})
	})

	it('should upper camel case property names', function() {
		const types = TypeLoader(paths.case)
		expect(types).to.haveOwnProperty('TestType')
		expect(types).to.haveOwnProperty('TestType2')
		expect(types).to.not.haveOwnProperty('test-type')
		expect(types).to.not.haveOwnProperty('test_type2')
	})

})
