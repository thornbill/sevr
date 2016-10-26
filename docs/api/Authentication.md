<a name="Authentication"></a>

## Authentication
**Kind**: global class  

* [Authentication](#Authentication)
    * [new Authentication(tokenSecret, metadata)](#new_Authentication_new)
    * _instance_
        * [.isEnabled](#Authentication+isEnabled) : <code>Boolean</code>
        * [.isFirstEnable](#Authentication+isFirstEnable) : <code>Boolean</code>
        * [.collection](#Authentication+collection) : <code>Collection</code>
        * [.events](#Authentication+events) : <code>EventEmitter</code>
        * [.user](#Authentication+user) : <code>Object</code>
        * [.setMeta(meta)](#Authentication+setMeta) ⇒ <code>[Authentication](#Authentication)</code>
        * [.invalidate()](#Authentication+invalidate) ⇒ <code>[Authentication](#Authentication)</code>
        * [.reset()](#Authentication+reset) ⇒ <code>[Authentication](#Authentication)</code>
        * [.enable(coll)](#Authentication+enable) ⇒ <code>Promise</code>
        * [.validateCredentials(creds)](#Authentication+validateCredentials) ⇒ <code>Promise</code>
        * [.createToken(user)](#Authentication+createToken) ⇒ <code>Promise</code>
        * [.verifyToken(token)](#Authentication+verifyToken) ⇒ <code>Promise</code>
    * _static_
        * [.normalizeUser(userDoc)](#Authentication.normalizeUser) ⇒ <code>Object</code>

<a name="new_Authentication_new"></a>

### new Authentication(tokenSecret, metadata)
Authentication interface


| Param | Type |
| --- | --- |
| tokenSecret | <code>String</code> | 
| metadata | <code>Object</code> | 

<a name="Authentication+isEnabled"></a>

### authentication.isEnabled : <code>Boolean</code>
Is authentication enabld

**Kind**: instance property of <code>[Authentication](#Authentication)</code>  
**Read only**: true  
<a name="Authentication+isFirstEnable"></a>

### authentication.isFirstEnable : <code>Boolean</code>
Is this the first time authentication has been enabled

**Kind**: instance property of <code>[Authentication](#Authentication)</code>  
**Read only**: true  
<a name="Authentication+collection"></a>

### authentication.collection : <code>Collection</code>
The collection used to store auth credentials

**Kind**: instance property of <code>[Authentication](#Authentication)</code>  
**Read only**: true  
<a name="Authentication+events"></a>

### authentication.events : <code>EventEmitter</code>
EventEmitter

**Kind**: instance property of <code>[Authentication](#Authentication)</code>  
**Read only**: true  
<a name="Authentication+user"></a>

### authentication.user : <code>Object</code>
The currently authenticated user

**Kind**: instance property of <code>[Authentication](#Authentication)</code>  
<a name="Authentication+setMeta"></a>

### authentication.setMeta(meta) ⇒ <code>[Authentication](#Authentication)</code>
Assign the metadata object

**Kind**: instance method of <code>[Authentication](#Authentication)</code>  

| Param | Type |
| --- | --- |
| meta | <code>any</code> | 

<a name="Authentication+invalidate"></a>

### authentication.invalidate() ⇒ <code>[Authentication](#Authentication)</code>
Invalidate the current user

**Kind**: instance method of <code>[Authentication](#Authentication)</code>  
<a name="Authentication+reset"></a>

### authentication.reset() ⇒ <code>[Authentication](#Authentication)</code>
Reset the metadata

**Kind**: instance method of <code>[Authentication](#Authentication)</code>  
<a name="Authentication+enable"></a>

### authentication.enable(coll) ⇒ <code>Promise</code>
Enable authentication and add the authentication collection.

Sets he `firstEnable` meta key if this is the first time authentication
has been enabled

Will emit `auth-enabled` once complete

**Kind**: instance method of <code>[Authentication](#Authentication)</code>  

| Param | Type |
| --- | --- |
| coll | <code>Collection</code> | 

<a name="Authentication+validateCredentials"></a>

### authentication.validateCredentials(creds) ⇒ <code>Promise</code>
Attempt to validate user credentials.

When successful, resolves with user document

**Kind**: instance method of <code>[Authentication](#Authentication)</code>  

| Param | Type |
| --- | --- |
| creds | <code>Object</code> | 

<a name="Authentication+createToken"></a>

### authentication.createToken(user) ⇒ <code>Promise</code>
Create a JWT token with the given user information.

Returned promise resolves with the token

**Kind**: instance method of <code>[Authentication](#Authentication)</code>  

| Param | Type |
| --- | --- |
| user | <code>Object</code> | 

<a name="Authentication+verifyToken"></a>

### authentication.verifyToken(token) ⇒ <code>Promise</code>
Verify a JWT token.

Returned promise resolves with the user document

**Kind**: instance method of <code>[Authentication](#Authentication)</code>  

| Param | Type |
| --- | --- |
| token | <code>String</code> | 

<a name="Authentication.normalizeUser"></a>

### Authentication.normalizeUser(userDoc) ⇒ <code>Object</code>
Normalize a user object such that a Mongoose document
becomes a plain object.

Also deletes the password property from the user

**Kind**: static method of <code>[Authentication](#Authentication)</code>  

| Param | Type |
| --- | --- |
| userDoc | <code>any</code> | 

