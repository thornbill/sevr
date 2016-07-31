/*eslint-env node, mocha */
'use strict'

const chai           = require('chai')
const mongoose       = require('mongoose')
const SchemaBuilder  = require('../../../lib/schema-builder')
const collectionDefs = require('../../fixtures/collections')

const expect = chai.expect

describe('SchemaBuilder', () => {

	describe('create()', () => {
		it('should create a mongoose schema from a collection definition', function() {
			const schema = SchemaBuilder.create(collectionDefs.users)
			expect(schema).to.be.instanceof(mongoose.Schema)
		})

		it('should apply getters and setters', function() {
			const schema = SchemaBuilder.create(collectionDefs.sample)
			expect(schema.path('withSetter').options.set).to.be.a('function')
			expect(schema.path('withSetter').options.set()).to.equal('hardcoded-set')
		})

		it('should apply select', function() {
			const schema = SchemaBuilder.create(collectionDefs.selectCollection)
			expect(schema.path('visible').selected).to.be.undefined
			expect(schema.path('hidden').selected).to.be.false
		})

		it('should add any virtuals', function() {
			const schema = SchemaBuilder.create({
				singular: 'User',
				fields: {
					name: {
						label: 'Name',
						schemaType: {
							first: String,
							last: String
						}
					}
				},
				virtuals: {
					'name.full': {
						get: function() { return this.name.first + ' ' + this.name.last }
					}
				}
			})

			expect(schema.virtualpath('name.full')).to.be.an('object')
			expect(schema.virtualpath('name.full').getters).to.have.length(1)
		})
	})

})
