$(function() {
    $(".signout").click(function() {
      // window.localStorage.removeItem("authToken");
      // window.localStorage.removeItem("userType");
      // window.location.replace("login.html");

      var auth2 = gapi.auth2.getAuthInstance();
        auth2.signOut().then(function () {
        window.localStorage.removeItem("authToken");
        window.localStorage.removeItem("userType");
        window.location.replace("login.html");
          console.log('User signed out.');
        });
    })
  })
  