const mongoose = require('mongoose')
const Schema = mongoose.Schema

let $metadata
let instances = {}

exports.createModel = (db) => {
	$metadata = db.model('metadata',
		new Schema({
			namespace: {
				type: String,
				required: true
			},
			data: Schema.Types.Mixed
		})
	)
}

exports.getInstance = function(namespace) {
	let cache

	if (instances.hasOwnProperty(namespace)) {
		return Promise.resolve(instances[namespace])
	}

	return getMetadata(namespace)
		.then(data => {
			cache = data ? data.data : undefined

			const instance = {
				get: (key) => {
					return cache ? cache[key] : undefined
				},

				put: (key, value) => {
					return putMetadata(namespace, key, value)
						.then(doc => {
							if (!doc) throw new Error(`Failed to put metadata '${key}' in '${namespace}'`)
							cache = doc.data
							return doc.data[key]
						})
				},

				remove: (key) => {
					delete cache[key]
					return removeMetadata(namespace, key)
				}
			}

			instances[namespace] = instance
			return instance
		})
}

exports.destroy = function() {
	instances = {}
}

const getMetadata = namespace => {
	return $metadata
		.findOne({ namespace })
		.exec()
}

const putMetadata = (namespace, key, value) => {
	return $metadata
		.findOneAndUpdate(
			{ namespace },
			{ $set: { [`data.${key}`]: value } },
			{ upsert: true, new: true }
		)
		.exec()
}

const removeMetadata = (namespace, key) => {
	return $metadata
		.findOneAndUpdate(
			{ namespace },
			{ $unset: { [`data.${key}`]: '' } }
		)
		.exec()
}
