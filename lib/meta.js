const mongoose = require('mongoose')
const Schema = mongoose.Schema

const $metadata = mongoose.model('metadata',
	new Schema({
		namespace: {
			type: String,
			required: true
		},
		data: Schema.Types.Mixed
	})
)

let instances = {}

exports.getInstance = function(namespace) {
	let cache

	if (instances.hasOwnProperty(namespace)) {
		instances[namespace]
	}

	const instance = {
		get: (key) => {
			if (cache !== undefined) {
				return Promise.resolve(cache[key])
			}

			return getMetadata(namespace)
				.then(doc => {
					if (!doc) return undefined
					cache = doc.data
					return doc.data[key]
				})
		},

		put: (key, value) => {
			return putMetadata(namespace, key, value)
				.then(doc => {
					if (!doc) throw new Error(`Failed to put metadata '${key}' in '${namespace}'`)
					cache = doc.data
					return doc.data[key]
				})
		}
	}

	instances[namespace] = instance
	return instance
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
