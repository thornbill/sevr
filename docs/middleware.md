# Middleware

The Sevr Framework offers before and after middleware for database queries on the
operation level. Meaning middlware functions can be defined separately for
create, read, update, and delete operations. Each middleware function is
executed asynchronously and in sequence using Promises.

## Before middleware

Before middleware is executed prior to the database query being passed to the
database. This allows the implementation to manipulate or stop the query
before it happens. Each middleware function is passed the current query object.
The function must either return the query object, return a Promise that
resolves with the query object, or throw an error.

If a function in the middleware chain does not return or resolve with the query
object, any subsequent middleware function will not have access to it. The
middleware chain is broken as soon as an error is encountered.

**Example**

```javascript
collection.useBefore('read', query => {
	sevr.logger.info(`executing ${JSON.stringify(query.getQuery())}`)
	return query
})
```

## After Middleware

After middleware is executed once a response has been received from the
database. These functions are passed the resulting documents, and can be used
to manipulate the documents before being passed back to the application.

Like the before middleware, after middleware will need to either return the
documents or a Promise that resolves the documents in order to maintain the
middleware chain.

**Example**

```javascript
collection.useAfter('read', documents => {
	sevr.logger.info(`received ${documents.length} documents`)
	return documents
})
```