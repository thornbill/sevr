'use strict'

module.exports = types => {
	return {
		singular: 'Author',
		fields: {
			name: {
				label: 'Name',
				schemaType: {
					first: types.String({ required: true }),
					last: types.String({ required: true })
				}
			},
			username: {
				label: 'Username',
				schemaType: types.String({ required: true })
			},
			email: {
				label: 'Email',
				schemaType: types.String({ required: true })
			}
		}
	}
}
