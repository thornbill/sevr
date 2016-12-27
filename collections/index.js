'use strict'

let collections = []

module.exports = {
	add(name, modelName, instance) {
		collections.push({ name, modelName, instance })
	},

	getByName(name) {
		return collections.find(coll => coll.name === name)
	},

	getByModelName(modelName) {
		return collections.find(coll => coll.modelName === modelName)
	},

	getByInstance(instance) {
		return collections.find(coll => coll.instance === instance)
	},

	getNames() {
		return collections.map(coll => coll.name)
	},

	getModelNames() {
		return collections.map(coll => coll.modelName)
	},

	getInstances() {
		return collections.map(coll => coll.instance)
	},

	clear() {
		collections = []
	}
}