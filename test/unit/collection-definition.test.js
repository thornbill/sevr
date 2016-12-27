/*eslint-env node, mocha */
'use strict'

const chai                 = require('chai')
const CollectionDefinition = require('../../collection-definition')
const FieldDefinition      = require('../../field-definition')

const expect = chai.expect

describe('CollectionDefinition', function() {
	describe('addField()', function() {
		it('should add the field to the field map with `field.name` as the key', function() {
			const title = new FieldDefinition('title', 'Title', String)
			const posts = new CollectionDefinition('posts')

			posts.addField(title)
			expect(posts._fields).to.have.property('title', title)
		})

		it('should throw an error if collection is locked', function() {
			const title = new FieldDefinition('title', 'Title', String)
			const posts = new CollectionDefinition('posts')
			posts._locked = true

			const fn = () => posts.addField(title)

			expect(fn).to.throw('Attempting to add a new field to a locked collection')
		})

		it('should throw an error if field is not a FieldDefinition', function() {
			const title = { type: String }
			const posts = new CollectionDefinition('posts')
			const fn = () => posts.addField(title)

			expect(fn).to.throw('Cannot add a field that is not a valid FieldDefinition')
		})
	})

	describe('removeField()', function() {
		it('should remove the field from the field map', function() {
			const posts = new CollectionDefinition('posts')
			posts._fields.title = new FieldDefinition('title', 'Title', String)
			posts._fields.slug = new FieldDefinition('slug', 'Slug', String)

			posts.removeField('title')
			expect(posts._fields).to.have.property('slug')
			expect(posts._fields).to.not.have.property('title')
		})

		it('should throw and error if collection is locked', function() {
			const posts = new CollectionDefinition('posts')
			posts._fields.title = new FieldDefinition('title', 'Title', String)
			posts._locked = true

			const fn = () => posts.removeField('title')

			expect(fn).to.throw('Attempting to remove a field from a locked collection')
		})
	})

	describe('getFields()', function() {
		it('should return the map of fields', function() {
			const posts = new CollectionDefinition('posts')
			posts._fields.title = new FieldDefinition('title', 'Title', String)
			posts._fields.slug = new FieldDefinition('slug', 'Slug', String)

			const fields = posts.getFields()
			expect(fields).to.have.property('title')
			expect(fields).to.have.property('slug')
			expect(fields.title).to.be.instanceOf(FieldDefinition)
			expect(fields.slug).to.be.instanceOf(FieldDefinition)
		})

		it('should return a map of flattend fields when enabled', function() {
			const posts = new CollectionDefinition('posts')
			posts._fields.author = new FieldDefinition('author', 'Author', {
				first: new FieldDefinition('first', 'First', String),
				last: new FieldDefinition('last', 'Last', String)
			})
			posts._fields.title = new FieldDefinition('title', 'Title', String)

			const fields = posts.getFields(true)
			expect(Object.keys(fields)).to.eql(['author.first', 'author.last', 'title'])
			expect(fields['author.first']).to.be.instanceOf(FieldDefinition)
			expect(fields['author.last']).to.be.instanceOf(FieldDefinition)
			expect(fields['title']).to.be.instanceOf(FieldDefinition)
		})
	})

	describe('getField()', function() {
		it('should return the matching field', function() {
			const posts = new CollectionDefinition('posts')
			posts._fields.title = new FieldDefinition('title', 'Title', String)

			const field = posts.getField('title')
			expect(field).to.be.instanceOf(FieldDefinition)
			expect(field.name).to.eql('title')
		})
	})

	describe('getFieldSchemaTypes()', function() {
		it('should return a map of field schemas', function() {
			const posts = new CollectionDefinition('posts')
			posts._fields.author = new FieldDefinition('author', 'Author', {
				first: new FieldDefinition('first', 'First', String),
				last: new FieldDefinition('last', 'Last', String)
			})
			posts._fields.title = new FieldDefinition('title', 'Title', String)

			const fields = posts.getFieldSchemaTypes()
			expect(fields).to.eql({
				author: {
					first: String,
					last: String
				},
				title: String
			})
		})

		it('should return a flattend map of fields when enabled', function() {
			const posts = new CollectionDefinition('posts')
			posts._fields.author = new FieldDefinition('author', 'Author', {
				first: new FieldDefinition('first', 'First', String),
				last: new FieldDefinition('last', 'Last', String)
			})
			posts._fields.title = new FieldDefinition('title', 'Title', String)

			const fields = posts.getFieldSchemaTypes(true)
			expect(fields).to.eql({
				'author.first': String,
				'author.last': String,
				'title': String,
				flattened: true
			})
		})
	})

	describe('getFieldTypes()', function() {
		it('should return an array of types for the field', function() {
			const posts = new CollectionDefinition('posts')
			posts._fields.author = new FieldDefinition('author', 'Author', {
				first: new FieldDefinition('first', 'First', String),
				last: new FieldDefinition('last', 'Last', String)
			})
			posts._fields.title = new FieldDefinition('title', 'Title', { name: 'MyString', type: String })

			expect(posts.getFieldTypes('author')).to.eql(['author', 'COMPLEX'])
			expect(posts.getFieldTypes('author.first')).to.eql(['first', 'String'])
			expect(posts.getFieldTypes('author.last')).to.eql(['last', 'String'])
			expect(posts.getFieldTypes('title')).to.eql(['title', 'MyString', 'String'])
		})
	})

	describe('inflateFields()', function() {
		it('should return the inflatted fields', function() {
			const posts = new CollectionDefinition('posts')
			posts._fields.author = new FieldDefinition('author', 'Author', {
				first: new FieldDefinition('first', 'First', String),
				last: new FieldDefinition('last', 'Last', String)
			})
			posts._fields.title = new FieldDefinition('title', 'Title', String)

			const inflatted = posts.inflateFields({
				'author.first': String,
				'author.last': String,
				'title': String,
				flattened: true
			})

			expect(inflatted.author).to.be.instanceOf(FieldDefinition)
			expect(inflatted.title).to.be.instanceOf(FieldDefinition)
			expect(inflatted).to.not.have.property('author.first')
			expect(inflatted).to.not.have.property('first')
		})
	})

	describe('addField()', function() {
		it('should add the field to the fields map', function() {
			const posts = new CollectionDefinition('posts')
			posts.addField(
				new FieldDefinition('title', 'Title', String)
			)

			expect(posts._fields).to.have.property('title')
		})

		it('should throw an error if the collection is locked', function() {
			const posts = new CollectionDefinition('posts')
			posts._locked = true

			const fn = () => posts.addField(new FieldDefinition('title', 'Title', String))

			expect(fn).to.throw('Attempting to add a new field to a locked collection')
		})

		it('should throw an error if the field is not a valid FieldDefinition', function() {
			const posts = new CollectionDefinition('posts')
			const fn = () => posts.addField({ type: String })

			expect(fn).to.throw('Cannot add a field that is not a valid FieldDefinition')
		})
	})

	describe('removeField()', function() {
		it('should remove the field from the field map', function() {
			const posts = new CollectionDefinition('posts')
			posts._fields.author = new FieldDefinition('author', 'Author', {
				first: new FieldDefinition('first', 'First', String),
				last: new FieldDefinition('last', 'Last', String)
			})
			posts._fields.title = new FieldDefinition('title', 'Title', String)

			posts.removeField('title')
			expect(posts._fields).to.not.have.property('title')
			posts.removeField('author')
			expect(posts._fields).to.not.have.property('author')
		})

		it('should throw an error if the collection is locked', function() {
			const posts = new CollectionDefinition('posts')
			posts._fields.title = new FieldDefinition('title', 'Title', String)
			posts._locked = true
			const fn = () => posts.removeField('title')

			expect(fn).to.throw('Attempting to remove a field from a locked collection')
		})
	})
})