/**
 * WordPress Admin Switcher Content Script
 */

 window.WPAdminSwitcher = {};
( function( window, document, chrome, that ) {

	/**
	 * Listen for keyboard shortcut.
	 *
	 * @param object event Keydown event.
	 */
	that.keyboardShortcutListener = function( event ) {
		if ( that.userEnteredKeyboardShortcut( event ) ) {
			that.toggleAdmin();
		}
	};

	/**
	 * Did the user enter the keyboard shortcut (cmd/ctrl + shift + A)?
	 *
	 * @param  object event Keydown event.
	 * @return bool         Whether the keyboard shortcut was entered.
	 */
	that.userEnteredKeyboardShortcut = function( event ) {
		return ( event.metaKey || event.ctrlKey ) && event.shiftKey && 65 == event.which;
	};

	/**
	 * Listen for extension icon click.
	 *
	 * @param bool iconClicked Whether the icon was clicked.
	 */
	that.iconClickListener = function( iconClicked ) {
		if ( iconClicked ) {
			that.toggleAdmin();
		}
	};

	/**
	 * Switch to/from the WordPress Admin.
	 */
	that.toggleAdmin = function() {
		if ( that.isWordPressAdmin( window.location.pathname ) ) {
			that.switchToFrontEnd();
		} else {
			that.switchToAdmin();
		}
	};

	/**
	 * Is this the WordPress admin?
	 *
	 * @param  string url The URL to check.
	 * @return bool       Whether currently in the WordPress admin.
	 */
	that.isWordPressAdmin = function( url ) {
		return ( url.indexOf( '/wp-admin/' ) > -1 ) || ( url.indexOf( '/wp-login.php' ) > -1 );
	};

	/**
	 * Switch to the front end.
	 */
	that.switchToFrontEnd = function() {
		that.changeWindowLocation( that.getFrontEndUrl() );
	};

	/**
	 * Switch to the WP admin.
	 */
	that.switchToAdmin = function() {
		that.changeWindowLocation( that.getAdminUrl() );
	};

	/**
	 * Get frontend URL.
	 *
	 * @return string The frontend URL.
	 */
	that.getFrontEndUrl = function() {

		var url = that.getFrontEndUrlFromAdminBar();

		if ( url ) {
			return url;
		}

		url = that.getFrontEndUrlFromWindowLocation();

		if ( url ) {
			return url;
		}

		// Return this as a last resort. Has the potential to
		// be incorrect on subdirectory multisite installs.
		return window.location.origin;
	};

	/**
	 * Get front end URL from admin bar.
	 *
	 * Try to get the link to view/preview the post first,
	 * then fallback to getting the main front end url.
	 *
	 * @return string|bool The url or false on failure.
	 */
	that.getFrontEndUrlFromAdminBar = function() {

		var url         = false,
			adminBarIds = {
			view: '#wp-admin-bar-view',
			preview: '#wp-admin-bar-preview',
			siteName: '#wp-admin-bar-site-name'
		};

		for ( var key in adminBarIds ) {

			url = that.getUrlFromAdminBar( adminBarIds[ key ] );

			if ( url ) {
				return url;
			}
		}

		return false;
	};

	/**
	 * Get front end URL from window.location
	 *
	 * @return string|bool The url or false on failure.
	 */
	that.getFrontEndUrlFromWindowLocation = function() {

		var wpAdminPosition = window.location.href.indexOf( '/wp-admin/' );

		if ( wpAdminPosition > -1 ) {
			return window.location.href.substring( 0, wpAdminPosition );
		}

		var wpLoginPosition = window.location.href.indexOf( '/wp-login.php' );

		if ( wpLoginPosition > -1 ) {
			return window.location.href.substring( 0, wpLoginPosition );
		}

		return false;
	};

	/**
	 * Get the WP admin URL.
	 *
	 * @return string The admin URL.
	 */
	that.getAdminUrl = function() {

		var adminUrl = that.getUrlFromAdminBar( '#wp-admin-bar-edit' );

		if ( adminUrl ) {
			return adminUrl;
		}

		var url = that.inferUrlFromPageLinks();

		if ( url ) {
			return that.trailingSlashIt( url ) + 'wp-admin/';
		}

		// Return this as a last resort. Has the potential to
		// be incorrect on subdirectory multisite installs.
		return that.trailingSlashIt( window.location.origin ) + 'wp-admin/';
	};

	/**
	 * Get URL from the WP admin bar.
	 *
	 * @param  string      id The element ID to use as the selector.
	 * @return string|bool    The URL or false on failure.
	 */
	that.getUrlFromAdminBar = function ( id ) {

		var adminBarAnchorTag = document.querySelectorAll( id + ' > a.ab-item[href]' );

		if ( adminBarAnchorTag.length > 0 ) {
			return adminBarAnchorTag[0].getAttribute( 'href' );
		}

		return false;
	};

	/**
	 * Infer the site's URL from links in the page source.
	 *
	 * We can't simply get the site's URL from window.location
	 * because subdomain multisite installs need to have the
	 * /site-name/ part of the pathname preserved.
	 *
	 * @return string|bool The URL or false on failure.
	 */
	that.inferUrlFromPageLinks = function() {

		var selectors = {
			stylesheets: 'link[rel="stylesheet"][href]',
			scripts: 'script[src]',
			rss: 'link[type="application/rss+xml"][href]',
			xmlrpc: 'link[rel="pingback"][href]'
		};

		for ( var selectorIndex in selectors ) {

			var elements = document.querySelectorAll( selectors[ selectorIndex ] ),
				url      = false;

			if ( elements.length > 0 ) {
				for ( var elementIndex in elements ) {

					switch ( selectors[ selectorIndex ] ) {
						case 'stylesheets':
						case 'rss':
						case 'xmlrpc':
							url = that.getUrlSubstringFromHtmlElement( elements[ elementIndex ], 'href', '/wp-content/' );

							if ( url ) {
								return url;
							}

							url = that.getUrlSubstringFromHtmlElement( elements[ elementIndex ], 'href', '/wp-includes/' );

							if ( url ) {
								return url;
							}

							break;
						case 'scripts':
							url = that.getUrlSubstringFromHtmlElement( elements[ elementIndex ], 'src', '/wp-content/' );

							if ( url ) {
								return url;
							}

							url = that.getUrlSubstringFromHtmlElement( elements[ elementIndex ], 'src', '/wp-includes/' );

							if ( url ) {
								return url;
							}
					}
				}
			}
		}

		return false;
	};

	/**
	 * Extract part of a URL from an HTML element.
	 *
	 * @param  object      element   The HTML element.
	 * @param  string      attribute The attribute to get URL from ('href' or 'src').
	 * @param  string      string    The text to search for and exclude, along with
	 *                               everything after it.
	 * @return string|bool           The part of the URL or false on failure.
	 */
	that.getUrlSubstringFromHtmlElement = function( element, attribute, string ) {

		var stringPosition = element[ attribute ].indexOf( string );

		// If the element's url contains the string to look for, return everything before that.
		if ( stringPosition > -1 ) {
			return element[ attribute ].substring( 0, stringPosition );
		}

		return false;
	};

	/**
	 * Receive message from background script.
	 *
	 * @param object request The request (message).
	 */
	that.receiveMessageFromBackgroundScript = function( request ) {
		if ( request.hasOwnProperty( 'iconClicked' ) ) {
			that.iconClickListener( request.iconClicked );
		}
	};

	/**
	 * Add a trailing slash to a URL if it doesn't already have one.
	 *
	 * @param  string url The URL.
	 * @return string url The URL with a trailing slash.
	 */
	that.trailingSlashIt = function( url ) {

		if ( ! url.endsWith( '/' ) ) {
			url += '/';
		}

		return url;
	};

	/**
	 * Change the window location.
	 *
	 * @param string url The URL to set as the new location.
	 */
	that.changeWindowLocation = function( url ) {
		window.location = url;
	};

	/**
	 * Bind event listeners.
	 */
	that.bindEvents = function() {
		document.addEventListener( 'keydown', that.keyboardShortcutListener, false );
		chrome.runtime.onMessage.addListener( that.receiveMessageFromBackgroundScript );
	};

	that.bindEvents();

})( window, window.document, window.chrome, window.WPAdminSwitcher );