/*eslint-env node, mocha */
'use strict'

const chai             = require('chai')
const DefinitionLoader = require('../../../lib/definition-loader')
const TypeLoader       = require('../../../lib/type-loader')

const expect = chai.expect
const paths = {
	normal: 'test/fixtures/definitions',
	case:   'test/fixtures/definitions-case',
	error:  'test/fixtures/definitions-error'
}
const types = TypeLoader()

describe('DefinitionLoader', function() {

	it('should return an object', function() {
		const defs = DefinitionLoader(paths.normal, types)
		expect(defs).to.be.instanceof(Object)
	})

	it('should contain a property for each definition file', function() {
		const defs = DefinitionLoader(paths.normal, types)
		expect(defs).to.haveOwnProperty('posts')
		expect(defs).to.haveOwnProperty('authors')
	})

	it('should camel case property names', function() {
		const defs = DefinitionLoader(paths.case, types)
		expect(defs).to.haveOwnProperty('testCollection')
		expect(defs).to.haveOwnProperty('testCollection2')
		expect(defs).to.not.haveOwnProperty('test-collection')
		expect(defs).to.not.haveOwnProperty('test_collection_2')
	})

})
