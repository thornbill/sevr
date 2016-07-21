'use strict'

module.exports = types => ({
	name: 'email',
	type: types.String,
	validate: {
		validator: function(val) {
			return /.+@.+\..+/.test(val)
		},
		message: '{PATH} must be a valid email address'
	}
})
