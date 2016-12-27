'use strict'

const collection = require('../collections')

class Links extends Map {
	getCollection(fieldDefinition) {
		const modelName = this.get(fieldDefinition)

		if (!modelName) return
		return collection.getByModelName(modelName).instance
	}
}

module.exports = new Links()