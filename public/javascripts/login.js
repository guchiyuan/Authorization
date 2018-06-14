$(function () {
  var ADDRESS_LOGIN = '/api/login';

  var ADDRESS_LOGOUT = '/api/logout';


  // $.ajax({
  //   url: ADDRESS_LOGOUT,
  //   async:false,
  //   type: 'GET',
  //   success: function (res) {
  //     console.log(res);
  //   },
  //   error: function (err) {
  //     console.log(err);
  //   }
  // });

  layui.use(['layer', 'form'], function () {
    var layer = layui.layer,
      form = layui.form;

    var verifyCode = new GVerify("verify-container");

    form.verify({
      pass: function (value, item) {
        if (!verifyCode.validate(value)) {
          return '验证码输入有误';
        }
      }
    });


    form.on('submit(*)', function (data) {
      var reqData = {
        'phone': $('#input-phone').val(),
        'captcha': $('#input-captcha').val()
      };

      console.log(reqData);
      $.ajax({
        url: ADDRESS_LOGIN,
        type: 'POST',
        data: reqData,
        success: function (res) {
          console.log(res);
          if (res.msg) {
            layer.alert(res.msg);
          }
          var roleInfo = JSON.stringify({
            'role': res.role,
            'phone': reqData.phone
          });
          window.localStorage["roleInfo"] = roleInfo;

          window.sessionStorage["roleInfo"] = roleInfo;

          switch (res.role) {
            case '0':
              // window.location.href = 'normalPanel.html';
              // window.location.href = 'checkPanel.html?role=' + res.role + '&id=' + reqData.phone;
              window.location.href = 'checkPanel.html';
              break;

            case '1':
              // window.location.href = 'checkPanel.html?role=' + res.role + '&id=' + reqData.phone;
              window.location.href = 'checkPanel.html';
              break;

            case '2':
              window.location.href = 'admin.html';
              
              break;

            default:
              break;
          }
        },
        error: function (err) {
          layer.alert(err.msg);
        }
      });


      return false
    })


    $(window).keydown(function (event) {
      if (event.keyCode == 13) { //回车键的键值为13
        $('#btn-login').click(); //调用登录按钮的登录事件
      }
    });


  })

})