$(function () {
  var ADDRESS_LOGIN = '/test/login';
  var ADDRESS_SEND_AUTHCODE = '/test/send_authcode';

  var ADDRESS_LOGOUT = '/test/logout';

  layui.use(['layer', 'form'], function () {
    var layer = layui.layer,
      form = layui.form;

    $("#btn-getCaptcha").click(function () {
      var phone=/^[1][3,4,5,6,7,8,9][0-9]{9}$/; 
      if (phone.test($('#input-phone').val())) {
        getCaptcha();
      } else {
        layer.alert('请输入正确手机号码');
      }
    });

    var wait = 60; //时间
    var t; //计时器  
    function time() {
      if (wait == 0) {
        $('#btn-getCaptcha').removeAttr('disabled');
        $('#btn-getCaptcha').removeClass('layui-disabled');         
        $('#btn-getCaptcha').text("获取验证码");
        wait = 60;
      } else {
        $('#btn-getCaptcha').attr('disabled', 'disabled');
        $('#btn-getCaptcha').addClass('layui-disabled'); 
        $('#btn-getCaptcha').text("重新发送验证码(" + wait + "s)");
        wait--;
        t = setTimeout(function () {
          time();
        }, 1000)
      }
    }

    function getCaptcha() {
      
      time();
  
      var reqData = {
        phone:$("#input-phone").val()
      };
      $.ajax({
        url:ADDRESS_SEND_AUTHCODE,
        type: 'POST',
        data: reqData,
        success: function (res) {
          if (res.code === '0002') {
            layer.msg(res.msg);
          } else if (res.code === '0000'){
            layer.msg("短信验证码" + res.msg);
          }
        },
        error: function (err) {
          // layer.alert(err.msg);
          console.log(err);
        }
      });
    }


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
          if (res.code === '9999') {
            layer.alert("请填入获得的验证码");
          }
          if (res.code && res.code !== '9999') {
            layer.alert(res.msg);
          }
          if (res.role) {
            var roleInfo = JSON.stringify({
              'role': res.role,
              'phone': reqData.phone
            });
            window.localStorage["roleInfo"] = roleInfo;
  
            window.sessionStorage["roleInfo"] = roleInfo;
  
            window.location.href = 'check_panel.html';
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