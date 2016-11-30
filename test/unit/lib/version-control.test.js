/*eslint-env node, mocha */
'use strict'

const chai = require('chai')
const mongoose = require('mongoose')
const mockgoose = require('mockgoose')
const deepDiff = require('deep-diff')
const Collection = require('../../../collection')
const VersionControl = require('../../../lib/version-control')

const expect = chai.expect

function createDocVersions(docModel, vcModel, docs) {
	return docs.reduce((acc, doc, i) => {
		return acc.then(prevDoc => {
			let prom
			if (i === 0) {
				prom = docModel.create(doc)
			} else {
				prom = docModel
					.findByIdAndUpdate(prevDoc._id, doc).exec()
					.then(() => {
						return docModel.findById(prevDoc._id).exec()
					})
			}

			return prom
				.then(newDoc => {
					return vcModel.create({
						documentId: newDoc._id,
						changes: deepDiff.diff(prevDoc, newDoc.toObject()),
						hash: VersionControl.hashDocument(newDoc)
					})
					.then(version => {
						return newDoc.toObject()
					})
				})
		})
	}, Promise.resolve({}))
}

describe('VersionControl', function() {
	after(function() {
		VersionControl._destroy()
	})

	describe('getVersions', function() {
		beforeEach(function(done) {
			mockgoose(mongoose)
				.then(() => {
					mongoose.connect('mongodb://testing', err => {
						done(err)
					})
				})
		})

		afterEach(function(done) {
			delete mongoose.connection.models['posts']
			mongoose.unmock(done)
		})

		it('should return an array of all document versions', function() {
			const connection = mongoose.connection
			const model = connection.model('posts',
				new mongoose.Schema({
					title: String,
					slug: String
				})
			)

			const vc = new VersionControl(connection)

			return createDocVersions(model, vc.model, [
				{ title: 'version test1', slug: 'test-one' },
				{ title: 'version test2' }
			])
			.then(id => {
				return vc.getVersions(id)
			})
			.then(versions => {
				expect(versions).to.have.length(2)
				expect(versions[0]).to.have.property('doc')
				expect(versions[0]).to.have.property('version')
			})
		})

		it('should return the most recent version first', function() {
			const connection = mongoose.connection
			const model = connection.model('posts',
				new mongoose.Schema({
					title: String,
					slug: String
				})
			)

			const vc = new VersionControl(connection)

			return createDocVersions(model, vc.model, [
				{ title: 'version test1', slug: 'test-one' },
				{ title: 'version test2' }
			])
			.then(doc => {
				return vc.getVersions(doc._id)
			})
			.then(versions => {
				expect(versions[0].doc).to.have.property('title', 'version test2')
			})
		})
	})

	describe('getLatest', function() {
		beforeEach(function(done) {
			mockgoose(mongoose)
				.then(() => {
					mongoose.connect('mongodb://testing', err => {
						done(err)
					})
				})
		})

		afterEach(function(done) {
			delete mongoose.connection.models['posts']
			mongoose.unmock(done)
		})

		it('should return only the latest version', function() {
			const connection = mongoose.connection
			const model = connection.model('posts',
				new mongoose.Schema({
					title: String,
					slug: String
				})
			)

			const vc = new VersionControl(connection)

			return createDocVersions(model, vc.model, [
				{ title: 'version test1', slug: 'test-one' },
				{ title: 'version test2' },
				{ slug: 'test-two' }
			])
			.then(id => {
				return vc.getLatest(id)
			})
			.then(version => {
				expect(version.doc).to.have.property('title', 'version test2')
				expect(version.doc).to.have.property('slug', 'test-two')
			})
		})
	})

	describe('getVersion', function() {
		beforeEach(function(done) {
			mockgoose(mongoose)
				.then(() => {
					mongoose.connect('mongodb://testing', err => {
						done(err)
					})
				})
		})

		afterEach(function(done) {
			delete mongoose.connection.models['posts']
			mongoose.unmock(done)
		})

		it('should return a single document version given the version id', function() {
			const connection = mongoose.connection
			const model = connection.model('posts',
				new mongoose.Schema({
					title: String,
					slug: String
				})
			)

			const vc = new VersionControl(connection)

			return createDocVersions(model, vc.model, [
				{ title: 'version test1', slug: 'test-one' },
				{ title: 'version test2' },
				{ slug: 'test-two' }
			])
			.then(id => {
				return vc.getVersions(id).then(versions => ({ id, versions }))
			})
			.then(data => {
				return vc.getVersion(data.id, data.versions[1].version._id)
			})
			.then(version => {
				expect(version.doc).to.have.property('title', 'version test2')
				expect(version.doc).to.not.have.property('slug', 'test-two')
			})
		})
	})

	describe('getDiffs', function() {
		beforeEach(function(done) {
			mockgoose(mongoose)
				.then(() => {
					mongoose.connect('mongodb://testing', err => {
						done(err)
					})
				})
		})

		afterEach(function(done) {
			delete mongoose.connection.models['posts']
			mongoose.unmock(done)
		})

		it('should return an array of diffs', function() {
			const connection = mongoose.connection
			const model = connection.model('posts',
				new mongoose.Schema({
					title: String,
					slug: String
				})
			)

			const vc = new VersionControl(connection)

			return createDocVersions(model, vc.model, [
				{ title: 'version test1', slug: 'test-one' },
				{ title: 'version test2' }
			])
			.then(id => {
				return vc.getDiffs(id)
			})
			.then(diffs => {
				expect(diffs).to.have.length(2)
				expect(diffs[0]).to.have.property('documentId')
				expect(diffs[0]).to.have.property('changes')
				expect(diffs[0]).to.have.property('hash')
			})
		})
	})

	describe('getLatestDiff', function() {
		beforeEach(function(done) {
			mockgoose(mongoose)
				.then(() => {
					mongoose.connect('mongodb://testing', err => {
						done(err)
					})
				})
		})

		afterEach(function(done) {
			delete mongoose.connection.models['posts']
			mongoose.unmock(done)
		})

		it('should return only the latest diff', function() {
			const connection = mongoose.connection
			const model = connection.model('posts',
				new mongoose.Schema({
					title: String,
					slug: String
				})
			)

			const vc = new VersionControl(connection)

			return createDocVersions(model, vc.model, [
				{ title: 'version test1', slug: 'test-one' },
				{ title: 'version test2' }
			])
			.then(id => {
				return vc.getLatestDiff(id)
			})
			.then(diff => {
				expect(diff).to.have.property('documentId')
				expect(diff).to.have.property('changes')
				expect(diff).to.have.property('hash')
				expect(diff.changes).to.have.length(1)
				expect(diff.changes[0].path[0]).to.eql('title')
			})
		})
	})

	describe('getVersionDiff', function() {
		beforeEach(function(done) {
			mockgoose(mongoose)
				.then(() => {
					mongoose.connect('mongodb://testing', err => {
						done(err)
					})
				})
		})

		afterEach(function(done) {
			delete mongoose.connection.models['posts']
			mongoose.unmock(done)
		})

		it('should return a single diff given the version id', function() {
			const connection = mongoose.connection
			const model = connection.model('posts',
				new mongoose.Schema({
					title: String,
					slug: String
				})
			)

			const vc = new VersionControl(connection)

			return createDocVersions(model, vc.model, [
				{ title: 'version test1', slug: 'test-one' },
				{ title: 'version test2' },
				{ slug: 'test-two' }
			])
			.then(id => {
				return vc.getVersions(id).then(versions => ({ id, versions }))
			})
			.then(data => {
				return vc.getVersionDiff(data.versions[1].version._id)
			})
			.then(diff => {
				expect(diff).to.have.property('documentId')
				expect(diff).to.have.property('changes')
				expect(diff).to.have.property('hash')
				expect(diff.changes).to.have.length(1)
				expect(diff.changes[0].path[0]).to.eql('title')
			})
		})
	})

	describe('saveVersion', function() {
		beforeEach(function(done) {
			mockgoose(mongoose)
				.then(() => {
					mongoose.connect('mongodb://testing', err => {
						done(err)
					})
				})
		})

		afterEach(function(done) {
			delete mongoose.connection.models['posts']
			mongoose.unmock(done)
		})

		it('should add a new document to the `versions` collection', function() {
			const connection = mongoose.connection
			const model = connection.model('posts',
				new mongoose.Schema({
					title: String,
					slug: String
				})
			)

			const vc = new VersionControl(connection)

			return model
				.create({ title: 'new version test', slug: 'new-version-test' })
				.then(doc => {
					return vc.saveVersion(doc._id, doc)
						.then(() => {
							return vc.getVersions(doc._id)
						})
						.then(versions => {
							expect(versions).to.have.length(1)
						})
				})
		})

		it('should resolve with the new version diff', function() {
			const connection = mongoose.connection
			const model = connection.model('posts',
				new mongoose.Schema({
					title: String,
					slug: String
				})
			)

			const vc = new VersionControl(connection)

			return model
				.create({ title: 'new version test', slug: 'new-version-test' })
				.then(doc => {
					return vc.saveVersion(doc._id, doc)
						.then(diff => {
							expect(diff).to.have.property('documentId')
							expect(diff).to.have.property('changes')
							expect(diff).to.have.property('hash')
						})
				})
		})

		it('should create a hash that matches the document', function() {
			const connection = mongoose.connection
			const model = connection.model('posts',
				new mongoose.Schema({
					title: String,
					slug: String
				})
			)

			const vc = new VersionControl(connection)

			return model
				.create({ title: 'new version test', slug: 'new-version-test' })
				.then(doc => {
					return vc.saveVersion(doc._id, doc)
						.then(diff => {
							expect(diff).to.have.property('hash', VersionControl.hashDocument(doc))
						})
				})
		})
	})

	describe('restoreVersion', function() {
		beforeEach(function(done) {
			mockgoose(mongoose)
				.then(() => {
					mongoose.connect('mongodb://testing', err => {
						done(err)
					})
				})
		})

		afterEach(function(done) {
			delete mongoose.connection.models['posts']
			mongoose.unmock(done)
		})

		it('should update the document to reflect the specified version', function() {
			const connection = mongoose.connection
			const coll = new Collection('test', {
				singular: 'Test',
				fields: {
					title: {
						label: 'Title',
						schemaType: String
					},
					slug: {
						label: 'Slug',
						schemaType: String
					}
				}
			}, { connection: connection })

			const vc = new VersionControl(connection)

			return createDocVersions(coll.model, vc.model, [
				{ title: 'version test1', slug: 'test-one' },
				{ title: 'version test2' },
				{ slug: 'test-two' }
			])
			.then(id => {
				return vc.getVersions(id).then(versions => ({ id, versions }))
			})
			.then(data => {
				return vc.restoreVersion(data.id, data.versions[1].version._id, coll)
					.then(() => {
						return coll.readById(data.id)
					})
			})
			.then(doc => {
				expect(doc).to.have.property('title', 'version test2')
				expect(doc).to.not.have.property('slug', 'test-two')
			})
		})
	})
})