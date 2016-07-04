/**
 * WordPress Admin Switcher Content Script
 */

 window.WPAdminSwitcher = {};
( function( window, document, chrome, that ) {

	/**
	 * Receive message from background script.
	 *
	 * @param {Object} request The request (message).
	 */
	that.receiveMessageFromBackgroundScript = function( request ) {
		if ( request.hasOwnProperty( 'keyboardShortcutEntered' ) ) {
			that.keyboardShortcutListener( request.keyboardShortcutEntered );
		} else if ( request.hasOwnProperty( 'iconClicked' ) ) {
			that.iconClickListener( request.iconClicked );
		}
	};

	/**
	 * Listen for keyboard shortcut.
	 *
	 * @param {boolean} keyboardShortcutEntered Whether the keyboard shortcut was entered.
	 */
	that.keyboardShortcutListener = function( keyboardShortcutEntered ) {
		if ( keyboardShortcutEntered ) {
			that.toggleAdmin();
		}
	};

	/**
	 * Listen for extension icon click.
	 *
	 * @param {boolean} iconClicked Whether the icon was clicked.
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
	 * @param  {string} url    The URL to check.
	 * @return {boolean}       Whether currently in the WordPress admin.
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
	 * @return {string} The frontend URL.
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
	 * @return {string|boolean} The url or false on failure.
	 */
	that.getFrontEndUrlFromAdminBar = function() {

		var adminBarIds = {
			view: '#wp-admin-bar-view',
			preview: '#wp-admin-bar-preview',
			siteName: '#wp-admin-bar-site-name'
		};

		return that.getUrlFromAdminBar( adminBarIds );
	};

	/**
	 * Get front end URL from window.location.
	 *
	 * @return {string|boolean} The url or false on failure.
	 */
	that.getFrontEndUrlFromWindowLocation = function() {

		var adminUrlParts = {
			wpAdmin: '/wp-admin/',
			wpLogin: '/wp-login.php'
		};

		for ( var index in adminUrlParts ) {

			var adminUrlPartPosition = that.getPositionOfStringInCurrentUrl( adminUrlParts[ index ] );

			if ( that.doesUrlContainString( adminUrlPartPosition ) ) {
				return that.getPartOfUrlBeforePosition( adminUrlPartPosition );
			}
		}

		return false;
	};

	/**
	 * Get the position of a string in the current URL.
	 *
	 * @param  {string} string The string to find within the URL.
	 * @return {number}        The position of string within the URL.
	 */
	that.getPositionOfStringInCurrentUrl = function( string ) {
		return window.location.href.indexOf( string );
	};

	/**
	 * Does the URL contain a string?
	 *
	 * @param  {number}  stringPosition The position of string within the URL.
	 * @return {boolean}                Whether the URL contains the string.
	 */
	that.doesUrlContainString = function( stringPosition ) {
		return that.doesStringContainSubstring( stringPosition );
	};

	/**
	 * Does string contain a substring?
	 *
	 * @param  {number} stringPosition The position of substring within the string.
	 * @return {boolean}               Whether the substring was found within the string.
	 */
	that.doesStringContainSubstring = function( stringPosition ) {
		return stringPosition > -1;
	};

	/**
	 * Get part of URL before the provided position.
	 *
	 * @param  {number} stringPosition Exclude the character at this position and following.
	 * @return {string}                The part of the URL before stringPosition.
	 */
	that.getPartOfUrlBeforePosition = function( stringPosition ) {
		return window.location.href.substring( 0, stringPosition );
	};

	/**
	 * Get the admin URL.
	 *
	 * @return {string} The admin URL.
	 */
	that.getAdminUrl = function() {

		var url = that.getAdminUrlFromAdminBar();

		if ( url ) {
			return url;
		}

		url = that.getAdminUrlFromPageSource();

		if ( url ) {
			return url;
		}

		// Return this as a last resort. Has the potential to
		// be incorrect on subdirectory multisite installs.
		return that.trailingSlashIt( window.location.origin ) + 'wp-admin/';
	};

	/**
	 * Get admin URL from page source.
	 *
	 * @return {string|boolean} The admin URL or false on failure.
	 */
	that.getAdminUrlFromPageSource = function() {

		var url    = that.inferUrlFromPageLinks(),
			postId = that.inferPostIdFromPageSource();

		if ( url ) {

			var adminUrl = that.getAdminUrlFromSiteUrl( url );

			if ( postId ) {
				adminUrl = that.getPostSpecificAdminUrl( adminUrl, postId );
			}

			return adminUrl;
		}

		return false;
	};

	/**
	 * Turn site URL into admin URL.
	 *
	 * @param  {string} url The site URL.
	 * @return {string}     The admin URL.
	 */
	that.getAdminUrlFromSiteUrl = function( url ) {
		return that.trailingSlashIt( url ) + 'wp-admin/';
	};

	/**
	 * Turn base admin URL into a post-specific admin URL.
	 *
	 * @param  {string} adminUrl The base admin URL.
	 * @param  {string} postId   The post ID.
	 * @return {string}          The post-specific admin URL.
	 */
	that.getPostSpecificAdminUrl = function( adminUrl, postId ) {
		return adminUrl + 'post.php?post=' + postId + '&action=edit';
	};

	/**
	 * Get WP admin URL from the admin bar.
	 *
	 * @return {string|boolean} The URL or false on failure.
	 */
	that.getAdminUrlFromAdminBar = function() {

		var adminBarIds = {
			edit: '#wp-admin-bar-edit',
			siteName: '#wp-admin-bar-site-name'
		};

		return that.getUrlFromAdminBar( adminBarIds );
	};

	/**
	 * Get URL from the WP admin bar.
	 *
	 * @param  {Object}         adminBarIds The element IDs to use as selectors.
	 * @return {string|boolean}             The URL or false on failure.
	 */
	that.getUrlFromAdminBar = function ( adminBarIds ) {

		if ( that.isEmptyObject( adminBarIds ) ) {
			return false;
		}

		for ( var key in adminBarIds ) {

			var adminBarAnchorHtmlElement = that.getAdminBarAnchorHtmlElement( adminBarIds[ key ] );

			if ( that.wereHtmlElementsFound( adminBarAnchorHtmlElement ) ) {
				return that.getHrefUrlFromHtmlElement( adminBarAnchorHtmlElement );
			}
		}

		return false;
	};

	/**
	 * Is this an empty object?
	 *
	 * @param  {Object} object The object to check.
	 * @return {boolean}       Whether the object is empty.
	 */
	that.isEmptyObject = function( object ) {
		return ( Object != object.constructor ) || ( Object.keys( object ).length < 1 );
	};

	/**
	 * Get admin bar anchor HTML element.
	 *
	 * @param  {string} adminBarId The id of the HTML element to get. 
	 * @return {Object}            The matching HTML element NodeList.
	 */
	that.getAdminBarAnchorHtmlElement = function( adminBarId ) {
		return document.querySelectorAll( adminBarId + ' > a.ab-item[href]' );
	};

	/**
	 * Here any HTML elements found?
	 *
	 * @param  {Object}  nodelist The NodeList of HTML elements found.
	 * @return {boolean}          Whether HTML elements were found.
	 */
	that.wereHtmlElementsFound = function( nodelist ) {
		return nodelist.length > 0;
	};

	/**
	 * Get the URL from an HTML element's href property.
	 *
	 * @param  {Object} element The HTML element NodeList.
	 * @return {string}         The URL.
	 */
	that.getHrefUrlFromHtmlElement = function( element ) {
		return element[0].getAttribute( 'href' );
	};

	/**
	 * Infer the site's URL from links in the page source.
	 *
	 * We can't simply get the site's URL from window.location
	 * because subdomain multisite installs need to have the
	 * /site-name/ part of the pathname preserved.
	 *
	 * @return {string|boolean} The URL or false on failure.
	 */
	that.inferUrlFromPageLinks = function() {

		var selectors = {
			stylesheets: 'link[rel="stylesheet"][href]',
			scripts: 'script[src]',
			rss: 'link[type="application/rss+xml"][href]',
			xmlrpc: 'link[rel="pingback"][href]'
		};

		for ( var selectorIndex in selectors ) {

			var elements = document.querySelectorAll( selectors[ selectorIndex ] );

			if ( that.wereHtmlElementsFound( elements ) ) {

				for ( var elementIndex in elements ) {

					var attribute = that.getAttributeForSelector( selectorIndex ),
						url       = that.inferUrlFromPageLink( elements[ elementIndex ], attribute );

					if ( url ) {
						return url;
					}
				}
			}
		}

		return false;
	};

	/**
	 * Extract the URL from an HTML element.
	 *
	 * @param  {Object}         element   The HTML element
	 * @param  {string}         attribute The attribute to get the URL from: 'href' or 'src'.
	 * @return {string|boolean}           The URL or false on failure.
	 */
	that.inferUrlFromPageLink = function( element, attribute ) {

		var paths = {
			wpContent: '/wp-content/',
			wpIncludes: '/wp-includes/'
		};

		for ( var index in paths ) {

			var url = that.getUrlSubstringFromHtmlElement( element, attribute, paths[ index ] );

			if ( url ) {
				return url;
			}
		}

		return false;
	};

	/**
	 * Get the URL-containing attribute for a selector type.
	 *
	 * @param  {string} selector The selector type.
	 * @return {string}          The attribute for contains the URL.
	 */
	that.getAttributeForSelector = function( selector ) {

		switch ( selector ) {
			case 'scripts':
				return 'src';
			default:
				return 'href';
		}
	};

	/**
	 * Extract part of a URL from an HTML element.
	 *
	 * @param  {Object}         element   The HTML element.
	 * @param  {string}         attribute The attribute to get URL from ('href' or 'src').
	 * @param  {string}         string    The text to search for and exclude, along with
	 *                                    everything after it.
	 * @return {string|boolean}           The part of the URL or false on failure.
	 */
	that.getUrlSubstringFromHtmlElement = function( element, attribute, string ) {

		var stringPosition = element[ attribute ].indexOf( string );

		if ( that.doesUrlContainString( stringPosition ) ) {
			return element[ attribute ].substring( 0, stringPosition );
		}

		return false;
	};

	/**
	 * Infer post ID from the page source.
	 *
	 * Not all WordPress sites will have this exposed.
	 *
	 * @return {string|boolean} The post ID or false on failure.
	 */
	that.inferPostIdFromPageSource = function() {

		var postId = false,
			postIdSelectors = {
			commentsForm: '#comment_post_ID[value]',
			shortlink: 'link[rel="shortlink"][href]',
			body: 'body[class]'

		};

		for ( var index in postIdSelectors ) {

			var postIdElement = document.querySelectorAll( postIdSelectors[ index ] );

			if ( ! that.wereHtmlElementsFound( postIdElement ) ) {
				continue;
			}

			switch ( index ) {
				case 'commentsForm':
					postId = that.getPostIdFromCommentsForm( postIdElement );
					break;
				case 'shortlink':
					postId = that.getPostIdFromShortlink( postIdElement );
					break;
				case 'body':
					postId = that.getPostIdFromBodyClass( postIdElement );
			}
		}

		return postId;
	};

	/**
	 * Get post ID from comments form.
	 *
	 * @param  {Object} postIdElement The HTML element NodeList containing the post ID.
	 * @return {string}               The post ID.
	 */
	that.getPostIdFromCommentsForm = function( postIdElement ) {
		return postIdElement[0].value;
	};

	/**
	 * Get post ID from shortlink.
	 *
	 * @param  {Object}         postIdElement The HTML element NodeList containing the post ID.
	 * @return {string|boolean}               The post ID or false on failure.
	 */
	that.getPostIdFromShortlink = function( postIdElement ) {

		var shortlinkUrl = that.getHrefUrlFromHtmlElement( postIdElement );

		if ( ! that.isShortlinkUsingWpMeService( shortlinkUrl ) ) {

			var positionOfUrlTextBeforePostId = that.getPositionOfUrlTextBeforePostId( shortlinkUrl );

			if ( that.doesShortlinkUrlContainPostId( positionOfUrlTextBeforePostId ) ) {
				return that.getPostIdFromShortlinkUrl( shortlinkUrl, positionOfUrlTextBeforePostId );
			}
		}

		return false;
	};

	/**
	 * Is shortlink using wp.me service?
	 *
	 * @param  {string}  shortlinkUrl The shortlink URL.
	 * @return {boolean}              Whether shorlinkUrl is using wp.me.
	 */
	that.isShortlinkUsingWpMeService = function( shortlinkUrl ) {
		return shortlinkUrl.indexOf( '//wp.me/' ) > -1;
	};

	/**
	 * Get the position of the URL before the post ID.
	 *
	 * @param  {string} shortlinkUrl The URL to search.
	 * @return {number}              The position of the post ID.
	 */
	that.getPositionOfUrlTextBeforePostId = function( shortlinkUrl ) {
		return shortlinkUrl.indexOf( '/?p=' );
	};

	/**
	 * Does the shortlink URL contain the post ID?
	 *
	 * @param  {number}  positionOfUrlTextBeforePostId The position of the URL text before the post ID.
	 * @return {boolean}                               Whether the URL contains the post ID.
	 */
	that.doesShortlinkUrlContainPostId = function( positionOfUrlTextBeforePostId ) {
		return that.doesStringContainSubstring( positionOfUrlTextBeforePostId );
	};

	/**
	 * Extract the post ID from the shortlink URL.
	 *
	 * @param  {string} shortlinkUrl                  The shortlink URL.
	 * @param  {number} positionOfUrlTextBeforePostId The position of URL text before the post ID.
	 * @return {string}                               The post ID.
	 */
	that.getPostIdFromShortlinkUrl = function( shortlinkUrl, positionOfUrlTextBeforePostId ) {
		return shortlinkUrl.substring( positionOfUrlTextBeforePostId + 4, shortlinkUrl.length );
	};

	/**
	 * Get post ID from body class.
	 *
	 * @param  {Object}         postIdElement The HTML element NodeList containing the post ID.
	 * @return {string|boolean}               The post ID or false on failure.
	 */
	that.getPostIdFromBodyClass = function( postIdElement ) {

		var bodyClasses    = postIdElement[0].getAttribute( 'class' ),
			postIdPosition = bodyClasses.indexOf( 'postid-' );

		if ( that.doesStringContainSubstring( postIdPosition ) ) {
			bodyClasses = bodyClasses.substring( postIdPosition + 7, bodyClasses.length );

			var firstSpacePosition = bodyClasses.indexOf( ' ' );

			if ( that.doesStringContainSubstring( firstSpacePosition ) ) {
				return bodyClasses.substring( 0, firstSpacePosition );
			}

			return bodyClasses;
		}

		return false;
	};

	/**
	 * Add a trailing slash to a URL if it doesn't already have one.
	 *
	 * @param  {string} url The URL.
	 * @return {string} url The URL with a trailing slash.
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
	 * @param {string} url The URL to set as the new location.
	 */
	that.changeWindowLocation = function( url ) {
		window.location = url;
	};

	/**
	 * Bind event listeners.
	 */
	that.bindEvents = function() {
		chrome.runtime.onMessage.addListener( that.receiveMessageFromBackgroundScript );
	};

	that.bindEvents();

})( window, window.document, window.chrome, window.WPAdminSwitcher );