
/**
 * Global variables
 * All of these value should be passed ( = 1) before Account Registration
 * to ensure strong password
 */
/* -------------------------------------------------------------------- */
let lengthCheck = 0;
let lowercaseCheck = 0;
let uppercaseCheck = 0;
let digitCheck = 0;
let strongPasswordPassed = 0;
let correctEmailFormat = 0;
/* -------------------------------------------------------------------- */


/**
 * Sending Register Request to the server with the endpoint: "/users/register"
 * All personal information should be filled
 * "confirmPassword-passed" & "confirmPassword-failed" are the icons (check html file)
 */
/* -------------------------------------------------------------------- */
function sendRegisterRequest() {
    let email = $('#email').val();
    let password = $('#password').val();
    let fullName = $('#fullName').val();
    let passwordConfirm = $('#passwordConfirm').val();
    
    //If one of the information (input) is missing, display error
    if(!email || !password || !fullName || !passwordConfirm){
        $('#ServerResponse').html("<span class='red-text text-darken-2'>Please fill out all information.</span>");
            $('#ServerResponse').show();
            return;
    }else{
        $('#ServerResponse').hide();
    }

  // Check to ensure strong password 
    if(strongPasswordPassed == 1){
        // Check to make sure the passwords match
        if (password != passwordConfirm) {
            $('.confirmPassword-failed').show();
            $('.confirmPassword-passed').hide();
            $('#ServerResponse').html("<span class='red-text text-darken-2'>Passwords do not match.</span>");
            $('#ServerResponse').show();
            return;
        }else{
            $('.confirmPassword-passed').show();
            $('.confirmPassword-failed').hide();
            $('#ServerResponse').hide();

            $.ajax({
                url: '/users/register',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({email:email, fullName:fullName, password:password}),
                dataType: 'json'
              })
                .done(registerSuccess)
                .fail(registerError);
        }
    } 
}
/* -------------------------------------------------------------------- */



/**
 * Success for register an account
 * @param {*} data Response data from server 
 * @param {*} textStatus 
 * @param {*} jqXHR 
 * Redirect to the login page after registration
 */
/* -------------------------------------------------------------------- */
function registerSuccess(data, textStatus, jqXHR) {
  if (data.success) {  
    window.location = "login.html";
  }
  else {
    $('#ServerResponse').html("<span class='red-text text-darken-2'>Error: " + data.message + "</span>");
    $('#ServerResponse').show();
  }
}
/* -------------------------------------------------------------------- */


/* -------------------------------------------------------------------- */
function registerError(jqXHR, textStatus, errorThrown) {
  if (jqXHR.statusCode == 404) {
    $('#ServerResponse').html("<span class='red-text text-darken-2'>Server could not be reached.</p>");
    $('#ServerResponse').show();
  }
  else {
    $('#ServerResponse').html("<span class='red-text text-darken-2'>Error: " + jqXHR.responseJSON.message + "</span>");
    $('#ServerResponse').show();
  }
}
/* -------------------------------------------------------------------- */


/* -------------------------------------------------------------------- */
/**
 * Check to ensure correct email
 */
/* -------------------------------------------------------------------- */
function ensureCorrectEmail(){
  let email = $('#email').val();
  var mailformat = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  if(!mailformat.test(email)) {
    $('#correctEmailFormat').show();
    $('#correctEmailFormat').css("color", "red");
    $('.email-passed').hide();
    $('.email-failed').show();
  }
  else {
    correctEmailFormat = 1;
    $('#correctEmailFormat').hide();
    $('.email-passed').show();
    $('.email-failed').hide();
  }

}


/**
 * Check to ensure strong password 
 */
/* -------------------------------------------------------------------- */
function ensureStrongPassword(){
  let password = $("#password").val();

  //Regular Expressions
  let emailRegExp = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,5}$/;
  let lowercaseRegExp = /^(?=.*[a-z])/;
  let uppercaseRegExp = /^(?=.*[A-Z])/;
  let digitRegExp = /[\d]{1}/;

  /**
   * Ensure the password has 10 to 20 characters
   */
  if(password.length >= 10 && password.length <= 20){
    $('#passwordLengthPassed').css("color", "darkgreen");
    lengthCheck = 1;
  }else{
    $('#passwordLengthPassed').css("color", "red");
    lengthCheck = 0;
  }

  /**
   * Ensure the password contains at least one lowercase character
   */
  if(lowercaseRegExp.test(password)){
    $('#passwordLowercasePassed').css("color", "darkgreen");
    lowercaseCheck = 1;
  }else{
    $('#passwordLowercasePassed').css("color", "red");
    lowercaseCheck = 0;
  }

  /**
   * Ensure the password contains at least one uppercase character
   */
  if(uppercaseRegExp.test(password)){
    $('#passwordUppercasePassed').css("color", "darkgreen");
    uppercaseCheck = 1;
  }else{
    $('#passwordUppercasePassed').css("color", "red");
    uppercaseCheck = 0;
  }

  /**
   * Ensure the password contains at least one digit
   */
  if(digitRegExp.test(password)){
    $('#passwordDigitPassed').css("color", "darkgreen");
    digitCheck = 1;
  }else{
    $('#passwordDigitPassed').css("color", "red");
    digitCheck = 0;
  }


  //if all conditions passed, meaning the user entered a strong password
  //otherewise, display errors
  if(lengthCheck == 1 && lowercaseCheck == 1 && uppercaseCheck == 1 && digitCheck == 1){
    strongPasswordPassed = 1;
    $('#passwordVerifictionErrors').slideUp();
    $('.password-passed').show();
    $('.password-failed').hide();
  }else{
    strongPasswordPassed = 0;
    $('#passwordVerifictionErrors').show();
    $('.password-passed').hide();
    $('.password-failed').show();
  }
  
}
/* -------------------------------------------------------------------- */


$(function () {
  $('#signup').click(sendRegisterRequest);
  $('#email').blur(ensureCorrectEmail);
  $('#password').keyup(ensureStrongPassword);
  $('#passwordConfirm').click( () => {
    $('.confirmPassword-passed').hide();
    $('.confirmPassword-failed').hide();
  });
});
