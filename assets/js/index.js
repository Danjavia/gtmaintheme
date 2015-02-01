( function ( $ ) {

	var myFirebaseRef = new Firebase( "https://ghostthemes.firebaseio.com/" )
	,	AppHandler = Gillie.Handler.extend({

			initialize: function () {

				this.urls();
				this.shortcuts();

				// Users auth
				UserApp.initialize({ appId: "54a2f03cb98a9" });

				// Lazy load images
			    aload();

			    // Polyfill for object-fit
			    objectFit.polyfill({
			        selector: 'img', // this can be any CSS selector
			        fittype: 'cover' // either contain, cover, fill or none
			    });

			    // Confirm purchase suscription
			    if ( this.checkPage( 'start' ) ) 
			    	this.confirmSuscribe();

			    if ( this.checkPage( 'profile' ) )
			    	this.profileEvents();

			    // Equalize items height
    			$( 'article.article' ).matchHeight();

    			// Price actions
				$( '.item-price' ).html( '$' + $( '.purchase' ).attr( 'data-price' ) + ' USD' );
				$( '.item-options' ).appendTo( '.download-data' );

				if ( $( '.free' ).length > 0 ) 
					myFirebaseRef.child( 'downloads/' + $( '.free' ).attr( 'data-name' ) + '/downloads' ).on( "value", function( snapshot ) {
					  	var value = snapshot.val()
					  	,	dwnsRef = myFirebaseRef.child( "downloads" )
					  	,	ref = $( '.free' ).attr( 'data-name' )
					  	,	dwn = $( '.free' ).attr( 'data-dwn' );

					  	if ( value != null ) 
					  		$( '.times' ).html( value + ' Times' )
					  			.attr( 'data-times', value );
					  		
					  	else 
					  		dwnsRef.child( ref ).update({
						  			downloads: 2
						  		,	dwnLink: dwn
						  		,	title: ref
						  		,	img: $( '.single-image' ).attr( 'src' )
						  		,	url: $( '.single-image' ).attr( 'data-absolute' )
							});
					  	
					});

				$( document ).on( 'unload', this.cleanMem() );

			}

	    ,   events: {
	            	'click .free': 'freeDownload'
	            ,	'click .live': 'livePreviewActions'

	            	// Modals
	            ,	'click [data-modal]': 'activeModal'
	            ,	'click .modal-close': 'closeModal'

	            	// User area
	            ,	'click .access': 'login'
	            ,	'click .logout': 'logout'
	            ,	'click .register': 'register'
	            ,	'click .gt-pay-btn': 'setPayment'
	            , 	'click .update': 'createUser'
	            ,	'click [data-dwnlink]' : 'getFile'
	        }

	        // Clean all params
	    ,	cleanMem: function () {

	    		var url = document.URL
	    		,	parts = url.split( '/' );

	    		if ( parts[ 3 ] != 'start' ) {

	    			delete localStorage.payLink
	    			delete localStorage.refererMail;
	    		}
	    	
	    	}

	        // Get specific parameter from url
		,	getURLParameter: function ( name ) {
			  	return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null
			}

			// Url managements
		,	urls: function () {
				if ( this.getURLParameter( 'src' ) ) {
					$( '.preview' ).attr( 'src', this.getURLParameter( 'src' ) );
					$( '.preview-purchase' ).attr( 'href', localStorage.payLink );
				}
			}

			// Download free items
		,	freeDownload: function ( e ) {
				e.preventDefault();

				var target = e.currentTarget
				,	ref = $( target ).attr( 'data-name' )
				,	dwnsRef = myFirebaseRef.child( "downloads" );

				// Update downloaded data from post
				dwnsRef.child( ref ).update({
			  		downloads: 1 + parseInt( $( '.times' ).attr( 'data-times' ) )
				});

				window.location = '/public/gt-virtual-items/themes/free/' + $( target ).attr( 'data-dwn' );
			}

			// Actions for preview page
		,	livePreviewActions: function ( e ) {
				localStorage.payLink = $( '.purchase' ).attr( 'href' );
			}

			// Modals
		,	activeModal: function ( e ) {

				e.preventDefault();

				var target = e.currentTarget
				,	modal = $( target ).attr( 'data-modal' );

				$( '.modal' ).removeClass( 'active' );
				$( modal ).addClass( 'active' );
			}

		,	closeModal: function ( e ) {

				e.preventDefault();

				$( '.modal' ).removeClass( 'active' );
			}

		,	shortcuts: function () {
				$( document ).keyup( function( e ) { 
				    if ( e.which == 27 ) { $( '.modal' ).removeClass( 'active' ); }  // esc   (does not work)
				    // if ( e.which == 13 ) { $( '.save' ).click(); }    // enter (works as expected)
				});
			}

			// Extras
		,	notify: function( message ) {

				$( '.notify' ).html( message );
			}

			// User area actions
		,	login: function ( e ) {

				e.preventDefault();

				var username = $( '.gt-username' ).val() //timothy
				,	password = $( '.gt-password' ).val() //"v3rYsecre7!"

				// Login user
				UserApp.User.login({ "login": username, "password": password }, function( error, result ) {
				    if ( error ) {

				    	console.log( 'err' )
				        // Something went wrong...
				        // Check error.name. Might just be a wrong password?
				    } else if ( result.locks && result.locks.length > 0 ) {
				    	console.log( 'locked' )
				        // This user is locked
				    } else {
				        // User is logged in, save result.token in a cookie called 'ua_session_token'
				    	console.log( 'cool' )
				        Cookies.set( 'ua_session_token', result.token );
				    }
				});

			}

			// Set payment method
		,	setPayment: function ( e ) {

				var target = e.currentTarget
				,	payUrl = $( target ).attr( 'href' );

				$( '.register' ).attr( 'data-link', payUrl );
			}

			// Create user
		,	register: function ( e ) {
				
				e.preventDefault();

				var target = e.currentTarget
				,	email = $( '.gt-email' ).val()
				,	payUrl = $( target ).attr( 'data-link' )

				if ( email.length > 5 ) {

					localStorage.refererMail = email; 
					
					window.location = payUrl;
				}

				else {

					// this.notify( 'Sorry, Check your mail' );
					console.log( 'Sorry, Check your mail' );
					return;
				}

			}

			// Confirm suscription
		,	confirmSuscribe: function () {

				var suscriptionType = this.getURLParameter( 'type' )
				,	suscriberEmail = localStorage.refererMail
				,	temporalPassword = md5( suscriberEmail );

				$( '.gt-email-suscribed' ).val( suscriberEmail );

				setTimeout( function () {

					$( '.user-registered' ).click();

					delete localStorage.payLink
    				delete localStorage.refererMail;

				}, 400 );

			}

			// Register a new user
		,	createUser: function ( e ) {
				
				e.preventDefault();

				var target = e.currentTarget
				,	email = $( '.gt-email-suscribed' ).val()
				,	password = $( '.gt-password-suscribed' ).val()
				,	temporalPassword = md5( email )
				,	suscriptionType = this.getURLParameter( 'type' );

				UserApp.User.save({
				    "email": email,
				    "login": email,
				    "password": temporalPassword,
				    // "properties": {
				    //     "age": {
				    //         "value": 24,
				    //         "override": true
				    //     }
				    // },
				    "subscription": {
				        "price_list_id": "X6nbOGwzRPynOfYGdCCjpw",
				        "plan_id": ( suscriptionType == 'e33f023eca35a4843e1a40d0527ba3e8' ) ? "dHKDKEhyRqebu7nAncfaaQ" : "Qii5--CgT-WZe4NtS-i8bw",
				        "override": false
				    }

				}, function( error, result ) {

					if ( error ) {

	    				window.location = '/';
	    				return;
					} else {

						window.location = '/profile';	
					}

				});

			}
			
			//logout
		,	logout: function ( e ) {

				e.preventDefault();

				UserApp.User.logout( function( error, result ) {
					// Clear cookie, redirect to login page, etc.
					Cookies.expire( 'ua_session_token' );

					if ( typeof ( Cookies.get( 'ua_session_token' ) ) == 'undefined' )
						console.log( 'logged out' );
				});
			}

			// get user data
		,	userData: function () {
				// Get user
				UserApp.User.get({ user_id: "self" }, function( error, user ) {
				    if ( error ) {
				        // User not logged in
				    } else {
				        // Success, the profile is at user[0]
				        console.log( user[ 0 ] );
				    }
				});
			}

			// Check if user is in session
		, 	checkUserSession: function () {

				var token = Cookies.get( "ua_session_token" );
				if ( token ) {
				    // Yes, there is
				    UserApp.setToken( token );

				    // Get the logged in user
				    UserApp.User.get({ user_id: "self" }, function( error, user ) {
				        if ( error ) {
				            // The token has probably expired, go to the login page
				            // window.location.href = "login.html";
				    		console.log( error );
				        } else {
				            // Success, the profile is at user[0]
				            console.log( user[ 0 ] );
				        }
				    });
				} else {
				    // No, redirect the user to the login page
				    // window.location.href = "login.html";
				    console.log( 'not token' );
				}
			}

			// Check the page
		,	checkPage: function ( page ) {
				var url = document.URL
	    		,	parts = url.split( '/' );

	    		return ( parts[ 3 ] == page ) ? true : false;
			}

			// Pages
		,	profileEvents: function () {

				myFirebaseRef.child( 'downloads/' ).on( "value", function( snapshot ) {
					
					var items = snapshot.val();

		            $.each( items, function ( k, v ) {

		            	var template = '<li data-url="' + v.url + '" class="uk-width-1-5 individual-item">'
		            			+ '<div class="item-content">'
				                    + '<img src="' + v.img + '" alt="">'
				                    + '<div class="fx-wrap">'
					                    + '<h2 class="item-title">' + v.title + '</h2>'
					                    + '<div class="btns">'
						                    + '<a href="' + v.url + '" class="ghost-btn ghost-btn-large ghost-btn-white view-item">View</a>'
						                    + '<a href="" data-dwnlink="' + v.dwnLink + '" class="ghost-btn ghost-btn-large ghost-btn-white dwn-item" download>Download</a>'
					                    + '</div>'
				                    + '</div>'
			                	+ '</div>'
			                + '</li>';

		            	$( '.gt-themes' ).append( template );
			            
		            });
					
				});

			}

			// Get file
		,	getFile: function ( e ) {

				e.preventDefault();

				var target = e.currentTarget
				,	link = $( target ).attr( 'data-dwnlink' )

				window.location = '/public/gt-virtual-items/themes/paid/' + link;
				return;
			}

	});

	// Create handler instance
	var appHandler = new AppHandler();

}) ( jQuery );

