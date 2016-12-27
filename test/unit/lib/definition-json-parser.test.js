/*eslint-env node, mocha */
'use strict'

const chai = require('chai')
const mongoose = require('mongoose')
const DefinitionJsonParser = require('../../../lib/definition-json-parser')
const CollectionDefinition = require('../../../collection-definition')
const FieldDefinition = require('../../../field-definition')
const Collections = require('../../../collections')
const Links = require('../../../links')

const expect = chai.expect

describe('DefinitionJsonParser', function() {
	beforeEach(function() {
		Links.clear()
		Collections.clear()
	})

	it('should create a valid `CollectionDefinition`', function() {
		Collections.add('users', 'User', {
			name: 'users' 
		})

		const json = {
			singular: 'Post',
			fields: {
				title: {
					label: 'Title',
					schemaType: { type: String, required: true }
				},
				slug: {
					label: 'Slug',
					schemaType: { type: String, required: true }
				},
				author: {
					label: 'Author',
					schemaType: {
						type: mongoose.Schema.Types.ObjectId,
						required: true,
						ref: 'User',
						display: 'username'
					}
				},
				tags: {
					label: 'Tags',
					schemaType: [{
						type: mongoose.Schema.Types.ObjectId,
						ref: 'Tag',
						display: 'title'	
					}]
				},
				status: {
					label: 'Status',
					schemaType: {
						published: {
							label: 'Published',
							schemaType: Boolean
						},
						lastUpdated: {
							label: 'Updated',
							schemaType: Date
						}
					}
				}
			},
			defaultField: 'title',
			virtuals: {
				'test': {
					get: () => 'foobar'
				}
			},
			options: {},
			meta: {
				description: 'Posts collection'
			}
		}

		const result = DefinitionJsonParser('posts', json)

		expect(result).to.be.instanceOf(CollectionDefinition)
		expect(result.populationFields).to.eql(['author', 'tags'])
		expect(result.meta).to.eql({
			description: 'Posts collection'
		})
		expect(result.defaultField).to.equal('title')
		
		const fields = result.getFields()

		expect(fields).to.have.property('title')
		expect(fields.title).to.be.instanceOf(FieldDefinition)

		expect(fields).to.have.property('slug')
		expect(fields.slug).to.be.instanceOf(FieldDefinition)
		
		expect(fields).to.have.property('author')
		expect(fields.author).to.be.instanceOf(FieldDefinition)
		expect(fields.author.isLinked).to.be.true
		expect(fields.author.getLinkedCollection()).to.eql({ name: 'users' })
		
		expect(fields).to.have.property('tags')
		expect(fields.tags).to.be.instanceOf(FieldDefinition)
		expect(fields.tags.isMultiValue).to.be.true

		expect(fields).to.have.property('status')
		expect(fields.status).to.be.instanceOf(FieldDefinition)
		expect(fields.status.type).to.have.property('published')
		expect(fields.status.type.published).to.be.instanceOf(FieldDefinition)
		expect(fields.status.type).to.have.property('lastUpdated')
		expect(fields.status.type.lastUpdated).to.be.instanceOf(FieldDefinition)
	})

	it('should throw an error if json contains an invalid collection definition', function() {
		const noFields = {
			singular: 'Post'
		}

		const noSingular = {
			field: {
				title: {
					label: 'Title',
					schemaType: String
				}
			}
		}

		const noFieldsFn = () => DefinitionJsonParser('posts', noFields)
		const noSingularFn = () => DefinitionJsonParser('posts', noSingular)
		const noRequiredFn = () => DefinitionJsonParser('posts', {})

		expect(noFieldsFn).to.throw(
			'posts collection\n' +
			'	must contain the `fields` property\n' +
			'	`fields` property must be of type [PlainObject]'
		)

		expect(noSingularFn).to.throw(
			'posts collection\n' +
			'	must contain the `singular` property\n' +
			'	`singular` property must be of type [String]'
		)

		expect(noRequiredFn).to.throw(
			'posts collection\n' +
			'	must contain the `singular` property\n' +
			'	`singular` property must be of type [String]\n' +
			'	must contain the `fields` property\n' +
			'	`fields` property must be of type [PlainObject]'
		)
	})

	it('should throw an error if any of the fields are invalid', function() {
		const noLabel = {
			singular: 'Post',
			fields: {
				title: {
					schemaType: { type: String, required: true }
				}
			}
		}

		const noSchema = {
			singular: 'Post',
			fields: {
				title: {
					label: 'title'
				}
			}
		}

		const badLabelType = {
			singular: 'Post',
			fields: {
				title: {
					label: { text: 'title' },
					schemaType: { type: String, required: true }
				}
			}
		}

		const badSchemaType = {
			singular: 'Post',
			fields: {
				title: {
					label: 'Title',
					schemaType: 'string'
				}
			}
		}

		const test1 = () => DefinitionJsonParser('posts', noLabel)
		const test2 = () => DefinitionJsonParser('posts', noSchema)
		const test3 = () => DefinitionJsonParser('posts', badLabelType)
		const test4 = () => DefinitionJsonParser('posts', badSchemaType)

		expect(test1).to.throw(
			'posts collection\n' +
			'	`title` field must contain `label` property\n' +
			'	`title` field `label` property must be of type [String]'
		)

		expect(test2).to.throw(
			'posts collection\n' +
			'	`title` field must contain `schemaType` property\n' +
			'	`title` field `schemaType` property must be of type [Array,Object]'
		)

		expect(test3).to.throw(
			'posts collection\n' +
			'	`title` field `label` property must be of type [String]'
		)

		expect(test4).to.throw(
			'posts collection\n' +
			'	`title` field `schemaType` property must be of type [Array,Object]'
		)
	})

	it('should add fields with refrences to the links map', function() {
		Collections.add('users', 'User', {
			name: 'users' 
		})

		const json = {
			singular: 'Post',
			fields: {
				title: {
					label: 'Title',
					schemaType: { type: String, required: true }
				},
				slug: {
					label: 'Slug',
					schemaType: { type: String, required: true }
				},
				author: {
					label: 'Author',
					schemaType: {
						type: mongoose.Schema.Types.ObjectId,
						required: true,
						ref: 'User',
						display: 'username'
					}
				}
			}
		}

		const result = DefinitionJsonParser('posts', json)
		const author = result.getField('author')

		expect(Links.get(author)).to.eql('User')
	})
})