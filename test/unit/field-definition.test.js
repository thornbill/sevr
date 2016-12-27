/*eslint-env node, mocha */
'use strict'

const chai            = require('chai')
const mongoose        = require('mongoose')
const FieldDefinition = require('../../field-definition')
const Collections     = require('../../collections')
const Links           = require('../../links')

const expect = chai.expect

describe('FieldDefinition', function() {
	describe('constructor()', function() {
		it('should set the name', function() {
			const fd = new FieldDefinition('title', 'Title', String)

			expect(fd.name).to.eql('title')
		})

		it('should set the label', function() {
			const fd = new FieldDefinition('title', 'Title', String)
			const fd2 = new FieldDefinition('author')

			expect(fd.label).to.eql('Title')
			expect(fd2.label).to.eql('Author')
		})

		it('should set the type', function() {
			const fd = new FieldDefinition('title', 'Title', String)
			const fd2 = new FieldDefinition('author')

			expect(fd.type).to.eql(String)
			expect(fd2.type).to.eql(String)
		})

		it('should set `isMultiValue` to true when type is an array', function() {
			const fd = new FieldDefinition('title', 'Title', String)
			const fd2 = new FieldDefinition('title', 'Title', [String])

			expect(fd.isMultiValue).to.be.false
			expect(fd2.isMultiValue).to.be.true
		})
	})

	describe('getLinkedCollection()', function() {
		it('should return the collection found in the `ref` property of `type`', function() {
			Collections.add('users', 'User', { name: 'authors' })
			const fd = new FieldDefinition('author', 'Author', {
				type: mongoose.Types.ObjectId,
				ref: 'User'
			})

			expect(fd.getLinkedCollection()).to.eql({ name: 'authors' })

			Links.clear()
		})

		it('should return `undefined` when field does not have a ref', function() {
			const fd = new FieldDefinition('title', 'Title', String)

			expect(fd.getLinkedCollection()).to.equal(undefined)
		})
	})

	describe('getTypeNames()', function() {

	})

	describe('getFlatFields()', function() {
		it('should return a map of flattened fields', function() {
			const fd = new FieldDefinition('title', 'Title', String)
			const fd2 = new FieldDefinition('person', 'Person', {
				name: new FieldDefinition('name', 'Name', {
					first: new FieldDefinition('first', 'First', String),
					last: new FieldDefinition('last', 'Last', String)
				}),
				age: new FieldDefinition('age', 'Age', Number)
			})

			const fields = fd.getFlatFields()
			const fields2 = fd2.getFlatFields()

			expect(Object.keys(fields)).to.eql(['title'])
			expect(fields.title).to.be.instanceOf(FieldDefinition)
			expect(Object.keys(fields2)).to.eql(['person.name.first', 'person.name.last', 'person.age'])
			expect(fields2['person.name.first']).to.be.instanceOf(FieldDefinition)
			expect(fields2['person.name.last']).to.be.instanceOf(FieldDefinition)
			expect(fields2['person.age']).to.be.instanceOf(FieldDefinition)

		})
	})

	describe('getSchemaType()', function() {
		it('should return a valid mongoose schemaType', function() {
			const fd = new FieldDefinition('title', 'Title', String)
			const fd2 = new FieldDefinition('title', 'Title', [String])
			const authors = { name: 'authors', model: { modelName: 'Author' } }
			const fd3 = new FieldDefinition('author', 'Author', {
				type: mongoose.Types.ObjectId,
				ref: 'Author'
			})
			const fd4 = new FieldDefinition('name', 'Name', {
				first: new FieldDefinition('first', 'First', String),
				last: new FieldDefinition('last', 'Last', String)
			})
			const fd5 = new FieldDefinition('person', 'Person', {
				name: new FieldDefinition('name', 'Name', {
					first: new FieldDefinition('first', 'First', String),
					last: new FieldDefinition('last', 'Last', String)
				}),
				age: new FieldDefinition('age', 'Age', Number)
			})

			expect(fd.getSchemaType()).to.eql(String)
			expect(fd2.getSchemaType()).to.eql([String])
			expect(fd3.getSchemaType()).to.eql({
				type: mongoose.Types.ObjectId,
				ref: 'Author'
			})
			expect(fd4.getSchemaType()).to.eql({
				first: String,
				last: String,
			})
			expect(fd5.getSchemaType()).to.eql({
				name: {
					first: String,
					last: String
				},
				age: Number
			})

			Links.clear()
		})

		it('should flatten the field if nested and enabled', function() {
			const fd = new FieldDefinition('person', 'Person', {
				name: new FieldDefinition('name', 'Name', {
					first: new FieldDefinition('first', 'First', String),
					last: new FieldDefinition('last', 'Last', String)
				}),
				age: new FieldDefinition('age', 'Age', Number)
			})
			const fd2 = new FieldDefinition('title', 'Title', String)
			const fd3 = new FieldDefinition('slug', 'Slug', { type: String, required: true })

			expect(fd.getSchemaType(true)).to.eql({
				'person.name.first': String,
				'person.name.last': String,
				'person.age': Number
			})
			expect(fd2.getSchemaType(true)).to.eql({
				'title': String
			})
			expect(fd3.getSchemaType(true)).to.eql({
				'slug': { type: String, required: true }
			})
		})
	})

	describe('toObject', function() {
		it('should return a plain object representation of the field', function() {
			const fd = new FieldDefinition('person', 'Person', {
				name: new FieldDefinition('name', 'Name', {
					first: new FieldDefinition('first', 'First', String),
					last: new FieldDefinition('last', 'Last', String)
				}),
				age: new FieldDefinition('age', 'Age', Number)
			})

			expect(fd.toObject()).to.eql({
				name: 'person',
				label: 'Person',
				schemaType: {
					name: {
						name: 'name',
						label: 'Name',
						schemaType: {
							first: {
								name: 'first',
								label: 'First',
								schemaType: String
							},
							last: {
								name: 'last',
								label: 'Last',
								schemaType: String
							}
						}
					},
					age: {
						name: 'age',
						label: 'Age',
						schemaType: Number
					}
				}
			})
		})
	})
})