const firebaseConfig = {
  apiKey: "AIzaSyAppPzX0bLfYbYmhdytPRZSO4SmSn6ko5Y",
  authDomain: "nt-tasker-81815.firebaseapp.com",
  databaseURL: "https://nt-tasker-81815-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "nt-tasker-81815",
  storageBucket: "nt-tasker-81815.appspot.com",
  messagingSenderId: "72746692206",
  appId: "1:72746692206:web:f1ba8df7cceea0e84ec07f"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();