<a name="Collection"></a>

## Collection
**Kind**: global class  

* [Collection](#Collection)
    * [new Collection()](#new_Collection_new)
    * _instance_
        * [.name](#Collection+name)
        * [.definition](#Collection+definition)
        * [.modelName](#Collection+modelName)
        * [.populationFields](#Collection+populationFields)
        * [.model](#Collection+model)
        * [.schema](#Collection+schema)
        * [.meta](#Collection+meta)
        * [.defaultField](#Collection+defaultField)
        * [.getFields([flatten])](#Collection+getFields) ⇒ <code>Object</code>
        * [.inflateFields(flattened)](#Collection+inflateFields) ⇒ <code>Object</code>
        * [.getField(fieldName, [flatten])](#Collection+getField) ⇒ <code>Object</code> &#124; <code>Array</code>
        * [.getRefOptions()](#Collection+getRefOptions) ⇒ <code>Promise</code>
        * [.getFieldTypeName(fieldName)](#Collection+getFieldTypeName) ⇒ <code>String</code>
        * [.getFieldTypes(fieldName)](#Collection+getFieldTypes) ⇒ <code>Array</code>
        * [.getMeta([prop])](#Collection+getMeta) ⇒ <code>\*</code>
        * [.extendFieldSchema(field, prop, value)](#Collection+extendFieldSchema) ⇒ <code>[Collection](#Collection)</code>
        * [.addField(name, label, schemaType)](#Collection+addField) ⇒ <code>[Collection](#Collection)</code>
        * [.attachHook(when, type, cb)](#Collection+attachHook) ⇒ <code>[Collection](#Collection)</code>
        * [.useBefore(op, fn)](#Collection+useBefore) ⇒ <code>[Collection](#Collection)</code>
        * [.useAfter(op, fn)](#Collection+useAfter) ⇒ <code>[Collection](#Collection)</code>
        * [.read([query], [selectFields], [populate], [single], [returnQuery])](#Collection+read) ⇒ <code>Promise</code> &#124; <code>Query</code>
        * [.readById(id, [selectFields], [populate], [returnQuery])](#Collection+readById) ⇒ <code>Promise</code> &#124; <code>Query</code>
        * [.create(data)](#Collection+create) ⇒ <code>Promise</code>
        * [.update(docs)](#Collection+update) ⇒ <code>Promise</code>
        * [.updateById(id, data)](#Collection+updateById) ⇒ <code>Promise</code>
        * [.del()](#Collection+del)
        * [.delById(id)](#Collection+delById) ⇒ <code>Promise</code>
    * _static_
        * [.isValidDefinition(definition, [errors])](#Collection.isValidDefinition) ⇒ <code>Boolean</code>
        * [.isValidField(fieldDef, errors)](#Collection.isValidField) ⇒ <code>Boolean</code>
        * [.getFieldRef(fieldDef)](#Collection.getFieldRef) ⇒ <code>String</code>
        * [.getFieldRefDisplay(fieldDef)](#Collection.getFieldRefDisplay) ⇒ <code>String</code>

<a name="new_Collection_new"></a>

### new Collection()
Collection

The Collection class is used primarily for interfacing with
the data

<a name="Collection+name"></a>

### collection.name
The Collection name

**Kind**: instance property of <code>[Collection](#Collection)</code>  
**Read only**: true  
<a name="Collection+definition"></a>

### collection.definition
The collection definition

**Kind**: instance property of <code>[Collection](#Collection)</code>  
**Read only**: true  
<a name="Collection+modelName"></a>

### collection.modelName
The name of the collection model

**Kind**: instance property of <code>[Collection](#Collection)</code>  
**Read only**: true  
<a name="Collection+populationFields"></a>

### collection.populationFields
An array of fields that will be populated by
other collections

**Kind**: instance property of <code>[Collection](#Collection)</code>  
**Read only**: true  
<a name="Collection+model"></a>

### collection.model
The Mongoose model

**Kind**: instance property of <code>[Collection](#Collection)</code>  
**Read only**: true  
<a name="Collection+schema"></a>

### collection.schema
The model schema

**Kind**: instance property of <code>[Collection](#Collection)</code>  
**Read only**: true  
<a name="Collection+meta"></a>

### collection.meta
The collection's metadata as defined in the
collection definition'

**Kind**: instance property of <code>[Collection](#Collection)</code>  
**Read only**: true  
<a name="Collection+defaultField"></a>

### collection.defaultField
The default field specified in the collection.
Defaults to `_id`

**Kind**: instance property of <code>[Collection](#Collection)</code>  
**Read only**: true  
<a name="Collection+getFields"></a>

### collection.getFields([flatten]) ⇒ <code>Object</code>
Return all collection field definitions

If flatten is true, the result will flatten all
nested properties.

**Kind**: instance method of <code>[Collection](#Collection)</code>  

| Param | Type | Default |
| --- | --- | --- |
| [flatten] | <code>Boolean</code> | <code>false</code> | 

<a name="Collection+inflateFields"></a>

### collection.inflateFields(flattened) ⇒ <code>Object</code>
Inflate fields that have been flattened

**Kind**: instance method of <code>[Collection](#Collection)</code>  

| Param | Type |
| --- | --- |
| flattened | <code>Object</code> | 

**Example**  
```js
const fields = {
    'name.first': {
        flattened: true,
        label: 'First',
        schemaType: { type: String }
    },
    'name.last': {
        flattened: true,
        label: 'Last',
        schemaType: { type: String }
    },
}

inflateFields(fields)
// {
//     name: {
//        label: 'Name',
//        schemaType: {
//            first: { label: 'First', type: String },
//            last: { label: 'Last', type: String }
//        }
//     }
// }
```
<a name="Collection+getField"></a>

### collection.getField(fieldName, [flatten]) ⇒ <code>Object</code> &#124; <code>Array</code>
Return a field from the definition.

If the field has a ref, add `referenceModel` property.
Optionally flatten a nested property structure.

**Kind**: instance method of <code>[Collection](#Collection)</code>  

| Param | Type | Default |
| --- | --- | --- |
| fieldName | <code>String</code> |  | 
| [flatten] | <code>Boolean</code> | <code>false</code> | 

<a name="Collection+getRefOptions"></a>

### collection.getRefOptions() ⇒ <code>Promise</code>
Get the available options for all reference fields

**Kind**: instance method of <code>[Collection](#Collection)</code>  
<a name="Collection+getFieldTypeName"></a>

### collection.getFieldTypeName(fieldName) ⇒ <code>String</code>
Get the field type name

Normalizes the name for fields that may
contain an array of values.

**Kind**: instance method of <code>[Collection](#Collection)</code>  

| Param | Type |
| --- | --- |
| fieldName | <code>String</code> | 

<a name="Collection+getFieldTypes"></a>

### collection.getFieldTypes(fieldName) ⇒ <code>Array</code>
Get an array of field types associated with the field

Values are in the following order:
1. Field name
2. Schema name
3. Mongoose schema type name (usually a constructor)
4. 'COMPLEX'

'COMPLEX' is used for fields that have a nested property structure

**Kind**: instance method of <code>[Collection](#Collection)</code>  

| Param | Type |
| --- | --- |
| fieldName | <code>String</code> | 

<a name="Collection+getMeta"></a>

### collection.getMeta([prop]) ⇒ <code>\*</code>
Get the meta property, or all meta if no property provided

If the property value is an object, a copy of the object
is returned in order to maintain immutability.

**Kind**: instance method of <code>[Collection](#Collection)</code>  

| Param | Type |
| --- | --- |
| [prop] | <code>String</code> | 

<a name="Collection+extendFieldSchema"></a>

### collection.extendFieldSchema(field, prop, value) ⇒ <code>[Collection](#Collection)</code>
Extend a field schema

**Kind**: instance method of <code>[Collection](#Collection)</code>  

| Param | Type |
| --- | --- |
| field | <code>String</code> | 
| prop | <code>String</code> | 
| value | <code>\*</code> | 

<a name="Collection+addField"></a>

### collection.addField(name, label, schemaType) ⇒ <code>[Collection](#Collection)</code>
Add a field to the collection definition

**Kind**: instance method of <code>[Collection](#Collection)</code>  

| Param | Type |
| --- | --- |
| name | <code>String</code> | 
| label | <code>String</code> | 
| schemaType | <code>\*</code> | 

<a name="Collection+attachHook"></a>

### collection.attachHook(when, type, cb) ⇒ <code>[Collection](#Collection)</code>
Attach a hook to the schema

`when` must be 'pre' or 'post'.
`type` can be any Mongoose hook type.

**Kind**: instance method of <code>[Collection](#Collection)</code>  

| Param | Type |
| --- | --- |
| when | <code>String</code> | 
| type | <code>String</code> | 
| cb | <code>function</code> | 

<a name="Collection+useBefore"></a>

### collection.useBefore(op, fn) ⇒ <code>[Collection](#Collection)</code>
Add `before` middleware for query operation

The callback function will be passed a query
instance, and must return a value in order for
the next middleware to be called. for
asynchronous actions, the callback can return a
Promise. An error can be thrown to exit the middleware
chain.

**Kind**: instance method of <code>[Collection](#Collection)</code>  

| Param | Type |
| --- | --- |
| op | <code>String</code> | 
| fn | <code>function</code> | 

**Example**  
```js
collection.useBefore('read', query => {
    console.log(`called read with ${query}`)
    return query
})
```
<a name="Collection+useAfter"></a>

### collection.useAfter(op, fn) ⇒ <code>[Collection](#Collection)</code>
Add `after` middleware for query operation

The callback function will be passed the resulting
object from the database call.

**Kind**: instance method of <code>[Collection](#Collection)</code>  

| Param | Type |
| --- | --- |
| op | <code>String</code> | 
| fn | <code>function</code> | 

**Example**  
```js
collection.useAfter('read', result => {
    console.log(`called succeeded with ${result}`)
    return result
})
```
<a name="Collection+read"></a>

### collection.read([query], [selectFields], [populate], [single], [returnQuery]) ⇒ <code>Promise</code> &#124; <code>Query</code>
Read the collection

Promise resolves with an array of found documents
or a single document object if `single` is true.

**Kind**: instance method of <code>[Collection](#Collection)</code>  

| Param | Type | Default |
| --- | --- | --- |
| [query] | <code>Object</code> |  | 
| [selectFields] | <code>Array</code> |  | 
| [populate] | <code>Boolean</code> | <code>false</code> | 
| [single] | <code>Boolean</code> | <code>false</code> | 
| [returnQuery] | <code>Boolean</code> | <code>false</code> | 

**Example**  
```js
// Read all documents from the collection
collection.read()
    .then(res => {
        console.log(res)
    })

// Read all documents where qty > 10
collection.read({ qty: { $gt: 10 }})
    .then(res => {
        console.log(res)
    })
```
<a name="Collection+readById"></a>

### collection.readById(id, [selectFields], [populate], [returnQuery]) ⇒ <code>Promise</code> &#124; <code>Query</code>
Read a single document by id

Promise resolves with a single document object

**Kind**: instance method of <code>[Collection](#Collection)</code>  

| Param | Type | Default |
| --- | --- | --- |
| id | <code>ObjectId</code> &#124; <code>String</code> &#124; <code>Number</code> |  | 
| [selectFields] | <code>Array</code> |  | 
| [populate] | <code>Boolean</code> | <code>false</code> | 
| [returnQuery] | <code>Boolean</code> | <code>false</code> | 

<a name="Collection+create"></a>

### collection.create(data) ⇒ <code>Promise</code>
Create a new document within the collection

The resolved document will populate all referenced fields

**Kind**: instance method of <code>[Collection](#Collection)</code>  

| Param | Type |
| --- | --- |
| data | <code>Object</code> | 

**Example**  
```js
collection.create({
    name: { first: 'John', last: 'Doe' }
})
```
<a name="Collection+update"></a>

### collection.update(docs) ⇒ <code>Promise</code>
Overwrite the collection with new documents

Promise resolves with the array of documents

**Kind**: instance method of <code>[Collection](#Collection)</code>  

| Param | Type |
| --- | --- |
| docs | <code>Array</code> | 

**Example**  
```js
colleciton.update([
    {
        name: 'Shirt'
        qty: 10
    },
    {
        name: 'Pants'
        qty: 5
     }
])
```
<a name="Collection+updateById"></a>

### collection.updateById(id, data) ⇒ <code>Promise</code>
Update a single document by id

Promise resolves with the updated document

**Kind**: instance method of <code>[Collection](#Collection)</code>  

| Param | Type |
| --- | --- |
| id | <code>ObjectId</code> &#124; <code>String</code> &#124; <code>Number</code> | 
| data | <code>Object</code> | 

<a name="Collection+del"></a>

### collection.del()
Delete all documents from the collection

Promise will resolve with an array of the
documents removed.

**Kind**: instance method of <code>[Collection](#Collection)</code>  
**Returns{promise}**:   
<a name="Collection+delById"></a>

### collection.delById(id) ⇒ <code>Promise</code>
Delete a single document from the collection

**Kind**: instance method of <code>[Collection](#Collection)</code>  

| Param | Type |
| --- | --- |
| id | <code>ObjectId</code> &#124; <code>String</code> &#124; <code>Number</code> | 

<a name="Collection.isValidDefinition"></a>

### Collection.isValidDefinition(definition, [errors]) ⇒ <code>Boolean</code>
Check if a collection definition is valid

**Kind**: static method of <code>[Collection](#Collection)</code>  

| Param | Type | Description |
| --- | --- | --- |
| definition | <code>Object</code> |  |
| [errors] | <code>Array</code> | Mutated by the method to return all errors |

<a name="Collection.isValidField"></a>

### Collection.isValidField(fieldDef, errors) ⇒ <code>Boolean</code>
Check if a field definition is valid

**Kind**: static method of <code>[Collection](#Collection)</code>  

| Param | Type |
| --- | --- |
| fieldDef | <code>Object</code> | 
| errors | <code>Array</code> | 

<a name="Collection.getFieldRef"></a>

### Collection.getFieldRef(fieldDef) ⇒ <code>String</code>
Get the field ref from a field definition

**Kind**: static method of <code>[Collection](#Collection)</code>  

| Param | Type |
| --- | --- |
| fieldDef | <code>Object</code> | 

<a name="Collection.getFieldRefDisplay"></a>

### Collection.getFieldRefDisplay(fieldDef) ⇒ <code>String</code>
Get the field name used for displaying a refrence field

**Kind**: static method of <code>[Collection](#Collection)</code>  

| Param | Type |
| --- | --- |
| fieldDef | <code>Object</code> | 

