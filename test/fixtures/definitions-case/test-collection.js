'use strict'

module.exports = types => {
	return {
		singular: 'TestCollection',
		fields: {
			title: {
				label: 'Title',
				schemaType: types.String()
			}
		}
	}
}
