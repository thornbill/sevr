/*eslint-env node, mocha */
'use strict'

const chai           = require('chai')
const mongoose       = require('mongoose')
const SchemaBuilder  = require('../../../lib/schema-builder')
const collectionDefs = require('../../fixtures/collections')

const expect = chai.expect

describe('SchemaBuilder', () => {

	describe('create()', () => {
		it('should create a mongoose schema from a collection definition', () => {
			const schema = SchemaBuilder.create(collectionDefs.users)
			expect(schema).to.be.instanceof(mongoose.Schema)
		})
	})

})
