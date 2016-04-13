'use strict'

module.exports = types => {
	return {
		singular: 'TestCollection2',
		fields: {
			title: {
				label: 'Title',
				schemaType: types.String()
			}
		}
	}
}
