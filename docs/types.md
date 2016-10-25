# Custom Types

Custom types can be defined for field in a collection definition that require
behavior that doesn't exist with the standard types. A custom type is simply
an object that extends some base type.

Type definition files export a function that takes a single argument–a map of
the existing types. The function should return an object with the same properties
used for collection definition's field definitions.

When a type is loaded by the system, it is wrapped in a higher-order function.
The function takes an object as its only argument. That object is used to
extend the properties of the type.

**Example**

```javascript
// types/email.js
module.exports = Types => ({
	name: 'email',
	type: Types.String,
	validate: {
		validator: val => /.+@.+\..+/.test(val),
		message: '{PATH} must be a valid email address'
	}
})

// collections/users.js
module.exports = Types => ({
	singular: 'User',
	fields: {
		email: {
			label: 'Email Address',
			schemaType: Types.Email({
				required: true
			})
		}
	}
})
```

The above example defines a new custom type, `Email`. The new type is then used
for the `email` field in the `users` collection. The collection's field also
extends the type properties by setting `required` to `true`.

**Note**: When a type is loaded by the framework, the name is transformed into
PascalCase.