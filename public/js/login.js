$(".forgot-password").click(function () {
  var email = $(".login-form input[name=email]").val();
  var csrf_token = $('meta[name="csrf-token"]').attr("content");
  if (email) {
    $.ajax({
      url: '/forgot',
      type: 'post',
      data: {
        email: email,
        _csrf: csrf_token
      },
      success: function (res) {
        alert(res.msg);
      }
    })
  } else {
    alert('please input email address.');
  }
});


function onSubmit(token) {
  console.log(token, "token")
  document.getElementById("signup-form").submit();
}