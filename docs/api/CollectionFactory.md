<a name="CollectionFactory"></a>

## CollectionFactory
**Kind**: global class  

* [CollectionFactory](#CollectionFactory)
    * [new CollectionFactory(defs, connection)](#new_CollectionFactory_new)
    * [.collections](#CollectionFactory+collections) ⇒ <code>Object</code>
    * [.connection](#CollectionFactory+connection)
    * [.getInstance(name)](#CollectionFactory+getInstance) ⇒ <code>Collection</code>
    * [.getInstanceWithModel(modelName)](#CollectionFactory+getInstanceWithModel) ⇒ <code>Collection</code>

<a name="new_CollectionFactory_new"></a>

### new CollectionFactory(defs, connection)
Collection Factory

Singleton used to create and store a map
of collections.


| Param | Type |
| --- | --- |
| defs | <code>Object</code> | 
| connection | <code>Mongoose.Connection</code> | 

<a name="CollectionFactory+collections"></a>

### collectionFactory.collections ⇒ <code>Object</code>
Get all collection instances

**Kind**: instance property of <code>[CollectionFactory](#CollectionFactory)</code>  
**Read only**: true  
<a name="CollectionFactory+connection"></a>

### collectionFactory.connection
Get the Mongoose connection

**Kind**: instance property of <code>[CollectionFactory](#CollectionFactory)</code>  
**Read only**: true  
<a name="CollectionFactory+getInstance"></a>

### collectionFactory.getInstance(name) ⇒ <code>Collection</code>
Get a collection instance by name

**Kind**: instance method of <code>[CollectionFactory](#CollectionFactory)</code>  

| Param | Type |
| --- | --- |
| name | <code>String</code> | 

<a name="CollectionFactory+getInstanceWithModel"></a>

### collectionFactory.getInstanceWithModel(modelName) ⇒ <code>Collection</code>
Get a collection instance by model name

**Kind**: instance method of <code>[CollectionFactory](#CollectionFactory)</code>  

| Param | Type |
| --- | --- |
| modelName | <code>String</code> | 

