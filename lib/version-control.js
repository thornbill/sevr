'use strict'

const mongoose = require('mongoose')
const deepDiff = require('deep-diff')
const objectHash = require('object-hash')

const Schema = mongoose.Schema
const $model = mongoose.model('version',
	new Schema({
		documentId: Schema.Types.ObjectId,
		changes: Schema.Types.Mixed,
		hash: Schema.Types.String,
		meta: Schema.Types.Mixed
	})
)

const VersionControl = {
	model: $model,

	/**
	 * Get all document versions for any given document.
	 * Returns a promise the resolves with an array of versions.
	 * Versions are in last-in-first-out order
	 * 
	 * Each version is an object with two properties:
	 * - `version`: The version document
	 * - `doc`: The complete document with version changes applied
	 * 
	 * @param {String|ObjectId} docId
	 * @returns {Promise}
	 */
	getVersions(docId) {
		return $model
			.find({ documentId: docId })
			.sort({ '_id': 1 })
			.then(docs => {
				return docs.reduce((prev, doc) => {
					return [
						...prev,
						{
							version: doc,
							doc: VersionControl._applyChanges(prev.length ? prev[prev.length-1].doc : {}, doc.changes)
						}
					]
				}, []).slice().sort(e => 1)
			})
	},

	/**
	 * Get the latest version of a document
	 * 
	 * @param {String|ObjectId} docId
	 * @returns {Promise}
	 */
	getLatest(docId) {
		return VersionControl.getVersions(docId)
			.then(versions => {
				return versions[0]
			})
	},

	/**
	 * Get a document at the specified version
	 * 
	 * @param {ObjectId|String} docId
	 * @param {ObjectId|String} versionId
	 * @returns {Promise}
	 */
	getVersion(docId, versionId) {
		return $model
			.find({
				documentId: docId,
				_id: { $lte: mongoose.Types.ObjectId(versionId) }
			})
			.sort({ '_id': 1 })
			.then(docs => {
				return docs.reduce((prev, doc) => {
					return {
						version: doc,
						doc: VersionControl._applyChanges(prev.doc, doc.changes)
					}
				}, {})
			})
	},

	/**
	 * Get the version diffs for a document.
	 * Like `getVersions`, but does not include the applied documents
	 * 
	 * @param {ObjectId|String} docId
	 * @returns {Promise}
	 */
	getDiffs(docId) {
		return $model
			.find({ documentId: docId })
			.sort({ '_id': 1 })
			.then(docs => {
				return docs.map(doc => { return doc.toObject() })
			})
	},

	/**
	 * Get the latest version diff for a document
	 * Like `getLatest`, but does not include the applied document
	 * 
	 * @param {ObjectId|String} docId
	 * @returns {Promise}
	 */
	getLatestDiff(docId) {
		return $model
			.find({ documentId: docId })
			.sort({ '_id': -1 })
			.limit(1)
			.then(docs => {
				return docs[0].toObject()
			})
	},

	/**
	 * Get a specific version diff
	 * Like `getVersion`, but does not include the applied document
	 * 
	 * @param {ObjectId|String} versionId
	 * @returns {Promise}
	 */
	getVersionDiff(versionId) {
		return $model
			.findById(versionId)
			.then(doc => doc.toObject())
	},

	/**
	 * Save a new version of the document
	 * Resolves with the new version diff
	 * 
	 * @param {ObjectId|String} docId
	 * @param {Object} newDoc
	 * @returns {Promise}
	 */
	saveVersion(docId, newDoc) {
		return this.getLatest(docId)
			.then(latest => {
				const prev = latest ? latest.doc : {}

				// Do not create a new version if the document hasn't changed'
				if (latest && VersionControl.hashDocument(newDoc) === latest.version.hash) {
					return latest
				}

				return $model
					.create({
						documentId: docId,
						changes: deepDiff.diff(prev, newDoc.toObject()),
						hash: VersionControl.hashDocument(newDoc)
					})
					.then(version => {
						return version.toObject()
					})
			})
	},

	/**
	 * Restore a particular version of a document.
	 * In order to maintain history, this operation creates
	 * a new version rather than rolling back to the original.
	 * 
	 * @param {ObjectId|String} docId
	 * @param {ObjectId|String} versionId
	 * @param {Collection} collection
	 * @returns {Promise}
	 */
	restoreVersion(docId, versionId, collection) {
		return this.getVersion(docId, versionId)
			.then(version => {
				return collection.updateById(docId, version.doc)
			})
			.then(doc => {
				return VersionControl.saveVersion(docId, doc)
			})
	},

	/**
	 * Add version control methods to a collection schema
	 * 
	 * This enables version control access on a per-document
	 * basis
	 * 
	 * @param {Collect} collection
	 * @param {Schema} schema
	 */
	applyCollectionMethods(collection, schema) {
		schema.methods.getLatestVersion = function() {
			return VersionControl.getLatest(this._id)
		}

		schema.methods.getVersions = function() {
			return VersionControl.getVersions(this._id)
		}

		schema.methods.getLatestDiff = function() {
			return VersionControl.getLatestDiff(this._id)
		}

		schema.methods.getDiffs = function() {
			return VersionControl.getDiffs(this._id)
		}

		schema.methods.saveVersion = function() {
			return VersionControl.saveVersion(this._id, this)
		}

		schema.methods.restoreVersion = function(versionId) {
			return VersionControl.restoreVersion(this._id, versionId, collection)
		}
	},

	/**
	 * Apply the diff  changes to an object
	 * 
	 * @param {Object} initial
	 * @param {Array} changes
	 * @returns {Object}
	 * @private
	 */
	_applyChanges(initial, changes) {
		const target = Object.assign({}, initial)
		
		if (!Array.isArray(changes)) {
			return target
		}

		changes.forEach(change => {
			deepDiff.applyChange(target, {}, change)
		})

		return target
	},

	/**
	 * Create a SHA1 hash of the document
	 * 
	 * @param {Document} doc
	 * @return {String}
	 */
	hashDocument(doc) {
		return objectHash(
			JSON.parse(JSON.stringify(doc)),
			{ respectType: false }
		)
	}
}

module.exports = VersionControl