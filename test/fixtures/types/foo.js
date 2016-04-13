'use strict'

module.exports = {
	name: 'foo',
	type: String,
	validate: {
		validator: function(val) {
			return val === 'foo'
		},
		message: '{PATH} must equal foo'
	}
}
