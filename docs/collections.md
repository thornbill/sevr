# Collection Definitions

Collections are defined using collection definitions–a JavaScript function
which reutrns an object that defines the structure and behavior of a
Collection.

The function is passed a single argument, `Types`, which is an object
consisting of all available field types.

Below are the properties, which are used in a collection
definition object

### singular : `String`
**required**

The singular name of a collection. In Mongoose terms, this is the model name.
The convention is to have the value be in PascalCase.

**Examples**

| collection | singular |
| --- | --- |
| users | User |
| posts | Post |

### fields : `Object`
**required**

A map where the property is the field name, and the value is the
field definition.

**Example**

```javascript
fields: {
	username: {
		label: 'Username',
		schemaType: Types.String()
	}
}
```

### defaultField : `String`
This property is commonly used to identify a single document from a list of
documents. The value should be a string that references a field name from
the same collection. This field is optional, and when not present, will
default to `_id`, the MongoDB ID field.

**Example**

```javascript
{
	fields: {
		username: {...},
		email: {...},
		password: {...}
	},
	defaultField: 'username'
}
```

## virtuals: `Object`
A map of virtual properties. These are fields that do not exist in the
database, but are computed on demand.

**Example**

```javascript
virtuals: {
	'name.full': {
		get: function() {
			return `${this.name.first} ${this.name.last}`
		}
	}
}
```

### meta : `Object`
This property is used to store arbitrary metadata, describing additional
information about the collection itself. Certain plugins may require various
properties be set within this object.

**Example**

```javascript
meta: {
	description: 'This is a hypothetical meta property'
}
```

# Field Definitions
Field definitions are used to define the properties of a field. These are the
values used in the `fields` map within the collection definition.

These are plain JavaScript object, which may have a number of different
properties:

### label : `String`
**required**

This property is used when displaying the field name.

**Example**

```javascript
title: {
	label: 'Post Title',
	...
}
```

## schemaType: `Array|Object`
**required**

This properties defines how the field data is handled. If the field will only
hold a single value, it should be an object. If the field is to hold a number
of different values, it should be an array of objects. The `schemaType` object
supports all Mongoose schema properties. Some of which are:

- `default`
- `enum`
- `expires`
- `get`
- `lowercase`
- `match`
- `max`
- `maxlength`
- `min`
- `minlength`
- `required`
- `select`
- `set`
- `trim`
- `type`
- `uppercase`
- `validate`
	- `validator`
	- `message`

Additionally, Sevr adds the following properties:

| Property | Description |
| --- | --- |
| `label` | The label used for a nested property |
| `ref` | A reference model. Used to link values to other collections |
| `display` | The field to display from a linked collection |

**Examples**

```javascript
qty: {
	label: 'Quantity',
	schemaType: {
		type: Number,
		min: 0,
		required: true
	}
}

name: {
	label: 'Name',
	schemaType: {
		first: {
			type: String,
			required: true,
			label: 'First'
		},
		last: {
			type: String,
			required: true,
			label: 'Last'
		}
	}
}

size: {
	label: 'Size',
	schemaType: [{
		type: String,
		enum: ['Small', 'Medium', 'Large']
	}]
}

author: {
	label: 'Author',
	schemaType: Types.ObjectId({
		ref: 'User',
		display: 'username'
	})
}
```