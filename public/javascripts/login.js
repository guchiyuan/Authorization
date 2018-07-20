$(function () {
  var ADDRESS_LOGIN = '/api/login';
  var ADDRESS_SEND_AUTHCODE = '/api/send_authcode';

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

    // var verifyCode = new GVerify("verify-container");

    // form.verify({
    //   pass: function (value, item) {
    //     if (!verifyCode.validate(value)) {
    //       return '验证码输入有误';
    //     }
    //   }
    // });

    $("#btn-getCaptcha").click(function () {
      var phone=/^[1][3,4,5,6,7,8,9][0-9]{9}$/; 
      if (phone.test($('#input-phone').val())) {
        getCaptcha();
      } else {
        layer.alert('请输入正确手机号码');
        // alert('请输入正确手机号码');
      }
    });

    var wait = 60; //时间
    var t; //计时器  
    function time() {
      if (wait == 0) {
        $('#btn-getCaptcha').removeAttr('disabled');
        //btnObj.removeAttribute("disabled");  
        //btnObj.textContent = "再次获取验证码";
        $('#btn-getCaptcha').removeClass('layui-disabled');         
        $('#btn-getCaptcha').text("获取验证码");
        wait = 60;
      } else {
        //btnObj.setAttribute("disabled", true);
        
        $('#btn-getCaptcha').attr('disabled', 'disabled');
        $('#btn-getCaptcha').addClass('layui-disabled');
        //$('#btn-getCaptcha').textContent = "重新发送验证码(" + wait + "s)";  
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
            layer.msg("短信验证码" + res.msg + "(30分钟内有效)");
          }
          // if (res.code === '9999') {
          //   if (res.msg.indexOf('天级')>-1) {
          //     layer.alert('对不起，此手机号码一天只能接受10条验证码');
          //   }
          //   if (res.msg.indexOf('小时级')>-1) {
          //     layer.alert('对不起，此手机号码一小时只能接受5条验证码');
          //   }
          //   if (res.msg.indexOf('分钟级')>-1) {
          //     layer.alert('对不起，此手机号码一分钟只能接受1条验证码');
          //   }
          // } else {
          //   console.log(res);
          // }
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
              window.location.href = 'checkPanel.html';
              
              break;
            
            case '3':
              window.location.href = 'checkPanel.html';
              
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


    // window.addEventListener("beforeunload", function (e) {
    //   // keepCount();

    //   (e || window.event).returnValue = null;
    //   return null;
    // });

    // function keepCount() {
    //   window.sessionStorage["counting"] = wait;
      
    // }


  })

})