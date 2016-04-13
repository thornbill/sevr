'use strict'

module.exports = {
	name: 'email',
	type: String,
	validate: {
		validator: function(val) {
			return /.+@.+\..+/.test(val)
		},
		message: '{PATH} must be a valid email address'
	}
}
