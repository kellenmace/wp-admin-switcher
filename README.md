# WordPress Admin Switcher #

- **Author:** Kellen Mace
- **Author URL:** http://kellenmace.com/
- **Extension URL:** https://github.com/kellenmace/wp-admin-switcher/
- **License:** GPLv2 or later
- **License URL:** http://www.gnu.org/licenses/gpl-2.0.html

## Description ##

A Google Chrome extension that enables you to switch to/from the WordPress Admin with a single keyboard shortcut or click.

## Use ##

On any WordPress site, hit cmd + shift + A (Mac) or ctrl + shift + A (Windows/Linux) to switch to/from the WordPress Admin. Alternatively, clicking the extension icon produces the same behavior.

## Examples ##

1. You're not yet logged in to a WordPress site. Hitting the shortcut will direct you to the WordPress Admin login screen.
2. You're logged in and are on the front end of a WordPress site. Hitting the shortcut will direct you to the Admin post edit screen for the post/page/custom post type you were viewing, or else the main Admin screen.
3. You're logged in and are in the WordPress Admin. Hitting the shortcut will direct you to the page on the front end for the post/page/custom post type you were editing, or else the main site URL.

## FAQ ##

> If I'm logged in to the site, WordPress provides links in the admin bar at the top
> that can be used to jump back & forth between the Admin and front end. How is this
> any different?

It's about efficiency and productivity. The more you can leave your hands on the keyboard without reaching for the mouse/trackpad, the faster you'll be. Not to mention that if you're not yet logged in to a WordPress site, the Admin bar links aren't there for you to click on so you'll end up manually highlighting and deleting part of the URL and typing in 'wp-admin <enter>' every time. The following table illustrates the difference.

<table>
    <tr>
        <th></th>
        <th>Without extension</th>
        <th>With extension</th>
    </tr>
    <tr>
    	<th>Logging into a site</th>
        <td>Move your hand to your mouse/trackpad.
Move the cursor up the omnibar/address bar.
Click and highlight everything to the right of the domain.
Type 'wp-admin' followed by the enter key.</td>
		<td>Hit cmd/ctrl + shift + A</td>
    </tr>
    <tr>
    	<th>Switching between front end/admin</th>
        <td>Move your hand to your mouse/trackpad.
Move the cursor up the WordPress Admin bar.
Click one of the links to go to/from the Admin.</td>
		<td>Hit cmd/ctrl + shift + A</td>
    </tr>
</table>