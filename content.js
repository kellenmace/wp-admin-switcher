/**
 * WordPress Admin Switcher Content Script
 */

(() => {
  /**
   * Receive message from background script.
   *
   * @param {Object} request The request (message).
   */
  function receiveMessageFromBackgroundScript(request) {
    if (request.toggle) {
      toggleAdmin();
    }
  }

  /**
   * Switch to/from the WordPress Admin.
   */
  function toggleAdmin() {
    if (isWordPressAdmin(window.location.pathname)) {
      window.location = getFrontEndUrl();
    } else {
      window.location = getAdminUrl();
    }
  }

  /**
   * Is this the WordPress admin?
   *
   * @param  {string} url    The URL to check.
   * @return {boolean}       Whether currently in the WordPress admin.
   */
  function isWordPressAdmin(url) {
    return url.indexOf("/wp-admin/") > -1 || url.indexOf("/wp-login.php") > -1;
  }

  /**
   * Get frontend URL.
   *
   * @return {string} The frontend URL.
   */
  function getFrontEndUrl() {
    const urlFromAdminBar = getFrontEndUrlFromAdminBar();

    if (urlFromAdminBar) {
      return urlFromAdminBar;
    }

    const urlFromWindow = getFrontEndUrlFromWindowLocation();

    if (urlFromWindow) {
      return urlFromWindow;
    }

    // Return this as a last resort. Has the potential to
    // be incorrect on subdirectory multisite installs.
    return window.location.origin;
  }

  /**
   * Get front end URL from admin bar.
   *
   * Try to get the link to view/preview the post first,
   * then fallback to getting the main front end url.
   *
   * @return {string|boolean} The url or false on failure.
   */
  function getFrontEndUrlFromAdminBar() {
    const adminBarIds = {
      view: "#wp-admin-bar-view",
      preview: "#wp-admin-bar-preview",
      siteName: "#wp-admin-bar-site-name",
    };

    return getUrlFromAdminBar(adminBarIds);
  }

  /**
   * Get front end URL from window.location.
   *
   * @return {string|boolean} The url or false on failure.
   */
  function getFrontEndUrlFromWindowLocation() {
    const adminUrlParts = {
      wpAdmin: "/wp-admin/",
      wpLogin: "/wp-login.php",
    };

    for (let index in adminUrlParts) {
      let adminUrlPartPosition = getPositionOfStringInCurrentUrl(
        adminUrlParts[index]
      );

      const wasUrlFound = adminUrlPartPosition > -1;
      if (wasUrlFound) {
        return getPartOfUrlBeforePosition(adminUrlPartPosition);
      }
    }

    return false;
  }

  /**
   * Get the position of a string in the current URL.
   *
   * @param  {string} string The string to find within the URL.
   * @return {number}        The position of string within the URL.
   */
  function getPositionOfStringInCurrentUrl(string) {
    return window.location.href.indexOf(string);
  }

  /**
   * Get part of URL before the provided position.
   *
   * @param  {number} stringPosition Exclude the character at this position and following.
   * @return {string}                The part of the URL before stringPosition.
   */
  function getPartOfUrlBeforePosition(stringPosition) {
    return window.location.href.substring(0, stringPosition);
  }

  /**
   * Get the admin URL.
   *
   * @return {string} The admin URL.
   */
  function getAdminUrl() {
    const urlFromAdminBar = getAdminUrlFromAdminBar();

    if (urlFromAdminBar) {
      return urlFromAdminBar;
    }

    const urlFromPage = getAdminUrlFromPageSource();

    if (urlFromPage) {
      return urlFromPage;
    }

    // Return this as a last resort. Has the potential to
    // be incorrect on subdirectory multisite installs.
    return trailingSlashIt(window.location.origin) + "wp-admin/";
  }

  /**
   * Get admin URL from page source.
   *
   * @return {string|boolean} The admin URL or false on failure.
   */
  function getAdminUrlFromPageSource() {
    let url = inferUrlFromPageLinks(),
      postId = inferPostIdFromPageSource();

    if (url) {
      let adminUrl = getAdminUrlFromSiteUrl(url);

      if (postId) {
        adminUrl = getPostSpecificAdminUrl(adminUrl, postId);
      }

      return adminUrl;
    }

    return false;
  }

  /**
   * Turn site URL into admin URL.
   *
   * @param  {string} url The site URL.
   * @return {string}     The admin URL.
   */
  function getAdminUrlFromSiteUrl(url) {
    return trailingSlashIt(url) + "wp-admin/";
  }

  /**
   * Turn base admin URL into a post-specific admin URL.
   *
   * @param  {string} adminUrl The base admin URL.
   * @param  {string} postId   The post ID.
   * @return {string}          The post-specific admin URL.
   */
  function getPostSpecificAdminUrl(adminUrl, postId) {
    return adminUrl + "post.php?post=" + postId + "&action=edit";
  }

  /**
   * Get WP admin URL from the admin bar.
   *
   * @return {string|boolean} The URL or false on failure.
   */
  function getAdminUrlFromAdminBar() {
    const adminBarIds = {
      edit: "#wp-admin-bar-edit",
      siteName: "#wp-admin-bar-site-name",
    };

    return getUrlFromAdminBar(adminBarIds);
  }

  /**
   * Get URL from the WP admin bar.
   *
   * @param  {Object}         adminBarIds The element IDs to use as selectors.
   * @return {string|boolean}             The URL or false on failure.
   */
  function getUrlFromAdminBar(adminBarIds) {
    if (isEmptyObject(adminBarIds)) {
      return false;
    }

    for (let key in adminBarIds) {
      let adminBarAnchorHtmlElement = getAdminBarAnchorHtmlElement(
        adminBarIds[key]
      );

      if (wereHtmlElementsFound(adminBarAnchorHtmlElement)) {
        return getHrefUrlFromHtmlElement(adminBarAnchorHtmlElement);
      }
    }

    return false;
  }

  /**
   * Is this an empty object?
   *
   * @param  {Object} object The object to check.
   * @return {boolean}       Whether the object is empty.
   */
  function isEmptyObject(object) {
    return Object != object.constructor || Object.keys(object).length < 1;
  }

  /**
   * Get admin bar anchor HTML element.
   *
   * @param  {string} adminBarId The id of the HTML element to get.
   * @return {Object}            The matching HTML element NodeList.
   */
  function getAdminBarAnchorHtmlElement(adminBarId) {
    return document.querySelectorAll(adminBarId + " > a.ab-item[href]");
  }

  /**
   * Here any HTML elements found?
   *
   * @param  {Object}  nodelist The NodeList of HTML elements found.
   * @return {boolean}          Whether HTML elements were found.
   */
  function wereHtmlElementsFound(nodelist) {
    return nodelist.length > 0;
  }

  /**
   * Get the URL from an HTML element's href property.
   *
   * @param  {Object} element The HTML element NodeList.
   * @return {string}         The URL.
   */
  function getHrefUrlFromHtmlElement(element) {
    return element[0].getAttribute("href");
  }

  /**
   * Infer the site's URL from links in the page source.
   *
   * We can't simply get the site's URL from window.location
   * because subdomain multisite installs need to have the
   * /site-name/ part of the pathname preserved.
   *
   * @return {string|boolean} The URL or false on failure.
   */
  function inferUrlFromPageLinks() {
    const selectors = {
      stylesheets: 'link[rel="stylesheet"][href]',
      scripts: "script[src]",
      rss: 'link[type="application/rss+xml"][href]',
      xmlrpc: 'link[rel="pingback"][href]',
    };

    for (let selectorIndex in selectors) {
      let elements = document.querySelectorAll(selectors[selectorIndex]);

      if (wereHtmlElementsFound(elements)) {
        for (let elementIndex in elements) {
          let attribute = getAttributeForSelector(selectorIndex),
            url = inferUrlFromPageLink(elements[elementIndex], attribute);

          if (url) {
            return url;
          }
        }
      }
    }

    return false;
  }

  /**
   * Extract the URL from an HTML element.
   *
   * @param  {Object}         element   The HTML element
   * @param  {string}         attribute The attribute to get the URL from: 'href' or 'src'.
   * @return {string|boolean}           The URL or false on failure.
   */
  function inferUrlFromPageLink(element, attribute) {
    const paths = {
      wpContent: "/wp-content/",
      wpIncludes: "/wp-includes/",
    };

    for (let index in paths) {
      let url = getUrlSubstringFromHtmlElement(
        element,
        attribute,
        paths[index]
      );

      if (url) {
        return url;
      }
    }

    return false;
  }

  /**
   * Get the URL-containing attribute for a selector type.
   *
   * @param  {string} selector The selector type.
   * @return {string}          The attribute for contains the URL.
   */
  function getAttributeForSelector(selector) {
    switch (selector) {
      case "scripts":
        return "src";
      default:
        return "href";
    }
  }

  /**
   * Extract part of a URL from an HTML element.
   *
   * @param  {Object}         element   The HTML element.
   * @param  {string}         attribute The attribute to get URL from ('href' or 'src').
   * @param  {string}         string    The text to search for and exclude, along with
   *                                    everything after it.
   * @return {string|boolean}           The part of the URL or false on failure.
   */
  function getUrlSubstringFromHtmlElement(element, attribute, string) {
    const stringPosition = element[attribute].indexOf(string);
    const wasUrlFound = stringPosition > -1;

    if (wasUrlFound) {
      return element[attribute].substring(0, stringPosition);
    }

    return false;
  }

  /**
   * Infer post ID from the page source.
   *
   * Not all WordPress sites will have this exposed.
   *
   * @return {string|boolean} The post ID or false on failure.
   */
  function inferPostIdFromPageSource() {
    let postId = false,
      postIdSelectors = {
        commentsForm: "#comment_post_ID[value]",
        shortlink: 'link[rel="shortlink"][href]',
        body: "body[class]",
      };

    for (let index in postIdSelectors) {
      const postIdElement = document.querySelectorAll(postIdSelectors[index]);

      if (!wereHtmlElementsFound(postIdElement)) {
        continue;
      }

      switch (index) {
        case "commentsForm":
          postId = getPostIdFromCommentsForm(postIdElement);
          break;
        case "shortlink":
          postId = getPostIdFromShortlink(postIdElement);
          break;
        case "body":
          postId = getPostIdFromBodyClass(postIdElement);
      }
    }

    return postId;
  }

  /**
   * Get post ID from comments form.
   *
   * @param  {Object} postIdElement The HTML element NodeList containing the post ID.
   * @return {string}               The post ID.
   */
  function getPostIdFromCommentsForm(postIdElement) {
    return postIdElement[0].value;
  }

  /**
   * Get post ID from shortlink.
   *
   * @param  {Object}         postIdElement The HTML element NodeList containing the post ID.
   * @return {string|boolean}               The post ID or false on failure.
   */
  function getPostIdFromShortlink(postIdElement) {
    const shortlinkUrl = getHrefUrlFromHtmlElement(postIdElement);

    if (!isShortlinkUsingWpMeService(shortlinkUrl)) {
      const positionOfUrlTextBeforePostId =
        getPositionOfUrlTextBeforePostId(shortlinkUrl);

      const wasPostIdFound = positionOfUrlTextBeforePostId > -1;
      if (wasPostIdFound) {
        return getPostIdFromShortlinkUrl(
          shortlinkUrl,
          positionOfUrlTextBeforePostId
        );
      }
    }

    return false;
  }

  /**
   * Is shortlink using wp.me service?
   *
   * @param  {string}  shortlinkUrl The shortlink URL.
   * @return {boolean}              Whether shorlinkUrl is using wp.me.
   */
  function isShortlinkUsingWpMeService(shortlinkUrl) {
    return shortlinkUrl.indexOf("//wp.me/") > -1;
  }

  /**
   * Get the position of the URL before the post ID.
   *
   * @param  {string} shortlinkUrl The URL to search.
   * @return {number}              The position of the post ID.
   */
  function getPositionOfUrlTextBeforePostId(shortlinkUrl) {
    return shortlinkUrl.indexOf("/?p=");
  }

  /**
   * Extract the post ID from the shortlink URL.
   *
   * @param  {string} shortlinkUrl                  The shortlink URL.
   * @param  {number} positionOfUrlTextBeforePostId The position of URL text before the post ID.
   * @return {string}                               The post ID.
   */
  function getPostIdFromShortlinkUrl(
    shortlinkUrl,
    positionOfUrlTextBeforePostId
  ) {
    return shortlinkUrl.substring(
      positionOfUrlTextBeforePostId + 4,
      shortlinkUrl.length
    );
  }

  /**
   * Get post ID from body class.
   *
   * @param  {Object}         postIdElement The HTML element NodeList containing the post ID.
   * @return {string|boolean}               The post ID or false on failure.
   */
  function getPostIdFromBodyClass(postIdElement) {
    let bodyClasses = postIdElement[0].getAttribute("class"),
      postIdPosition = bodyClasses.indexOf("postid-");

    const wasPostIdFound = postIdPosition > -1;
    if (wasPostIdFound) {
      bodyClasses = bodyClasses.substring(
        postIdPosition + 7,
        bodyClasses.length
      );

      const firstSpacePosition = bodyClasses.indexOf(" ");

      const wasFirstSpaceFound = firstSpacePosition > -1;
      if (wasFirstSpaceFound) {
        return bodyClasses.substring(0, firstSpacePosition);
      }

      return bodyClasses;
    }

    return false;
  }

  /**
   * Add a trailing slash to a URL if it doesn't already have one.
   *
   * @param  {string} url The URL.
   * @return {string} url The URL with a trailing slash.
   */
  function trailingSlashIt(url) {
    if (url.endsWith("/")) return url;

    return url + "/";
  }

  // Add event listener
  chrome.runtime.onMessage.addListener(receiveMessageFromBackgroundScript);
})();
