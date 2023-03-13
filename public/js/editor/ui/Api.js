/**
 * @author codelegend620
 */

var Api = function ( editor ) {

	return {

		load: function ( url, onProgress, onSize ) {
			//console.log(url);
			//var url1 = 'https://arcadestudio-app.s3.us-east-2.amazonaws.com/projects/254/1108/state.json?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAVXUY7NPCJHAMVIFO%2F20211023%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Date=20211023T072420Z&X-Amz-Expires=86400&X-Amz-Signature=8acec71a541f35348294acf407a6fe33eb5c79ec070fd7bb6efa78021ee8b1bb&X-Amz-SignedHeaders=host'
			//var url1 = 'https://arcadestudio-app.s3.us-east-2.amazonaws.com/projects/254/1108/state.json?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAVXUY7NPCJHAMVIFO%2F20211023%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Date=20211023T075433Z&X-Amz-Expires=86400&X-Amz-Signature=f694b1dcfb20a4d00b2d2fee6ab81d8b9dce84646b0cf2d54f6104b871558aec&X-Amz-SignedHeaders=host'
			//if(url.split("254/1108").length > 1){
			//	url = 'https://arcadestudio-app.s3.us-east-2.amazonaws.com/publishes/pongbaby/state.json?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAVXUY7NPCJHAMVIFO%2F20211023%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Date=20211023T072023Z&X-Amz-Expires=86400&X-Amz-Signature=1dc3aaf7c56ddd1e4c34ff78009b1cb883a2088a3de867ebcd21cdf477fc7dc0&X-Amz-SignedHeaders=host';
			//}
			return fetch( url ).then( function ( response ) {

				if ( !response.ok ) throw Error( response.status + ' ' + response.statusText );

				if ( !response.body ) throw Error( 'ReadableStream not yet supported in this browser.' );

				const contentLength = response.headers.get('content-length');

				if ( !contentLength ) throw Error('Content-Length response header unavailable');

				// parse the integer into a base-10 number
				const total = parseInt(contentLength, 10);

				if ( onSize ) onSize( total );

				return new Response(

					new ReadableStream( {

						start( controller ) {

							const reader = response.body.getReader();

							read();

							function read() {

								reader.read().then( ( { done, value } ) => {

									if ( done ) {

										controller.close();
										return;

									}

									if ( onProgress ) onProgress( value.byteLength / total );
									controller.enqueue(value);
									read();

								} ).catch( error => {

									console.error( error );
									controller.error( error );

								} );
							}
						}

					})

				);

			} ).then( response => response.json() );

		},

		save: function ( url, json ) {

            return this.post( url, json );

        },

        get: function ( url ) {

            return fetch( url ).then( ( response ) =>  response.json() );

        },

        post: function ( url, body ) {

			const params = {
				method: 'POST'
			};

			if ( body instanceof FormData ) {

				params[ 'body' ] = body;

			} else {

				params[ 'headers' ] = { 'Content-Type': 'application/json' };
				params[ 'body' ] = JSON.stringify( body );

			}

            return fetch( url, params ).then( ( response ) => response.json() );

        },

	};

};

export { Api };
