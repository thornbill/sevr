<a name="Sevr"></a>

## Sevr
**Kind**: global class  

* [Sevr](#Sevr)
    * [new Sevr()](#new_Sevr_new)
    * _instance_
        * [.config](#Sevr+config)
        * [.types](#Sevr+types)
        * [.definitions](#Sevr+definitions)
        * [.factory](#Sevr+factory)
        * [.collections](#Sevr+collections)
        * [.connection](#Sevr+connection)
        * [.server](#Sevr+server)
        * [.logger](#Sevr+logger)
        * [.authentication](#Sevr+authentication)
        * [.events](#Sevr+events)
        * [.attach(plugin, config, namespace)](#Sevr+attach) ⇒ <code>[Sevr](#Sevr)</code>
        * [.connect()](#Sevr+connect) ⇒ <code>Promise</code>
        * [.start()](#Sevr+start) ⇒ <code>Promise</code>
        * [.ready()](#Sevr+ready) ⇒ <code>[Sevr](#Sevr)</code>
        * [.startServer()](#Sevr+startServer) ⇒ <code>Promise</code>
        * [.reset()](#Sevr+reset) ⇒ <code>Promise</code>
        * [._pluginsRun()](#Sevr+_pluginsRun) ⇒ <code>[Sevr](#Sevr)</code>
    * _static_
        * [.logger](#Sevr.logger)
        * [.Errors](#Sevr.Errors)
        * [.setLogger(logger)](#Sevr.setLogger)

<a name="new_Sevr_new"></a>

### new Sevr()
Sevr

Core Sevr library

<a name="Sevr+config"></a>

### sevr.config
The Sevr config object

**Kind**: instance property of <code>[Sevr](#Sevr)</code>  
**Read only**: true  
<a name="Sevr+types"></a>

### sevr.types
Ttype definitions

**Kind**: instance property of <code>[Sevr](#Sevr)</code>  
**Read only**: true  
<a name="Sevr+definitions"></a>

### sevr.definitions
Collection definitions

**Kind**: instance property of <code>[Sevr](#Sevr)</code>  
**Read only**: true  
<a name="Sevr+factory"></a>

### sevr.factory
Collection factory

**Kind**: instance property of <code>[Sevr](#Sevr)</code>  
**Read only**: true  
<a name="Sevr+collections"></a>

### sevr.collections
Loaded collection instances

**Kind**: instance property of <code>[Sevr](#Sevr)</code>  
**Read only**: true  
<a name="Sevr+connection"></a>

### sevr.connection
Database connection

**Kind**: instance property of <code>[Sevr](#Sevr)</code>  
**Read only**: true  
<a name="Sevr+server"></a>

### sevr.server
Express web server

**Kind**: instance property of <code>[Sevr](#Sevr)</code>  
**Read only**: true  
<a name="Sevr+logger"></a>

### sevr.logger
Sevr logger object

**Kind**: instance property of <code>[Sevr](#Sevr)</code>  
**Read only**: true  
<a name="Sevr+authentication"></a>

### sevr.authentication
Authentication instance

**Kind**: instance property of <code>[Sevr](#Sevr)</code>  
**Read only**: true  
<a name="Sevr+events"></a>

### sevr.events
Sevr event emitter

**Kind**: instance property of <code>[Sevr](#Sevr)</code>  
**Read only**: true  
<a name="Sevr+attach"></a>

### sevr.attach(plugin, config, namespace) ⇒ <code>[Sevr](#Sevr)</code>
Attach a plugin

**Kind**: instance method of <code>[Sevr](#Sevr)</code>  

| Param | Type | Description |
| --- | --- | --- |
| plugin | <code>function</code> | The plugin class or constructor function |
| config | <code>Object</code> | Configuration to be passed to the plugin |
| namespace | <code>String</code> | The plugin's namespace' |

**Example**  
```js
sevr.attach(PluginClass, {}, 'sevr.plugin')
```
<a name="Sevr+connect"></a>

### sevr.connect() ⇒ <code>Promise</code>
Connect to the MongoDB database

Returns a promise that resolves once the connection is open.
It also emits a `db-ready` event the connection is open

**Kind**: instance method of <code>[Sevr](#Sevr)</code>  
<a name="Sevr+start"></a>

### sevr.start() ⇒ <code>Promise</code>
Start the Sevr service and begin the lifecyle

Creates the collections and types, initializes authentication,
and executes plugin lifecycle methods.

Emits a `ready` event once the lifecycle is complete

**Kind**: instance method of <code>[Sevr](#Sevr)</code>  
<a name="Sevr+ready"></a>

### sevr.ready() ⇒ <code>[Sevr](#Sevr)</code>
Wait for the connection to be ready

Attacheds a callback function to the `ready` event

**Kind**: instance method of <code>[Sevr](#Sevr)</code>  
**Pram**: <code>Function</code> fn  
<a name="Sevr+startServer"></a>

### sevr.startServer() ⇒ <code>Promise</code>
Start the express web server

Returns a promise that resolves once the web server is
ready to accept connections.

**Kind**: instance method of <code>[Sevr](#Sevr)</code>  
<a name="Sevr+reset"></a>

### sevr.reset() ⇒ <code>Promise</code>
Trigger a reset

Emits the `reset` event, triggers an authentication reset,
and calls all plugin reset methods

**Kind**: instance method of <code>[Sevr](#Sevr)</code>  
<a name="Sevr+_pluginsRun"></a>

### sevr._pluginsRun() ⇒ <code>[Sevr](#Sevr)</code>
Execute the `run` lifecycle method for all plugins

**Kind**: instance method of <code>[Sevr](#Sevr)</code>  
<a name="Sevr.logger"></a>

### Sevr.logger
The Sevr logger object

**Kind**: static property of <code>[Sevr](#Sevr)</code>  
<a name="Sevr.Errors"></a>

### Sevr.Errors
Error classes

**Kind**: static property of <code>[Sevr](#Sevr)</code>  
<a name="Sevr.setLogger"></a>

### Sevr.setLogger(logger)
Set the logger object used by Sevr

object must implement the following methods:
- `verbose`
- `info`
- `warning`
- `error`
- `critical`

**Kind**: static method of <code>[Sevr](#Sevr)</code>  

| Param | Type |
| --- | --- |
| logger | <code>Object</code> | 

