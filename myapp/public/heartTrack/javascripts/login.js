/**
 * Sending Login Request to the serve with the endpoint: "/users/login"
 * Method: POST
 * If login successfully, go to user's account page,
 * otherwise, display the errors
 */
/* -------------------------------------------------------------------- */
function sendLoginRequest() {
    let typeOfUser = $('input[name="user-type"]:checked').val();
    // console.log(typeOfUser);
    if(typeOfUser == "patient"){
        $.ajax({
            url: '/users/login',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ email: $('#email').val(), password: $('#password').val() }),
            dataType: 'json'
          })
            .done(loginSuccess)
            .fail(loginFailure);
    }
    else if(typeOfUser == "physician"){
        $.ajax({
            url: '/physician/login',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ email: $('#email').val(), password: $('#password').val() }),
            dataType: 'json'
          })
            .done(physicianLoginSuccess)    //Go to Physician page
            .fail(loginFailure);
    }
}

function loginSuccess(data, testStatus, jqXHR) {
    console.log(data.authToken);
    window.localStorage.setItem('authToken', data.authToken);
    window.localStorage.setItem('userType', 1); //1 meaning patient
    window.location = "account.html";
}

function physicianLoginSuccess(data, testStatus, jqXHR) {
    console.log(data.authToken);
    window.localStorage.setItem('authToken', data.authToken);
    window.localStorage.setItem('userType', 2); //2 meaning physician
    window.location = "physicianAccount.html";
}

function loginFailure(jqXHR, testStatus, errorThrown) {
    if (jqXHR.status == 401 ) {
       $('#ServerResponse').html("<span class='red-text text-darken-2'>Error: " +
                                 jqXHR.responseJSON.message +"</span>");
       $('#ServerResponse').show();
    }
    else {
       $('#ServerResponse').html("<span class='red-text text-darken-2'>Server could not be reached.</span>");
       $('#ServerResponse').show();
    }
}
/* -------------------------------------------------------------------- */


/* ----------------------------- Google Signin ------------------------------ */

function googleSignIn(password, userName, userEmail){
    let typeOfUser = $('input[name="user-type"]:checked').val();
    // console.log(typeOfUser);
    if(typeOfUser == "patient"){
        $.ajax({
            url: '/users/login',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ email: userEmail, password: password }),
            dataType: 'json'
          })
            .done(loginSuccess)
            .fail( () => {  //register if not in database
                $.ajax({
                    url: '/users/register',
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({email:userEmail, fullName: userName, password: password}),
                    dataType: 'json'
                  })
                    .done( () => { // Login when register successfully
                        $.ajax({
                            url: '/users/login',
                            method: 'POST',
                            contentType: 'application/json',
                            data: JSON.stringify({ email: userEmail, password: password }),
                            dataType: 'json'
                          })
                            .done(loginSuccess)
                            .fail(loginFailure);
                    })
                    .fail(loginFailure);
            });
    }
    else if(typeOfUser == "physician"){
        $.ajax({
            url: '/physician/login',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ email: userEmail, password: password }),
            dataType: 'json'
          })
            .done(physicianLoginSuccess)    //Go to Physician page
            .fail(() => {  //register if not in database
                $.ajax({
                    url: '/physician/register',
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({email:userEmail, fullName: userName, password: password}),
                    dataType: 'json'
                  })
                    .done( () => { // Login when register successfully
                        $.ajax({
                            url: '/physician/login',
                            method: 'POST',
                            contentType: 'application/json',
                            data: JSON.stringify({ email: userEmail, password: password }),
                            dataType: 'json'
                          })
                            .done(physicianLoginSuccess)
                            .fail(loginFailure);
                    })
                    .fail(loginFailure);
            });
    }
}
/* ----------------------------- Google Signin ------------------------------ */

/**
 * Eventlisteners when the page loaded.
 * If the localstorage has the authToken for user's account, (login successfully)
 * automatically go to user's account page,
 * 
 * When the Login button is clicked, send the login request to the server
 */
/* -------------------------------------------------------------------- */
$(function() {
    if( window.localStorage.getItem("authToken") && window.localStorage.getItem("userType") == 1 ) {
        window.location.replace("account.html");
    }else if( window.localStorage.getItem("authToken") && window.localStorage.getItem("userType") == 2 ) {
        window.location.replace("physicianAccount.html");
    }
  
    $("#login").click(sendLoginRequest);
    $("#password").keypress(function(event) {
      if (event.which === 13) { //hit enter
        sendLoginRequest();
      }
    });
});
/* -------------------------------------------------------------------- */