'use strict'

module.exports = types => ({
	name: 'foo',
	type: types.String,
	validate: {
		validator: function(val) {
			return val === 'foo'
		},
		message: '{PATH} must equal foo'
	}
})
