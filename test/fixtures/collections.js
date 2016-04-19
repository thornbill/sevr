'use strict'

const types = require('mongoose').Schema.Types

module.exports = {

	users: {
		singular: 'User',
		fields: {
			username: {
				label: 'Username',
				schemaType: {
					type: String,
					required: true
				}
			},
			email: {
				label: 'Email',
				schemaType: {
					type: String
				}
			},
			name: {
				label: 'Name',
				schemaType: {
					first: { type: String },
					last: { type: String }
				}
			}
		},
		meta: {
			description: 'A collection of users for the CMS'
		},
		permissions: {
			read: 'admin',
			write: 'admin'
		}
	},

	posts: {
		singular: 'Post',
		fields: {
			title: {
				label: 'Title',
				schemaType: {
					type: String,
					required: true
				}
			},
			content: {
				label: 'Content',
				schemaType: {
					type: String,
					validate: {
						validator: val => {
							return val != 'foobar'
						},
						message: '{PATH} must not equal foobar'
					}
				}
			},
			author: {
				label: 'Author',
				schemaType: {
					type: types.ObjectId,
					ref: 'User',
					required: true
				}
			},
			version: {
				label: 'Version',
				schemaType: { type: Number, default: 1, select: false }
			}
		}
	},

	tags: {
		singular: 'Tag',
		fields: {},
		permissions: {
			read: '*',
			write: ['admin','author']
		}
	},

	sample: {
		singular: 'Sample',
		fields: {
			withSetter: {
				label: 'With Setter',
				schemaType: {
					type: String,
					set: () => { return 'hardcoded-set' }
				}
			},
			withGetter: {
				label: 'With Getter',
				schemaType: {
					type: String,
					get: () => { return 'hardcoded-get' }
				}
			}
		}
	},

	authCollection: {
		singular: 'AuthUser',
		fields: {
			username: {
				label: 'Username',
				schemaType: { type: String }
			},
			password: {
				label: 'Password',
				schemaType: { type: String }
			}
		}
	},

	authErrorCollection: {
		singular: 'AuthErrorUser',
		fields: {
			name: {
				label: 'Name',
				schemaType: { type: String }
			}
		}
	},

	selectCollection: {
		singular: 'SelectCollection',
		fields: {
			visible: {
				label: 'Visible',
				schemaType: { type: String }
			},
			hidden: {
				label: 'Hidden',
				schemaType: { type: String, select: false }
			}
		}
	}

}
