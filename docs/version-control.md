# Document Versioning

By default collections in Sevr are version controlled. Meaning whenever a
change is made to a document, a new version is stored. More specifically, the
differences between the previous version and new version are stored in a
separate collection.

Each document, which has document versioning enabled, offers an interface for
accessing its version data. Allowing the ability to fetch an array of versions,
create new versions, and restore old versions. The following methods are
available for all enabled documents:

### getVersions ⇒ `[Version]`
Returns an array of versions in chronological order where the first element
is the latest version.

### getLatestVersion ⇒ `Version`
Returns the latest version for the document.

### getDiffs ⇒ `[Diff]`
Returns an array of diffs in chronological order where the first element is the
latest diff.

### getLatestDiff ⇒ `Diff`
Returns the latest diff for the document.

### saveVersion ⇒ `Version`
Saves a new version of the document. If the new document does not differ from
the previous version, a new version will not be saved.

| Param | Type |
| --- | --- |
| doc | `Document` |

### restoreVersion ⇒ `Version`
Restores the document to a previous version state. This operation will make
a copy of the old version and append it to the history rather than rolling
back any subsequent changes.

| Param | Type |
| --- | --- |
| versionId | `ObjectId|String` |

---

## Diff
A diff is an individual document within the versions collection. It has the
following properties:

### documentId : `ObjectId`
The id of the document under version control.

### changes : `Array`
An array of changes to the document under version control.

### hash : `String`
A SHA1 hash of the document under version control at the time the version was
craeted.

### meta : `Object`
An object containing other information about the version.

---

## Version
Here Version refers to the object returned by `getVersions` and
`getLatestVersion`. It has two properties:

### version : `Diff`
The diff associated with the document version

### doc : `Document`
The document object as constructed by applying all version diffs up to and
including this version.

