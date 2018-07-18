// How do I setup OpenID with Steam?
// =========================
// *OpenID* is an authentication strategy where an unauthenticated user visits
// your site then authenticates themselves by logging in to Google, Twitter,
// Facebook, Steam, or some other *OpenID "provider*.  Your server (the
// *OpenID Relying Party*) exchanges keys with the *OpenID Provider* (Google,
// et. al.) then sends the user over to the *OpenID Provider* to log in.
// 
// After the user logs in with the *OpenID Provider*, the user is sent back to
// you with some information identifying who they are, signed by the key you
// exchanged with the *OpenID Provider*.  You can trust their identity at this
// point and start "logging them in" to your own system based on their
// identity.
// 
// You need sessions
// -----------------
// If you want to have user authentication and ongoing "sessions", you have
// some work to do with HTTP.
// 
// HTTP is a "stateless" protocol, meaning that HTTP has no concept of
// ongoing connections or "sessions".  That is, HTTP servers think every HTTP
// request is a brand new interaction.  This makes HTTP easy to reason about,
// but sometimes makes real-world applications a little bit harder.
// 
// For example, how do you distinguish logged-in users from not-logged-in
// users?  How do you know what user is even making a given HTTP request?
// 
// Over time the language to describe this problem has settled on calling these
// ongoing interactions "sessions".  A particular "best-practice" solution
// for managing sessions has emerged that depends on cookies.
// 
// Cookies are little bits of text that the client web browser attaches to
// the headers of every HTTP request the client makes to your server.
// Your server tells the web browser what those cookies should say.
// 
// The best-practice is to create a unique random-looking string of characters
// to identify the session on the server.  This string of characters is called
// the session key.  This key is sent to the client as a cookie so that the
// client web browser will reply with this session key with every request.
// The server now has a way to relate each HTTP request to an ongoing session.
// We can even store session information in a database so that user sessions
// can resume even if the web server is restarted.
// 
// When the server receives the HTTP request, it grabs the key from the
// cookie then uses the key to look up the session in a database.  Any changes
// the server makes to the session are written to the database for the next
// request to look up.  A little behind-the-scenes caching make this a not-so-bad
// solution.
// 
// This whole "make a key", "send the key", "store the key", then "look up the
// key" dance is an old dance at this point, so there are a few Express packages
// we can use to solve this problem.  People use all sorts of databases and
// authentication strategies, so these packages have been designed to
// accomodate connecting all these components up in different ways.
// 
// You'll need to install each of the `require()`'d modules in your project
// directory.  To install all of them right now, run the following command:
// 
// ```bash
// npm install express express-session connect-firebase passport-openid passport
// ```
// 
// First we'll require Express for our HTTP server and create an app to
// configure.
// 
// ```js

var express = require('express');
var app = express();

// ```
// 
// Use Sessions
// ------------
// So, even though the goal is to have OpenID user authentication, we need to
// get some pre-requisites out of the way.  The first of these is sessions.
// We can't have *user* sessions without sessions.  We'll get to users later.
// 
// There are a lot of technologies and strategies for dealing with sessions,
// most particularly the database backend that you use.  For this example
// we're going to use FireBase.  Because there are so many options, we're left
// with quite a bit of configuration to set up sessions.
// 
// On the plus side, it's much easier to swap out any individual database or
// authentication strategy if your needs change.
// 
// First of all, there's a high-level session management package for Express,
// called [express-session](https://github.com/expressjs/session).  This
// package handles the fundamentals of getting and setting cookies and routing
// session data in and out of your database backend.
// 
// ```js

var session = require('express-session');

// ```
// 
// By default, `express-session` uses an in-memory database that isn't
// suitable for production.  We're going to tell `express-session` to use
// Firebase instead, so we're going to wrap the session package with
// a Firebase session interface using the package `connect-firebase`.
// 
// ```js

var FirebaseStore = require('connect-firebase')(session);

// ```
// 
// Now we've got a session manager that can use Firebase databases.
// We need to configure this manager to speak to a particular Firebase
// database that we control.
// 
// You'll need to find and/or create a Firebase token to replace
// `YOURFIREBASETOKEN`, below.  At firebase.com, click "manage app" for your
// FireBase app.  Click "Secret" in the sidebar to reveal your token(s).  Either
// insert your existing token below or create a new one.
// 
// ```js

var firebaseStoreOptions = {
    // Your FireBase database
    host: 'my-firebase-app-8576.firebaseio.com',
    // Secret token you can create for your Firebase database
    token: 'YOURFIREBASETOKEN',
    // How often expired sessions should be cleaned up
    reapInterval: 600000,
};

// ```
// 
// Lastly, configure this session manager and tell our Express server to
// use it.  We're going to pass a few options as we finally initialize our
// session manager.
// 
// First, we'll pass it a newly instantiated Firebase session manager that
// talks to our Firebase database.  Second, we'll need to choose a secret key to
// encrypt your session information to keep it safe.  This can be anything;
// it's basically a password that the session manager will use to encrypt stored
// session information and decrypt retrieved session information.
// 
// Third and fourth, we need to specify some required options.  These required
// options are somewhat specific to our application and database.  The `resave`
// option, if true, tells the session manager to store session information even
// if it hasn't been changed.  The `saveUninitialized` option tells the session
// manager to save brand new sessions even if they haven't been modified yet.
// You can read about more options in the [express-session docs].
// 
// [express-session docs]: https://github.com/expressjs/session
// 
// ```js

app.use(session({
    store: new FirebaseStore(firebaseStoreOptions),
    secret: 'YOURSESSIONSECRETKEY', // Change this to anything else
    resave: false,
    saveUninitialized: true
}));

// ```
// 
// Alright, we have sessions.  In your routes, you can now read and write to
// request.session and the values will persist between HTTP requests for this
// particular client.  The client will lose the session if they clear cookies.
// None of the data you set in `request.session` actually comes from the
// client!  It's stored in your Firebase database; the client merely sends the
// session ID with each request.  Our session manager populates the
// `request.session` object for us.
// 
// Sessions are useful on their own, but all of this was merely a pre-requiste
// OpenID.
// 
// Use OpenID for authentication and user management
// -------------------------------------------------
// Now we need to create an OpenID "Strategy".  A strategy is just a
// configuration for how OpenID should work for a given "OpenID provider"
// such as Steam.  At the least, we need to:
// 
//   1. configure the URL for the OpenID provider;
//   2. state whether the OpenID provider uses a 'stateless' strategy;
//   3. specify the URL the OpenID provider should return users to after login;
//   4. specify the realm for which the OpenID login will be valid.
// 
// The OpenID strategy also needs a 'validate' callback.  This callback
// receives the OpenID identifier (basically a username for your site)
// and determines if the user identifier is valid on your site.  Then you
// should return an object describing that user.  We're going to accept all
// Steam identifiers.  If we wanted to blacklist certain users then we might
// do it by returning an error via `done()` in the callback here.
// 
// Note that OpenID identifiers, while technically usernames, are actually
// formatted as URLs.  A typical Steam OpenID identifier (called the *Claimed ID*)
// is:
// 
//     http://steamcommunity.com/openid/id/76561197975696140
// 
// The digits after `/id/` are the 64-bit Steam ID, used in various Steam Web API
// requests.
// 
// An *OpenID Claimed ID* looks like this because you could accept an *OpenID
// Claimed ID* from a sources other than Steam.  For example, if you accepted
// a *Claimed ID* from Google, that would probably look like the following:
// 
//     https://www.google.com/accounts/o8/id?id=1016730112881507946
// 
// We're limiting ourselves to Steam at the moment, but this gives us a hint that
// we could add multiple identities for a user if we had a use for it.
// 
// ```js

var OpenIDStrategy = require('passport-openid').Strategy;
var SteamStrategy = new OpenIDStrategy({
        // OpenID provider configuration
        providerURL: 'http://steamcommunity.com/openid',
        stateless: true,
        // How the OpenID provider should return the client to us
        returnURL: 'http://localhost:4000/auth/openid/return',
        realm: 'http://localhost:4000/',
    },
    // This is the "validate" callback, which returns whatever object you think
    // should represent your user when OpenID authentication succeeds.  You
    // might need to create a user record in your database at this point if
    // the user doesn't already exist.
    function(identifier, done) {
        // The done() function is provided by passport.  It's how we return
        // execution control back to passport.
        // Your database probably has its own asynchronous callback, so we're
        // faking that with nextTick() for demonstration.
        process.nextTick(function () {
            // Retrieve user from Firebase and return it via done().
            var user = {
                identifier: identifier,
                // Extract the Steam ID from the Claimed ID ("identifier")
                steamId: identifier.match(/\d+$/)[0]
            };
            // In case of an error, we invoke done(err).
            // If we cannot find or don't like the login attempt, we invoke
            // done(null, false).
            // If everything went fine, we invoke done(null, user).
            return done(null, user);
        });
    });

// ```
// 
// Now we require `passport` and tell pasport to use our new `SteamStrategy`.
// 
// ```js

var passport = require('passport');
passport.use(SteamStrategy);

// ```
// 
// When passport is used with implement sessions, we must provide
// `serializeUser` and `deserializeUser` callbacks.  Your sessions won't work
// without these callbacks.
// 
// The serializeUser callback extracts sufficient information from the user
// object to recover the user from our database in the future.  Usually that
// means an email address, an ID, or a username.  In our case, this can be the
// OpenID *Claimed ID* provided by steam.
// 
// What this callback really does is provide the *key* that is used to store your
// user object in your user account database.
// 
// ```js

passport.serializeUser(function(user, done) {
    done(null, user.identifier);
});

// ```
// 
// The `deserializeUser` method recovers the user object from our database.
// This method is only used when the user visits the site again with the
// information returned by `serializeUser` and a new session needs to be
// generated.
// 
// That is, the `deserializeUser` callback can use the same key returned by the
// `serializeUser` callback to restore the original user object from the database.
// 
// ```js

passport.deserializeUser(function(identifier, done) {
    // For this demo, we'll just return an object literal since our user
    // objects are this trivial.  In the real world, you'd probably fetch
    // your user object from your database here.
    done(null, {
        identifier: identifier,
        steamId: identifier.match(/\d+$/)[0]
    });
});

// ```
// 
// The functions passed to `serializeUser` and `deserializeUser` are inverses
// of each other.
// 
// Finally, we need to tell Express to use all this passport strategizing we've
// been setitng up.  Note, if you forget the second line you'll get
// `request.user == undefined`, because `deserializeUser` will never be called.
// 
// ```js

app.use(passport.initialize());
app.use(passport.session());

// ```
// 
// 
// Now we'll set up our routes.
// 
// Routes for OpenID
// -----------------
// When the user clicks a button on `index.html` their browser will send
// a post request to `/auth/openid`.  We use passport's `authenticate()`
// method to generate a handler to redirect the user to the OpenID provider.
// 
// ```js

app.post('/auth/openid', passport.authenticate('openid'));

// ```
// 
// When the user finishes with the OpenID provider, the OpenID provider will
// redirect the user to `/auth/openid/return`, as we specified.
// 
// We can handle the return a few different ways.  Method 1 is to just
// redirect, and `passport.authenticate` can generate a handler for this
// as well.
// 
// ```js

// app.get('/auth/openid/return', passport.authenticate('openid', {
//    'successRedirect': '/',
//    'failureRedirect': '/auth/failure'
// }));

// ```
// 
// However, we'd like to make things easy on ourselves by passing the steam id
// to the client, so we'll implement a semi-manual redirect that will stick
// the user's steam id in a query paramater and redirect to root.
// 
// ```js

app.get('/auth/openid/return', passport.authenticate('openid'),
    function(request, response) {
        if (request.user) {
            response.redirect('/?steamid=' + request.user.steamId);
        } else {
            response.redirect('/?failed');
        }
});

// ```
// 
// We can also provide the user with a means to log out.  Passport has added
// a `.logout()` method to the request object to accomplish this.  When you
// call `.logout()`, passport will clear the session and delete the session
// cookie on the next response.  Just stick a submit button in a form
// with that form's `action` set to for this path to create a logout button.
// 
// ```js

app.post('/auth/logout', function(request, response) {
    request.logout();
    // After logging out, redirect the user somewhere useful.
    // Where they came from or the site root are good choices.
    response.redirect(request.get('Referer') || '/')
});

// ```
// 
// Lastly we need a page!  We'll just write some dirty HTML to get something
// on the screen:
// 
// ```js

app.get('/', function(request, response) {
    response.write('<!DOCTYPE html>')
    if (request.user) {
        response.write(request.session.passport &&
            JSON.stringify(request.user) || 'None');
        response.write('<form action="/auth/logout" method="post">');
        response.write('<input type="submit" value="Log Out"/></form>');
    } else {
        if (request.query.steamid) {
            response.write('Not logged in.');
        }
        response.write('<form action="/auth/openid" method="post">');
        response.write(
            '<input name="submit" type="image" src="http://steamcommunity-a.' +
            'akamaihd.net/public/images/signinthroughsteam/sits_small.png" ' +
            'alt="Sign in through Steam"/></form>');
    }
    response.send();
});

// ```
// Start the server
// 
// ```js

var port = 4000;
var server = app.listen(port);
console.log('Listening on port ' + port);

// ```
// 
// Alright!  Start your server with `node server.js` and now you can go
// to <http://localhost:4000/> and there's a "Log in through Steam" buton.
// Click it and you'll go to Steam's site to log in.  You'll then be returned
// to `/auth/openid/return`, which we just redirect back to `/`.
// 
// Once logged in, they'll see the "Log Out" button, which will just send them
// to `/auth/logout`.  The server will nuke the session and redirect them back
// to `/` again.
// 
// If you're having trouble, you can
// [download this article from gist](http://git.io/vc7UB)
// as an executable `node.js` file.
