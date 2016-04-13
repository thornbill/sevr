'use strict'

module.exports = types => {
	return {
		singular: 'Post',
		fields: {
			title: {
				label: 'Title',
				schemaType: types.String({ required: true, trim: true })
			},
			slug: {
				label: 'Slug',
				schemaType: types.String({ required: true })
			},
			content: {
				label: 'Content',
				schemaType: types.String()
			},
			author: {
				label: 'Author',
				schemaType: types.ObjectId({ ref: 'Author', required: true })
			},
			tags: {
				label: 'Tags',
				schemaType: [types.ObjectId({ ref: 'Tag' })]
			}
		}
	}
}
