/**
 * @author mrdoob / http://mrdoob.com/
 */

var Storage = function ( editor ) {

    this.state = null;
    this.size = "0 B";
	let iDb = null;
	const dbName = 'arcadestudio';
	const stateStore = 'state';
	const version = 1;

	const getJson = function() {
		return editor.toJSON();
	};

	const getStateStore = function() {
		const transaction = iDb.transaction([stateStore], "readwrite");
		return transaction.objectStore(stateStore);
	}

	return {
		initIndexedDB: function () {	
			const indexedDb = window.indexedDB|| window.webkitIndexedDB|| window.mozIndexedDB || window.msIndexedDB;

			const request = indexedDb.open(dbName, version);
			request.onerror = function (event) {
				console.warn(`Database open exception ${dbName}`);
				console.error(event);
			};

			request.onsuccess = function (event) {
				iDb = event.target.result;

				// Error handler for all errors for this database's requests
				iDb.onerror = (event) => {
					console.error(`Database error: ${event.target.errorCode}`);
				};
			};

			request.onupgradeneeded = function (event) {
				iDb = event.target.result;
				
				let objectStore;
				if (!iDb.objectStoreNames.contains(stateStore)) {
					objectStore = iDb.createObjectStore(stateStore, { autoIncrement: true });
				} else console.log(`"${stateStore}" table found`);
			}

		},

		saveToIndexedDb: function name(pId, callback) {
			const editorJson = getJson();
			const stateObjStore = getStateStore();
			const getRequest = stateObjStore.get(pId);
			getRequest.onsuccess = () => {
				let request;
				if(getRequest.result)
					request = stateObjStore.put({ createdAt: new Date(), scene: editorJson}, pId);
				else
					request = stateObjStore.add({ createdAt: new Date(), scene: editorJson}, pId);

				request.onsuccess = (event) => {
					callback();
				};
			};
		},

		load: function ( url, onProgress, loadFromDB = false, pId = 0 ) {

			var scope = this;
			if(loadFromDB){
				return new Promise( function ( resolve, reject) {
					setTimeout(() => {
						const stateObjStore = getStateStore();
						const getRequest = stateObjStore.get(pId);
						getRequest.onsuccess = () => {
							if(getRequest.result){
								scope.state = getRequest.result.scene;
								resolve();
							}
							else {
								editor.api.load( url, onProgress, function ( size ) {

									scope.size = size;
				
								} ).then( json => {
				
									scope.state = json;
									resolve();
				
								} ).catch( err => {
				
									resolve();
				
								} );
							}
						};
						getRequest.onerror = () => {
							resolve();
						}
					}, 800);
				} );
			}

			return new Promise( function ( resolve, reject) {

				editor.api.load( url, onProgress, function ( size ) {

					scope.size = size;

				} ).then( json => {

					scope.state = json;
					resolve();

				} ).catch( err => {

					resolve();

				} );

			} );

        },

		save: function (pId, callback) {
			const stateObjStore = getStateStore();
			const getRequest = stateObjStore.get(pId);
			getRequest.onsuccess = () => {
			  let state = null;
			  if(getRequest.result){
				state = getRequest.result.scene;
			  } else
			  	state = getJson();

			  editor.api.save( '/asset/project/state', { id: editor.projectId, state } ).then( function () {

			} );

			  if(callback)
				callback();
			};

			getRequest.onerror = () => {
				if(callback)
					callback();
			}
		},

		getJson
	};

};

export { Storage };
