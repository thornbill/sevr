/*eslint-env node, mocha */
'use strict'

const chai          = require('chai')
const spies         = require('chai-spies')
const QueryFactory  = require('../../query')

const expect = chai.expect

chai.use(spies)

class ModelMock {
	constructor() {}
	create() { return this }
	find() { return this }
	update() { return this }
	delete() { return this }
	exec() {
		return Promise.resolve([
			{ test: 'one' },
			{ test: 'two' }
		])
	}
	toConstructor() { return ModelMock }
}

describe('QueryFactory', function() {
	it('should return a new class that extends the model', function() {
		const model = new ModelMock()
		const ModelQuery = new QueryFactory(model)

		expect(new ModelQuery()).to.be.instanceof(ModelMock)
		expect(new ModelQuery()).to.be.instanceof(ModelQuery)
	})
})

describe('Query', function() {
	it('should call the appropriate model operation when running', function() {
		const model = new ModelMock()
		const ModelQuery = new QueryFactory(model)
		const createQuery = new ModelQuery('create')
		const readQuery = new ModelQuery('read')
		const updateQuery = new ModelQuery('update')
		const deleteQuery = new ModelQuery('delete')

		chai.spy.on(createQuery, 'create')
		chai.spy.on(readQuery, 'find')
		chai.spy.on(updateQuery, 'update')
		chai.spy.on(deleteQuery, 'delete')

		const promises = []

		promises.push(createQuery.runWith())
		promises.push(readQuery.runWith())
		promises.push(updateQuery.runWith())
		promises.push(deleteQuery.runWith())

		return Promise.all(promises)
			.then(() => {
				expect(createQuery.create).to.have.been.called()
				expect(readQuery.find).to.have.been.called()
				expect(updateQuery.update).to.have.been.called()
				expect(deleteQuery.delete).to.have.been.called()
			})
	})

	it('should apply the "before" middleware when running', function() {
		const spy1 = chai.spy()
		const spy2 = chai.spy()
		const ModelQuery = new QueryFactory(new ModelMock())
		const query = new ModelQuery('read')

		query.useBefore(spy1)
		query.useBefore(spy2)

		return query.runWith()
			.then(() => {
				expect(spy1).to.have.been.called.exactly(1)
				expect(spy2).to.have.been.called.exactly(1)
			})
	})

	it('should pass all arguments to each "before" middleware function', function() {
		const spy1 = chai.spy((...args) => { return args })
		const spy2 = chai.spy((...args) => { return args })
		const ModelQuery = new QueryFactory(new ModelMock())
		const query = new ModelQuery('read')

		query.useBefore(spy1)
		query.useBefore(spy2)

		return query.runWith('test')
			.then(() => {
				expect(spy1).to.have.been.called.with('test')
				expect(spy2).to.have.been.called.with('test')
			})
	})

	it('should resolve with a query when running', function() {
		const ModelQuery = new QueryFactory(new ModelMock())
		const query = new ModelQuery('read')

		return query.runWith()
			.then(query => {
				expect(query).to.be.instanceof(ModelQuery)
			})
	})

	it('should apply the "after" middleware after exec', function() {
		const spy1 = chai.spy()
		const spy2 = chai.spy()
		const ModelQuery = new QueryFactory(new ModelMock())
		const query = new ModelQuery('read')

		query.useAfter(spy1)
		query.useAfter(spy2)

		return query.exec()
			.then(() => {
				expect(spy1).to.have.been.called.exactly(1)
				expect(spy2).to.have.been.called.exactly(1)
			})
	})

	it('should pass the resulting documents to each "after" middleware function', function() {
		const spy1 = chai.spy(docs => { return docs })
		const spy2 = chai.spy(docs => { return docs })
		const ModelQuery = new QueryFactory(new ModelMock())
		const query = new ModelQuery('read')

		query.useAfter(spy1)
		query.useAfter(spy2)

		return query.exec()
			.then(() => {
				expect(spy1).to.have.been.called.with([
					{ test: 'one' },
					{ test: 'two' }
				])
				expect(spy2).to.have.been.called.with([
					{ test: 'one' },
					{ test: 'two' }
				])
			})
	})
})
