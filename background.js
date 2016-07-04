/**
 * WordPress Admin Switcher Background Script
 */
 
 window.WPAdminSwitcherBackground = {};
( function( window, chrome, that ) {

	/**
	 * Icon click listener.
	 */
	that.iconClickListener = function() {
		that.sendMessageToContentScript( { iconClicked: true } );
	};

	/**
	 * Send message to content script.
	 *
	 * @param {object} message The message to send.
	 */
	that.sendMessageToContentScript = function( message ) {
		chrome.tabs.query( { active: true, currentWindow: true }, function( tabs ) {
			chrome.tabs.sendMessage( tabs[0].id, message );
		} );
	};

	/**
	 * Combine all events.
	 */
	that.bindEvents = function() {
		chrome.browserAction.onClicked.addListener( that.iconClickListener );
	};

	that.bindEvents();

})( window, window.chrome, window.WPAdminSwitcherBackground );