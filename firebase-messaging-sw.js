importScripts('https://www.gstatic.com/firebasejs/7.14.2/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/7.14.2/firebase-messaging.js');

// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyDbw7uHJqd7LG6wIeCPAJbvXr3i0ArBMss",
    authDomain: "messagenotificationservice.firebaseapp.com",
    databaseURL: "https://messagenotificationservice.firebaseio.com",
    projectId: "messagenotificationservice",
    storageBucket: "messagenotificationservice.appspot.com",
    messagingSenderId: "468212055000",
    appId: "1:468212055000:web:a183bd1710a1eaea9bd0ad",
    measurementId: "G-E8JRXC7256"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// [START get_messaging_object]
// Retrieve Firebase Messaging object.
const messaging = firebase.messaging();

messaging.usePublicVapidKey("BD0IwtgtudOtZkgZWRaPnR6-U1fprtH6ixb-YHeZjm1x9yACDk3noYNOsJ9iSkd1Jiji3la0kdnxG4Btru3jtg4");


// If you would like to customize notifications that are received in the
// background (Web app is closed or not in browser focus) then you should
// implement this optional method.
// [START background_handler]
messaging.setBackgroundMessageHandler(function (payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    // Customize notification here
    const notificationTitle = 'Background Message Title';
    const notificationOptions = {
        body: 'Background Message body.',
        icon: '/firebase-logo.png'
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});
  // [END background_handler]