$(function () {
  var ADDRESS_XMZXX = '/test/get_option/xmzxx';
  var ADDRESS_XZQDM = '/test/get_ssqy';
  var ADDRESS_LOGOUT = '/test/logout';
  var ADDRESS_GETUSERINFO = '/test/get_userInfo';
  var ADDRESS_SUBMITUSERINFO = '/test/submit_userInfo';
  var ADDRESS_USERHISTORY = '/test/user_history';
  var ADDRESS_UNCHECKEDUSERS = '/test/unchecked_users';
  var ADDRESS_UNCHECKEDAPPLICATIONS = '/test/unchecked_applications';
  var ADDRESS_CHECKEDUSERS = '/test/checked_users';
  var ADDRESS_CHECKEDAPPLICATIONS = '/test/checked_applications';
  var ADDRESS_NEEDAUTHORITY = '/test/need_authority';
  var ADDRESS_CHECKEDAUTHORITY = '/test/checked_authority';
  var ADDRESS_USERREJECTREASON = '/test/user_reject_reason';
  var ADDRESS_APPLICATIONREJECTREASON = '/test/application_reject_reason';
  var ADDRESS_REVOKEAPPLICATION = '/test/revokeApplication';
  var ADDRESS_GETBLZT = '/test/get_blzt';
  var ADDRESS_SAVERZJL = '/test/save_rzjl';
  var ADDRESS_FLOWCHART = '/test/flowchart_info';
  var ADDRESS_TEMPOPENID = '/test/get_temp_openid';
  var ADDRESS_ACCESSTOKEN = '/test/get_access_token';
  var ADDRESS_GETTICKET = '/test/get_qrcode_ticket';
  var ADDRESS_QRCODE = 'https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=TICKET';
  var ADDRESS_GETJSCYOPENID = '/test/get_jscy_openid';
  var ADDRESS_NEEDSENDAUTHORITY = '/test/need_sendauthority';
  var ADDRESS_CHECKEDSENDAUTHORITY = '/test/checked_sendauthority';

  


  var date = new Date();

  layui.use(['layer', 'form'], function () {
    var layer = layui.layer;
    var form = layui.form;

    var roleInfo = JSON.parse(window.localStorage.getItem('roleInfo'));

    var currentRoleInfo = JSON.parse(window.sessionStorage.getItem('roleInfo'));


    //登录另外一个用户后，回到之前页面会重新刷新，显示之后登录的账号信息
    document.addEventListener('visibilitychange', function () { //浏览器切换事件
      roleInfo = JSON.parse(window.localStorage.getItem('roleInfo'));
      currentRoleInfo = JSON.parse(window.sessionStorage.getItem('roleInfo'));
      if (document.visibilityState == 'visible') { //状态判断
        if (roleInfo.phone != currentRoleInfo.phone) {
          window.location.reload();
          window.sessionStorage["roleInfo"] = JSON.stringify(roleInfo);
        }
      }
    });


    //管理员用户切换到管理系统的入口
    $("#goToAdmin").click(function () {
      window.location.href = './admin.html'
    })

    //----------------------------展示用户个人信息------------------------------------//
    var flag = 0;
    $('#btn-userInfo').click(function () {
      if (flag === 0) {
        $('#user-info').toggle(function () {
          $('#content-apply').removeClass('layui-col-md9');
          $('#content-checkUsers').removeClass('layui-col-md9');
          $('#content-checkAppplications').removeClass('layui-col-md9');
          $('#content-needAuthority').removeClass('layui-col-md9');
          $('#content-init').removeClass('layui-col-md9');
          $('#content-apply').addClass('layui-col-md12');
          $('#content-checkUsers').addClass('layui-col-md12');
          $('#content-checkAppplications').addClass('layui-col-md12');
          $('#content-needAuthority').addClass('layui-col-md12');
          $('#content-init').addClass('layui-col-md12');
        });
        flag = 1;
      } else {
        $('#user-info').toggle(function () {
          $('#content-apply').removeClass('layui-col-md12');
          $('#content-checkUsers').removeClass('layui-col-md12');
          $('#content-checkAppplications').removeClass('layui-col-md12');
          $('#content-needAuthority').removeClass('layui-col-md12');
          $('#content-init').removeClass('layui-col-md12');
          $('#content-apply').addClass('layui-col-md9');
          $('#content-checkUsers').addClass('layui-col-md9');
          $('#content-checkAppplications').addClass('layui-col-md9');
          $('#content-needAuthority').addClass('layui-col-md9');
          $('#content-init').addClass('layui-col-md9');
        });
        flag = 0;
      }
    });


    function toggleUserInfoPanel() {
      if (flag === 0) {
        $('#user-info').hide();
        $('#content-apply').removeClass('layui-col-md9');
        $('#content-checkUsers').removeClass('layui-col-md9');
        $('#content-checkAppplications').removeClass('layui-col-md9');
        $('#content-needAuthority').removeClass('layui-col-md9');
        $('#content-init').removeClass('layui-col-md9');
        $('#content-apply').addClass('layui-col-md12');
        $('#content-checkUsers').addClass('layui-col-md12');
        $('#content-checkAppplications').addClass('layui-col-md12');
        $('#content-needAuthority').addClass('layui-col-md12');
        $('#content-init').addClass('layui-col-md12');
        flag = 1;
      } else {
        $('#user-info').show();
        $('#content-apply').removeClass('layui-col-md12');
        $('#content-checkUsers').removeClass('layui-col-md12');
        $('#content-checkAppplications').removeClass('layui-col-md12');
        $('#content-needAuthority').removeClass('layui-col-md12');
        $('#content-init').removeClass('layui-col-md12');
        $('#content-apply').addClass('layui-col-md9');
        $('#content-checkUsers').addClass('layui-col-md9');
        $('#content-checkAppplications').addClass('layui-col-md9');
        $('#content-needAuthority').addClass('layui-col-md9');
        $('#content-init').addClass('layui-col-md9');
        flag = 0;
      }
    }

    //关闭用户信息窗口
    $('#btn-closeUserInfo').click(toggleUserInfoPanel)

    $('#welcomeUser').click(toggleUserInfoPanel);

    if (roleInfo.role === '0') {
      $('#content-init').hide();
      $('#content-apply').show();
      $('#btn-checkUsers').hide();
      $('#btn-checkApplications').hide();
      $('#btn-needAuthority').hide();
      $('#btn-checkSendAuthority').hide();
      $('#btn-applyAuthenrization').addClass('btn-selected');
      $("#goToAdmin").hide();
      getApplicationInfo();
    } else if (roleInfo.role === '1') {
      $('#content-init').hide();
      $('#content-checkUsers').show();
      $('#btn-checkUsers').addClass('btn-selected');

      $.ajax({
        type: "GET",
        url: ADDRESS_GETJSCYOPENID,
        // async:false,
        data: {
          "lxdh": roleInfo.phone
        },
        success: function (res) {
          if (!res.jscy_openid) {
            layer.alert('尊敬的审核人员，请您点击确认后扫码进入公众号，以完成账号绑定！', {
                title: '关注公众号',
                closeBtn: 0
              },
              function (index) {
                layer.close(index);
                var qrcodeIndex = layer.open({
                  resize: false,
                  type: 2,
                  title: '扫码关注/进入',
                  closeBtn: 0,
                  area: ['320px', '400px'],
                  content: './subscribe.html?lxdh=' + roleInfo.phone,
                });

                var time = setTimeout(checkSubscribeJscy, 5000);

                function checkSubscribeJscy() {
                  $.ajax({
                    type: "GET",
                    url: ADDRESS_GETJSCYOPENID,
                    data: {
                      "lxdh": roleInfo.phone
                    },
                    success: function (res) {
                      if (res.code == '0000' && res.jscy_openid) {
                        layer.close(qrcodeIndex);
                      } else {
                        clearTimeout(time); //清除上一次的定时器，否则会无限开多个
                        setTimeout(checkSubscribeJscy, 5000); //方法中调用定时器实现循环
                      }
                    }
                  });
                }
              }
            );

          }
        }
      });

      getUncheckedUsers();
      $('#btn-checkUsers').show();
      $('#btn-checkApplications').show();
      $('#btn-needAuthority').show();
      $("#goToAdmin").hide();
    } else {
      $('#content-init').hide();
      $('#content-apply').show();
      $('#btn-applyAuthenrization').addClass('btn-selected');
      getApplicationInfo();
    }




    //-------------------------获取用户信息-----------------------------------------//




    //-------------------------用户类型和单位的二级联动------------------------------//


    //------加载项目组信息----------------------//
    loadXmzxxSelect();

    function loadXmzxxSelect() {
      $.ajax({
        url: ADDRESS_XMZXX,
        async: false,
        success: function (data) {
          console.log('get xmzxx success');

          loadSelectOptions($('#select-xmzxx'), data)

          form.render('select', 'xmzxx-filter');
        },
        error: function (err) {
          console.log(err);
        }
      });
    }

    $('#div-xmzxx').hide();
    $('#div-sqrdw').hide();

    //------选择内部人员显示选择项目组信息，甲方用户则填入单位名称----------------------//
    form.on('select(sqrlx-filter)', function (data) {
      console.log($('#select-sqrlx').val());

      if ($('#select-sqrlx').val() === '0') {
        $('#div-xmzxx').hide();
        $('#div-sqrdw').show();
        $('#select-xmzxx').attr({
          'lay-verify': ''
        });
        $('#input-sqrdw').attr({
          'lay-verify': 'required'
        });
      } else if ($('#select-sqrlx').val() === '1') {
        $('#div-sqrdw').hide();
        $('#div-xmzxx').show();
        $('#input-sqrdw').attr({
          'lay-verify': ''
        });
        $('#select-xmzxx').attr({
          'lay-verify': 'required'
        });
      } else {
        $('#div-xmzxx').hide();
        $('#div-sqrdw').hide();
        $('#input-sqrdw').attr({
          'lay-verify': 'required'
        });
        $('#select-xmzxx').attr({
          'lay-verify': 'required'
        });
      }
    });

    //------------------------------所属区域三级联动--------------------------------//

    var provinceData = [];
    var districtData = [];
    var cityData = [];

    loadXzqdmSelect();

    function loadXzqdmSelect() {
      $.ajax({
        url: ADDRESS_XZQDM,
        async: false,
        success: function (dataXzqdm) {
          loadSelectOptions($('#select-ssqydm'), dataXzqdm);
        }
      });
    }
    //--------------------------获取用户信息并显示---------------------------------------------//
    var newUser, sqr, sqrlx, sqrdw, ssqy, lxdh, openid;
    getUserInfo();

    function getQrCode(lxdh) {
      var access_token;
      var ticket;
      $.ajax({
        type: "GET",
        url: ADDRESS_ACCESSTOKEN,
        success: function (res) {
          if (res.code == '0000') {
            access_token = res.access_token;
            var reqTicketData = {
              "access_token": access_token,
              "lxdh": lxdh
            };
            $.ajax({
              type: "POST",
              url: ADDRESS_GETTICKET,
              data: reqTicketData,
              // dataType: "JSON",
              success: function (res) {
                ticket = res.ticket;
                if (ticket) {
                  $('#img-qrcode').attr("src", ADDRESS_QRCODE.replace("TICKET", ticket));
                }
              }
            });
          }

        }
      });
    }

    function getUserInfo() {
      var qrcodeIndex;
      $.ajax({
        url: ADDRESS_GETUSERINFO,
        type: 'GET',
        success: function (userInfo) {
          if (!userInfo.openid && userInfo.newUser !== '1') {
            layer.alert('关注本站公众号获得提醒消息！', {
                title: '关注公众号',
                closeBtn: 0
              },
              function (index) {
                layer.close(index);
                qrcodeIndex = layer.open({
                  resize: false,
                  type: 2,
                  title: '扫码关注',
                  closeBtn: 0,
                  area: ['320px', '400px'],
                  content: './subscribe.html?lxdh=' + userInfo.lxdh,
                });
              }
            );
            var time = setTimeout(checkSubscribe, 5000);

            function checkSubscribe() {
              $.ajax({
                type: "GET",
                url: ADDRESS_GETUSERINFO,
                success: function (res) {
                  if (res.code == '0000' && res.openid) {
                    layer.close(qrcodeIndex);
                  } else {
                    clearTimeout(time); //清除上一次的定时器，否则会无限开多个
                    setTimeout(checkSubscribe, 5000); //方法中调用定时器实现循环
                  }
                }
              });
            }
          }

          console.log('get userinfo success');
          console.log(userInfo);
          $('#input-sqr').val(userInfo.sqr);
          if (userInfo.sqrlx === '甲方用户') {
            $('#input-sqrdw').val(userInfo.sqrdw);
          }
          $('#input-wechat').val(userInfo.wechat);
          $('#input-jsyx').val(userInfo.jsyx);

          if (userInfo.lxdh) {
            $('#input-lxdh').val(userInfo.lxdh);
          } else {
            var phone = roleInfo.phone;
            console.log(phone);

            $('#input-lxdh').val(phone);
          }

          $('#welcomeUser').text('欢迎您，' + userInfo.sqr);

          $(document).click(function () {
            var selectedSsqy = $('#input-ssqy').val();

            if ($('#select-district').val() !== '' && $('#select-province').val() !== '') {
              selectedSsqy = $('#select-district').val();
            } else if ($('#select-city').val() !== '') {
              selectedSsqy = $('#select-city').val();
            } else if ($('#select-province').val() !== '') {
              selectedSsqy = $('#select-province').val();
            } else if ($('#select-province').val() === '') {
              selectedSsqy = userInfo.ssqy;
            }

            $('#input-ssqy').val(selectedSsqy);

          });


          getQrCode($('#input-lxdh').val());

          $('#input-remark').val(userInfo.remark);

          var zt;
          switch (userInfo.zt) {
            case '1':
              zt = '待认证';
              break;
            case '2':
              zt = '初审通过';
              break;
            case '3':
              zt = '复审通过';
              break;
            case '4':
              zt = '认证成功';
              break;
            case '9':
              zt = '认证失败';
              break;

            default:
              break;
          }
          $('#show-zt').text(zt);

          if (zt === '认证成功') {
            $('#btn-addApplication').show();
          }

          sqr = userInfo.sqr;
          sqrlx = userInfo.sqrlx;
          sqrdw = userInfo.sqrdw;
          ssqy = userInfo.ssqy;
          lxdh = userInfo.lxdh;
          openid = userInfo.openid;


          newUser = userInfo.newUser;

          if (newUser === '1') {
            $('#welcomeUser').text('欢迎您，新用户');
            $('#btn-submitUserInfo').text('创建用户');
            $('.uneditable').addClass('layui-disabled');
            $('.uneditable').attr({
              disabled: 'disabled'
            });
          } else {
            $('#btn-reset').hide();
            $('#welcomeUser').text('欢迎您，' + userInfo.sqr);
            $('.uneditable').addClass('layui-disabled');
            $('.uneditable').attr({
              disabled: 'disabled'
            });
            $('#btn-submitUserInfo').text('更新信息');
            $('#div-zt').show();
          }

          //ssqy根据sqdj里面的xmddm来 2018/06/25
          $("#select-ssqydm option").each(function () {
            if ($(this).val() === userInfo.ssqy) {
              $(this).attr('selected', true);
              form.render('select', 'select-ssqy-filter');
            }
          });

          if ($('#input-ssqy').val() !== '') {
            $('#select-province').attr({
              'lay-verify': ''
            });
          }

          $("#select-sqrlx option").each(function () {
            if ($(this).text() === userInfo.sqrlx) {
              $(this).attr('selected', true);
              form.render('select', 'select-sqrlx-filter');
            }
          });

          $("#select-xmzxx option").each(function () {
            if ($(this).text() === userInfo.sqrdw) {
              $(this).attr('selected', true);
              form.render('select', 'xmzxx-filter');
            }
          });


          if ($('#select-sqrlx').val() === '0') {
            $('#div-xmzxx').hide();
            $('#div-sqrdw').show();
            $('#select-xmzxx').attr({
              'lay-verify': ''
            });
            $('#input-sqrdw').attr({
              'lay-verify': 'required'
            });
          } else if ($('#select-sqrlx').val() === '1') {
            $('#div-sqrdw').hide();
            $('#div-xmzxx').show();
            $('#input-sqrdw').attr({
              'lay-verify': ''
            });
            $('#select-xmzxx').attr({
              'lay-verify': 'required'
            });
          } else {
            $('#div-sqrdw').hide();
            $('#div-xmzxx').hide();
            $('#input-sqrdw').attr({
              'lay-verify': 'required'
            });
            $('#select-xmzxx').attr({
              'lay-verify': 'required'
            });
          }
          form.render('select');

          //-----------------去除非selected layui-this类-----------------------------//
          var xmzxxOptions = $('#select-xmzxx').next().children('dl').children();
          console.log(xmzxxOptions);
          $(xmzxxOptions).each(function () {
            if ($(this).text() !== $('#select-xmzxx option:selected').text()) {
              $(this).removeClass('layui-this');
            }
          });

        },
        error: function (err) {
          console.log(err);
        }
      });
    }

    //----------------------重置用户信息-----------------------------//
    $('#btn-reset').click(function () {
      $('#input-sqr').val('');
      $('#select-sqrlx').val('');
      $('#input-sqrdw').val('');
      $('#select-xmzxx').val('');
      $('#input-wechat').val('');
      $('#input-jsyx').val('');
      $('#select-ssqydm').val('');
      form.render('select');
    })




    //------------------------------提交用户信息-----------------------------------------//
    form.on('submit(formUserInfo)', function (data) {
      var reqOpenidData = {
        "lxdh": $('#input-lxdh').val()
      };

      $.ajax({
        type: "GET",
        url: ADDRESS_TEMPOPENID,
        data: reqOpenidData,
        async: false,
        success: function (response) {
          console.log(response);

          if (!response.OPENID && $('#btn-submitUserInfo').text() == '创建用户') {
            layer.alert('请您关注本站公众号！')
          } else {
            var reqDataUserInfo = {
              "sqr": $('#input-sqr').val(),
              "sqrlx": $('#select-sqrlx').val(),
              "wechat": $('#input-wechat').val(),
              "jsyx": $('#input-jsyx').val(),
              "ssqy": $('#select-ssqydm').val(),
              "lxdh": $('#input-lxdh').val(),
              "openid": response.OPENID,
              'remark': $('#input-remark').val()
            };

            console.log(reqDataUserInfo);


            if (sqrlx === '甲方用户') {
              sqrlx = '0';
            } else if (sqrlx === '内部用户') {
              sqrlx = '1';
            }

            if (reqDataUserInfo.sqrlx === '1') {
              reqDataUserInfo.sqrdw = $('#div-xmzxx .layui-this').text();
            } else {
              reqDataUserInfo.sqrdw = $('#input-sqrdw').val();
            }

            console.log(sqr);
            console.log(reqDataUserInfo.sqr);
            console.log(sqrlx);
            console.log(reqDataUserInfo.sqrlx);
            console.log(sqrdw);
            console.log(reqDataUserInfo.sqrdw);
            console.log(ssqy);
            console.log(reqDataUserInfo.ssqy);

            if (newUser === '1') {
              submitUserInfo();
            } else if (reqDataUserInfo.sqr !== sqr || reqDataUserInfo.sqrlx !== sqrlx || reqDataUserInfo.sqrdw !== sqrdw || reqDataUserInfo.ssqy !== ssqy) {
              reqDataUserInfo.updateUser = '1';
              layer.alert('更改了重要信息，您的账号需要进行重新认证！', {
                title: '更改信息'
              }, function () {
                $('#btn-addApplication').hide();
                $('#welcomeUser').text('欢迎您，' + reqDataUserInfo.sqr);
                submitUserInfo();
              });
            } else {
              reqDataUserInfo.updateUser = '0';
              submitUserInfo();
            }

            console.log(reqDataUserInfo);

            function submitUserInfo() {
              $.ajax({
                url: ADDRESS_SUBMITUSERINFO,
                type: 'POST',
                data: reqDataUserInfo,
                success: function (res, status) {
                  if (newUser === '1') {
                    $('#welcomeUser').text('欢迎您，' + reqDataUserInfo.sqr);
                    layer.msg('创建用户成功', {
                      time: 1000
                    });
                    $('#btn-submitUserInfo').text('更新信息');
                    $('.uneditable').addClass('layui-disabled');
                    $('.uneditable').attr({
                      disabled: 'disabled'
                    });
                    $('#btn-reset').hide();

                    newUser = '0';

                  } else {
                    layer.msg('更新用户信息成功', {
                      time: 1000
                    });
                  }

                  $.ajax({
                    url: ADDRESS_GETUSERINFO,
                    type: 'GET',
                    success: function (userInfo) {
                      var zt;
                      switch (userInfo.zt) {
                        case '1':
                          zt = '待认证';
                          break;
                        case '2':
                          zt = '初审通过';
                          break;
                        case '3':
                          zt = '复审通过';
                          break;
                        case '4':
                          zt = '认证成功';
                          break;
                        case '9':
                          zt = '认证失败';
                          break;

                        default:
                          break;
                      }

                      $('#div-zt').show();
                      $('#show-zt').text(zt);


                      sqr = userInfo.sqr;
                      sqrlx = userInfo.sqrlx;
                      sqrdw = userInfo.sqrdw;
                      ssqy = userInfo.ssqy;
                      lxdh = userInfo.lxdh;
                    },
                    error: function (err) {
                      console.log(err);
                    }
                  });
                },
                error: function (err) {
                  console.log(err);
                }
              });
            }
          }
        },
        error: function (err) {
          console.log(err);

        }
      });

      return false
    });



    //-----------------------------新建申请----------------------------------------------//
    $('#btn-addApplication').click(function () {
      if (sqrlx === '甲方用户') {
        layer.open({
          resize: false,
          type: 2,
          title: '申请授权',
          area: ['60%', '90%'],
          content: './apply.html?sfnb=0',
          end: function () {
            // layr.msg('申请完成，请等待审核');
            getApplicationInfo();
          },
        });
      } else {
        layer.open({
          resize: false,
          type: 2,
          title: '申请授权',
          area: ['60%', '90%'],
          content: './apply.html?sfnb=1',
          end: function () {
            // layr.msg('申请完成，请等待审核');
            getApplicationInfo();
          },
        });
        // window.location.href = 'applyNB.html';
      }

    });



    //-----------------------用户申请历史数据的展示---------------------------------------//
    function getApplicationInfo() {
      var columnsApplication = [];
      $('#shztFilter').val('');
      if (sqrlx === '甲方用户') {
        columnsApplication = [{
            field: 'index',
            title: '主键',
            visible: false
          }, {
            field: 'cpmc',
            title: '产品名称',
            sortable: true,
            align: 'center'
          }, {
            field: 'sqlx',
            title: '授权类型',
            sortable: true,
            align: 'center',
            formatter: function (value, row, index) {
              switch (value) {
                case '1':
                  return '单机授权'
                  break;
                case '2':
                  return '服务器授权'
                  break;
                default:
                  break;
              }
            }
          },
          {
            field: 'swhtmc',
            title: '合同名称',
            sortable: true,
            align: 'center'
          }, {
            field: 'swlxr',
            title: '商务联系人',
            sortable: true,
            align: 'center'
          }, {
            field: 'jmg',
            title: '使用加密狗',
            visible: false,
            formatter: function (value, row, index) {
              switch (value) {
                case '0':
                  return '否'
                  break;
                case '1':
                  return '是'
                  break;
                default:
                  break;
              }
            }
          },
          {
            field: 'xzqdm',
            title: '行政区',
            visible: false
          },
          {
            field: 'sqsl',
            title: '数量',
            sortable: true,
            align: 'center'
          }, {
            field: 'sqxks',
            title: '许可数',
            sortable: true,
            visible: false
          }, {
            field: 'jzsj',
            title: '截止时间',
            visible: false
          }, {
            field: 'sqxlm',
            title: '授权序列码',
            visible: false
          }, {
            field: 'xmddm',
            title: '项目点代码',
            visible: false
          }, {
            field: 'shzt',
            title: '审核状态',
            sortable: true,
            align: 'center'
          }, {
            field: 'bllc',
            title: '办理流程',
            align: 'center'
          }, {
            field: 'operation',
            title: '操作',
            align: 'center',
            formatter: function (value, row, index) {
              if (row.shzt !== '申请成功' && row.shzt !== '不予办理') {
                var revoke = '<button class="layui-btn layui-btn-xs btn-revoke" onclick="revokeApplication(' + '\'' + row.index + '\'' + ',' + '\'' + row.shzt + '\'' + ')">撤销申请</button>';
                return revoke;
              }
            }
          }
        ];
      } else {
        columnsApplication = [{
            field: 'index',
            title: '主键',
            visible: false
          }, {
            field: 'cpmc',
            title: '产品名称',
            sortable: true,
            align: 'center',
            width: 400
          }, {
            field: 'sqlx',
            title: '授权类型',
            sortable: true,
            align: 'center',
            width: 100,
            formatter: function (value, row, index) {
              switch (value) {
                case '1':
                  return '单机授权'
                  break;
                case '2':
                  return '服务器授权'
                  break;
                default:
                  break;
              }
            }
          },
          {
            field: 'jmg',
            title: '使用加密狗',
            visible: false,
            formatter: function (value, row, index) {
              switch (value) {
                case '0':
                  return '否'
                  break;
                case '1':
                  return '是'
                  break;
                default:
                  break;
              }
            }
          },
          {
            field: 'xzqdm',
            title: '行政区',
            visible: false
          },
          {
            field: 'sqsl',
            title: '数量',
            sortable: true,
            align: 'center',
            width: 100,
          }, {
            field: 'sqxks',
            title: '许可数',
            sortable: true,
            visible: false
          }, {
            field: 'jzsj',
            title: '截止时间',
            visible: false
          }, {
            field: 'sqsj',
            title: '申请时间',
            align: 'center',
            visible: true,
            width: 100,
          }, {
            field: 'bljssj',
            title: '办理时间',
            align: 'center',
            visible: true,
            width: 100,
          }, {
            field: 'sqxlm',
            title: '授权序列码',
            visible: false
          }, {
            field: 'xmddm',
            title: '项目点代码',
            visible: false
          }, {
            field: 'shzt',
            title: '审核状态',
            sortable: true,
            align: 'center',
            width: 100,
          }, {
            field: 'bllc',
            title: '办理流程',
            align: 'center',
            width: 100,
            formatter: function (value, row, index) {
              // var flowchart = '<button class="layui-btn layui-btn-xs btn-flowchart" onclick="openFlowchart(\'' + row.index + '\')">流程图</button>';
              var flowchart = "<button class='layui-btn layui-btn-xs btn-flowchart' onclick='openFlowchart(" + JSON.stringify(row) + ")'>流程图</button>";
              return flowchart;
            }
          }, {
            field: 'operation',
            title: '操作',
            align: 'center',
            width: 100,
            formatter: function (value, row, index) {
              // var revoke = '<button class="layui-btn layui-btn-xs btn-revoke" onclick="revokeApplication(\'' + row.index + '\')">撤销申请</button>';
              // return revoke;
              if (row.shzt !== '申请成功' && row.shzt !== '不予办理') {
                var revoke = '<button class="layui-btn layui-btn-xs btn-revoke" onclick="revokeApplication(' + '\'' + row.index + '\'' + ',' + '\'' + row.shzt + '\'' + ')">撤销申请</button>';
                return revoke;
              }
            }
          }
        ];
      }


      $('#applyHistoryTable').bootstrapTable({
        striped: true,
        detailView: false,
        pageIndex: 0,
        pagination: true,
        pageSize: parseInt(($(window).height() - 300) / 35, 10) - 1,
        // search: true,
        columns: columnsApplication,
        sortName: 'sqsj', // 要排序的字段
        sortOrder: 'desc', // 排序规则
      });

      var reqDataHistoryInfo = {
        "shzt": "",
        "page": "1",
        "pageSize": "1000"
      };
      var indexLoading = layer.load(1);

      $.ajax({
        url: ADDRESS_USERHISTORY,
        type: 'GET',
        data: reqDataHistoryInfo,
        success: function (res) {
          layer.close(indexLoading);
          console.log(res);
          if (res.code === undefined) {
            $('#applyHistoryTable').bootstrapTable('load', res);
          } else if (res.code === '9999') {
            layer.alert(res.msg);
          } else {
            layer.msg(res.msg, {
              time: 1000
            });
          }
        },
        error: function (err) {
          console.log(err);
        }
      });
    }

    openFlowchart = function (row) {

      var reqData = {
        "cpdm": row.cpdm,
        "xmddm": row.xmddm,
        "user_index": row.user_index
      };
      $.ajax({
        type: "GET",
        url: ADDRESS_FLOWCHART,
        data: reqData,
        success: function (res) {
          console.log(res);

          if (!res.hdr) {
            res.sfnb = '1';
          } else {
            res.sfnb = '0';
          }
          res.shzt = row.shzt;

          if (row.bz) {
            res.bz = row.bz;
          }

          window.sessionStorage["flowchart"] = JSON.stringify(res);
          layer.open({
            resize: false,
            type: 2,
            title: '流程图',
            area: ['600px', '90%'],
            content: './flowchart.html'
          });

        }
      });
    }

    revokeApplication = function (index, shzt) {
      layer.confirm('确定撤销此申请？', function (idx) {
        var reqDataRevoke = {
          'index': index,
          'shzt': shzt
        };
        $.ajax({
          url: ADDRESS_REVOKEAPPLICATION,
          type: 'POST',
          data: reqDataRevoke,
          success: function (res) {
            console.log(res);
            if (res.code === '0000') {
              $("#applyHistoryTable").bootstrapTable('remove', {
                field: 'index',
                values: [index]
              });
              layer.msg('撤销申请成功！');
            } else {
              layer.alert(res.msg);
            }
          },
          error: function (err) {
            layer.alert(err.msg);
          }
        });
        layer.close(idx);
      });
    };

    $('.myTable').on('click-row.bs.table', function (e, row, element) {
      $('.mySelected').removeClass('mySelected');
      $(element).addClass('mySelected');
    });

    //获取详细历史申请信息
    $('#applyHistoryTable').on('dbl-click-row.bs.table', function (e, row, element) {
      console.log(element);

      $('.mySelected').removeClass('mySelected');
      $(element).addClass('mySelected');

      console.log(row);
      var historyDetails = JSON.stringify(row);
      window.sessionStorage["historyDetails"] = historyDetails;
      // if (sqrlx === '甲方用户') {
      //   window.sessionStorage["sqrlx"] = '0';
      // } else {
      //   window.sessionStorage["sqrlx"] = '1';  
      // }

      layer.open({
        resize: false,
        type: 2,
        title: '详细信息',
        area: ['55%', '90%'],
        content: './history_details.html'
      });
    });

    //筛选审核状态
    form.on('select(shztFilter)', function () {
      // $('#btn-shztFilter').click(function () {
      var shzt = $('#shztFilter').val();
      var reqDataShztFilter = {
        'shzt': shzt,
        'page': '1',
        'pageSize': '1000'
      }

      $.ajax({
        url: ADDRESS_USERHISTORY,
        type: 'GET',
        data: reqDataShztFilter,
        success: function (res) {
          console.log(res);
          if (res.code) {
            layer.msg(res.msg, {
              time: 1000
            });
            $('#applyHistoryTable').bootstrapTable('removeAll');
          } else {
            $('#applyHistoryTable').bootstrapTable('load', res);
          }
        },
        error: function (err) {
          console.log(err);
        }
      });
    });

    //------加载select选项的函数，利用handlebars进行渲染----------------------//
    function loadSelectOptions($selector, data) {
      var options = [];
      var tpl;
      $.each(data, function (idx, obj) {
        options.push({
          mc: obj.mc,
          dm: obj.dm
        });
      });

      //如果为所属区域，option的label里外加代码
      if (data[0].dm.length === 6) {
        tpl = $("#select-ssqy-tpl").html();
      } else {
        tpl = $("#select-tpl").html();
      }


      var rendered = RenderData(tpl, {
        option: options
      });
      $selector.empty();
      $selector.append('<option value="">请选择</option>');
      $selector.append(rendered);

      //用layui form的时候这句很重要，动态加载完数据后，需要重新渲染
      // form.render('select');
      // form.render('select', 'select-ssqy-filter');
    }

    function RenderData(tpl, data) {

      var template = Handlebars.compile(tpl);
      return template(data);
    }
    //----------------------------------------------------------------------------------//


    //-------------------------------用户退出-----------------------------------//
    $('#logout').click(function () {
      $.ajax({
        url: ADDRESS_LOGOUT,
        type: 'GET',
        success: function (res) {
          console.log(res);
          window.location.href = './';
        },
        error: function (err) {
          console.log(err);

        }
      });
    });



    //---------------------------------------审核部分--------------------------------//


    $('#btn-applyAuthenrization').click(function () {
      $('#content-apply').show();
      $('#content-checkUsers').hide();
      $('#content-checkAppplications').hide();
      $('#content-needAuthority').hide();
      $('#content-sendAuthority').hide();
      $('#content-init').hide();
      if ($('.btn-side').hasClass('btn-selected')) {
        $('.btn-side').removeClass('btn-selected');
      }
      $(this).addClass('btn-selected');
      getApplicationInfo();
    });

    $('#btn-checkUsers').click(function () {
      $('#content-apply').hide();
      $('#content-checkUsers').show();
      $('#content-checkAppplications').hide();
      $('#content-sendAuthority').hide();
      $('#content-needAuthority').hide();
      $('#content-init').hide();
      if ($('.btn-side').hasClass('btn-selected')) {
        $('.btn-side').removeClass('btn-selected');
      }
      $(this).addClass('btn-selected');
      getUncheckedUsers();
    });

    $('#btn-checkApplications').click(function () {
      $('#content-apply').hide();
      $('#content-checkUsers').hide();
      $('#content-needAuthority').hide();
      $('#content-sendAuthority').hide();
      $('#content-checkAppplications').show();
      $('#content-init').hide();
      if ($('.btn-side').hasClass('btn-selected')) {
        $('.btn-side').removeClass('btn-selected');
      }
      $(this).addClass('btn-selected');
      getUncheckedApplications();
    });

    $('#btn-needAuthority').click(function () {
      $('#content-apply').hide();
      $('#content-checkUsers').hide();
      $('#content-checkAppplications').hide();
      $('#content-sendAuthority').hide();
      $('#content-needAuthority').show();
      $('#content-init').hide();
      if ($('.btn-side').hasClass('btn-selected')) {
        $('.btn-side').removeClass('btn-selected');
      }
      $(this).addClass('btn-selected');
      getNeedAuthority();
    });

    $('#btn-checkSendAuthority').click(function () {
      $('#content-apply').hide();
      $('#content-checkUsers').hide();
      $('#content-checkAppplications').hide();
      $('#content-needAuthority').hide();
      $('#content-sendAuthority').show();
      $('#content-init').hide();
      if ($('.btn-side').hasClass('btn-selected')) {
        $('.btn-side').removeClass('btn-selected');
      }
      $(this).addClass('btn-selected');
      // getNeedAuthority();
      getSendAuthority();
    });

    //----------------------- 加载待发送授权申请信息------------------------//
    function getSendAuthority() {
      var columnsSendAuthority = [{
        field: 'sqr',
        title: '申请人',
        sortable: true,
        align: 'center'
      }, {
        field: 'sqrdw',
        title: '单位名称',
        sortable: true,
        align: 'center'
      }, {
        field: 'lxdh',
        title: '联系电话',
        align: 'center'
      }, {
        field: 'sqsl',
        title: '申请数量',
        align: 'center'
      }, {
        field: 'money',
        title: '总金额/元',
        align: 'center'
      }, {
        field: 'operation',
        title: '操作',
        align: 'center',
        formatter: function (value, row, index) {
          var allow = "<button class='layui-btn layui-btn-xs btn-allow' onclick='allowSend(" + JSON.stringify(row) + ")'>确认邮寄</button>";
          var refuse = "<button class='layui-btn layui-btn-xs layui-btn-danger btn-refuse' onclick='refuseSend(" + JSON.stringify(row) + ")'>拒绝邮寄</button>";
          return allow + refuse;
        }
      }];

      var indexLoading = layer.load(1);

      $.ajax({
        url: ADDRESS_NEEDSENDAUTHORITY,
        type: 'GET',
        success: function (res, code) {
          layer.close(indexLoading);
          console.log(res);

          if (!res.code) {
            $('#sendAuthorityTable').bootstrapTable({
              striped: true,
              detailView: false,
              pageIndex: 0,
              pagination: true,
              pageSize: parseInt(($(window).height() - 300) / 35, 10) - 1,
              search: true,
              columns: columnsSendAuthority
            });
            $('#sendAuthorityTable').bootstrapTable('load', res);
          } else {
            $('#btn-exportXls').hide();
            layer.alert(res.msg);
          }
        }
      })

      allowSend = function (row) {
        layer.open({
          resize: false,
          type: 1,
          title: '发送授权',
          area: ['400px', '30%'],
          content: $('#div-allowSendAuthority').html(),
          btn: ['确定', '取消'],
          yes: function (idx) {
            var postNumber = $('.layui-layer #input-postnumber').val();
            console.log(postNumber);
            if (postNumber) {
              layer.alert('确认发送授权！', function () {
                var reqDataSendAuthority = {
                  "index": row.index,
                  "sftg": "1",
                  "shyj": "",
                  "xmddm": row.xzqdm,
                  "postnumber": postNumber,
                };
                console.log(reqDataSendAuthority);

                $.ajax({
                  url: ADDRESS_CHECKEDSENDAUTHORITY,
                  type: 'POST',
                  data: reqDataSendAuthority,
                  success: function (res) {
                    console.log(res);
                    if (res.code === '0000') {
                      layer.msg('此用户审核完成！', {
                        time: 1000,
                        end: function () {
                          getSendAuthority();

                          var reqSaveRzjlData = {
                            "sqxx_index": row.index,
                            "bljg": "1",
                            "bz": "无",
                            "blzt": "发送授权"
                          };
                          $.ajax({
                            type: "POST",
                            url: ADDRESS_SAVERZJL,
                            data: reqSaveRzjlData,
                            success: function (response) {
                              console.log(response);
                            }
                          });

                        }
                      });
                    } else if (res.msg) {
                      layer.alert(res.msg);
                    }

                    layer.close(idx);

                  },
                  error: function (err) {
                    console.log(err);
                  }
                });
              });
            } else {
              layer.alert('请填写邮寄单号！')
            }
          }
        })
      }

      refuseSend = function (row) {
        $.ajax({
          url: ADDRESS_USERREJECTREASON,
          type: 'GET',
          async: false,
          success: function (res) {
            $('#select-shyj').empty();
            $('#select-shyj').append('<option value="" disabled="disabled">请选择</option>')
            for (var i = 0; i < res.length; i++) {
              $('#select-shyj').append('<option value="' + res[i] + '">' + res[i] + '</option>');
            }
            $('#select-shyj').append('<option value="其它意见" selected="selected">其它意见</option>');
          }
        });
        layer.open({
          resize: false,
          type: 1,
          title: '拒绝发送授权',
          area: ['30%', '50%'],
          content: $('#div-refuseShyj').html(),
          btn: ['拒绝发送', '取消'],
          end: function () {
            // layer.msg('审核此用户完成！');
          },
          yes: function (idx) {
            var shyj;
            var otherShyj = $('.layui-layer .refuseShyj textarea').val().trim();
            var commonShyj = $('.layui-layer .select-refuseshyj').find("option:selected").text();
            if (commonShyj === '请选择' || commonShyj === '其它意见') {
              if (otherShyj === '') {
                layer.alert("请填写拒绝理由！");
              } else {
                shyj = otherShyj;
              }
            } else if (otherShyj === '') {
              shyj = commonShyj;
            } else {
              shyj = commonShyj + ',' + otherShyj;
            }

            if (shyj) {
              var reqDataSendAuthority = {
                "index": row.index,
                "sftg": "0",
                "shyj": shyj,
                "xmddm": row.xzqdm
              };

              console.log(reqDataSendAuthority);

              $.ajax({
                url: ADDRESS_CHECKEDSENDAUTHORITY,
                type: 'POST',
                data: reqDataSendAuthority,
                success: function (res) {
                  console.log(res);
                  if (res.code === '0000') {
                    layer.msg('审核是否发送授权完成！', {
                      time: 1000,
                      end: function () {
                        getSendAuthority();
                        var reqSaveRzjlData = {
                          "sqxx_index": row.index,
                          "bljg": "0",
                          "bz": shyj,
                          "blzt": "发送授权"
                        };
                        $.ajax({
                          type: "POST",
                          url: ADDRESS_SAVERZJL,
                          data: reqSaveRzjlData,
                          success: function (response) {
                            console.log(response);
                          }
                        });
                      }
                    });
                  } else if (res.msg) {
                    layer.alert(res.msg);
                  }
                  layer.close(idx);

                },
                error: function (err) {
                  console.log(err);
                  layer.close(idx);

                }
              });
            }
          }
        });
      }


    }

    $('#sendAuthorityTable').on('dbl-click-row.bs.table', function (e, row, element) {
      console.log(row);

      $('.mySelected').removeClass('mySelected');
      $(element).addClass('mySelected');

      var checkDetails = JSON.stringify(row);
      window.sessionStorage["checkDetails"] = checkDetails;

      layer.open({
        resize: false,
        type: 2,
        title: '',
        area: ['55%', '90%'],
        content: './post_details.html',
        end: function () {
          getSendAuthority();
        }
      });
    });


    $('#btn-exportXls').click(function () {
      $('#sendAuthorityTable').tableExport({
        type: 'excel',
        fileName: '加密狗审核信息' + date.getFullYear() + (date.getMonth() + 1) + date.getDate(),
        ignoreColumn: [5]
      });
    })


    //------------------------加载未认证用户信息---------------------------//

    function getUncheckedUsers() {

      var columnsUncheckedUsers = [{
          field: 'index',
          title: '主键',
          visible: false
        }, {
          field: 'xzqdm',
          title: '行政区代码',
          sortable: true,
          align: 'center'
        }, {
          field: 'dwmc',
          title: '单位名称',
          sortable: true,
          align: 'center'
        },
        {
          field: 'yhm',
          title: '用户名',
          sortable: true,
          align: 'center'
        },
        {
          field: 'lxdh',
          title: '联系电话',
          sortable: true,
          align: 'center'
        }, {
          field: 'wechat',
          title: '微信号',
          sortable: true,
          align: 'center'
        }, {
          field: 'sfgzgzh',
          title: '关注公众号',
          align: 'center'
        }, {
          field: 'remark',
          title: '备注',
          align: 'center'
        }, {
          field: 'rzzt',
          title: '认证状态',
          sortable: true,
          align: 'center',
          formatter: function (value, row, index) {
            switch (value) {
              case '1':
                return '待认证';
                break;
              case '2':
                return '初审通过';
                break;
              case '3':
                return '复审通过';
                break;
              case '4':
                return '认证成功';
                break;
              case '9':
                return '认证失败';
                break;

              default:
                break;
            }
          }
        }, {
          field: 'operation',
          title: '操作',
          align: 'center',
          formatter: function (value, row, index) {
            var allow = "<button class='layui-btn layui-btn-xs btn-allow' onclick='allowUsers(" + JSON.stringify(row) + ")'>通过认证</button>";
            var refuse = "<button class='layui-btn layui-btn-xs layui-btn-danger btn-refuse' onclick='refuseUsers(" + JSON.stringify(row) + ")'>拒绝认证</button>";
            return allow + refuse;
          }
        }
      ];

      var indexLoading = layer.load(1);

      $.ajax({
        url: ADDRESS_UNCHECKEDUSERS,
        type: 'GET',
        // async:false,
        success: function (res, code) {
          layer.close(indexLoading);
          console.log(res);
          if (res.msg && !res.code) {
            layer.msg(res.msg, {
              time: 1000
            });
          }
          if (res.code === undefined) {
            $('#uncheckedUsersTable').bootstrapTable({
              striped: true,
              detailView: false,
              pageIndex: 0,
              pagination: true,
              pageSize: parseInt(($(window).height() - 300) / 35, 10) - 1,
              search: true,
              columns: columnsUncheckedUsers
            });
            $('#uncheckedUsersTable').bootstrapTable('load', res);
          } else if (res.code === '20022') {
            layer.msg(res.msg, {
              time: 1000
            });
            $('#uncheckedUsersTable').bootstrapTable({
              striped: true,
              detailView: false,
              pageIndex: 0,
              pagination: true,
              pageSize: parseInt(($(window).height() - 300) / 35, 10) - 1,
              search: true,
              columns: columnsUncheckedUsers
            });
            $('#uncheckedUsersTable').bootstrapTable('removeAll');
          } else {
            layer.alert(res.msg);
          }

        },
        error: function (err) {
          console.log(err);
        }
      });
    }

    $('#btn-queryUser').click(function () {

    });




    allowUsers = function (row) {

      layer.alert('确认通过此用户认证！', {
        title: '通过认证'
      }, function () {
        var reqDataCheckUsers = {
          "index": row.index,
          "sftg": "1",
          "shyj": "",
          "xmddm": row.xzqdm
        };
        console.log(reqDataCheckUsers);

        $.ajax({
          url: ADDRESS_CHECKEDUSERS,
          type: 'POST',
          data: reqDataCheckUsers,
          success: function (res) {
            console.log(res);
            if (res.code === '0000') {
              layer.msg('此用户审核完成！', {
                time: 1000,
                end: getUncheckedUsers
              });
              // getUncheckedUsers();
            } else if (res.msg) {
              layer.alert(res.msg);
            }
          },
          error: function (err) {
            console.log(err);
          }
        });
      });
    }


    refuseUsers = function (row) {
      $.ajax({
        url: ADDRESS_USERREJECTREASON,
        type: 'GET',
        async: false,
        success: function (res) {
          $('#select-shyj').empty();
          $('#select-shyj').append('<option value="" disabled="disabled">请选择</option>')
          for (var i = 0; i < res.length; i++) {
            $('#select-shyj').append('<option value="' + res[i] + '">' + res[i] + '</option>');
          }
          $('#select-shyj').append('<option value="其它意见" selected="selected">其它意见</option>');
        }
      });
      layer.open({
        resize: false,
        type: 1,
        title: '拒绝认证',
        area: ['30%', '50%'],
        content: $('#div-refuseShyj').html(),
        btn: ['拒绝认证', '取消'],
        end: function () {
          // layer.msg('审核此用户完成！');
        },
        yes: function (idx) {
          var shyj;
          var otherShyj = $('.layui-layer .refuseShyj textarea').val().trim();
          var commonShyj = $('.layui-layer .select-refuseshyj').find("option:selected").text();
          if (commonShyj === '请选择' || commonShyj === '其它意见') {
            if (otherShyj === '') {
              layer.alert("请填写拒绝理由！");
            } else {
              shyj = otherShyj;
            }
          } else if (otherShyj === '') {
            shyj = commonShyj;
          } else {
            shyj = commonShyj + ',' + otherShyj;
          }

          if (shyj) {
            var reqDataCheckUsers = {
              "index": row.index,
              "sftg": "0",
              "shyj": shyj,
              "xmddm": row.xzqdm
            };

            console.log(reqDataCheckUsers);

            $.ajax({
              url: ADDRESS_CHECKEDUSERS,
              type: 'POST',
              data: reqDataCheckUsers,
              success: function (res) {
                console.log(res);
                if (res.code === '0000') {
                  layer.msg('审核此用户完成！', {
                    time: 1000,
                    end: getUncheckedUsers
                  });
                  // getUncheckedUsers();
                } else if (res.msg) {
                  layer.alert(res.msg);
                }
                layer.close(idx);

              },
              error: function (err) {
                console.log(err);
                layer.close(idx);

              }
            });
          }

          // layer.close(idx);
        }
      });
    }

    //----------------------------------审核申请信息-----------------------------------//

    function getUncheckedApplications() {
      var columnsUncheckedApplications = [{
          field: 'yhm',
          title: '用户名',
          sortable: true,
          align: 'center'
        }, {
          field: 'dwmc',
          title: '单位名称',
          sortable: true,
          align: 'center'
        }, {
          field: 'cpmc',
          title: '软件名称',
          sortable: true,
          align: 'center',
          width: 400
        }, {
          field: 'sqlx',
          title: '授权类型',
          sortable: true,
          align: 'center',
          formatter: function (value, row, index) {
            switch (value) {
              case '1':
                return '单机授权'
                break;
              case '2':
                return '服务器授权'
                break;
              default:
                break;
            }
          }
        }, {
          field: 'swhtmc',
          title: '商务合同名称',
          sortable: true,
          align: 'center'
        }, {
          field: 'swlxr',
          title: '商务联系人',
          sortable: true,
          align: 'center'
        }, {
          field: 'xzqdm',
          title: '授权地区',
          visible: false
        }, {
          field: 'lxdh',
          title: '联系电话',
          visible: false
        }, {
          field: 'index',
          title: '申请信息主键',
          visible: false
        }, {
          field: 'sqxks',
          title: '许可数',
          visible: false
        },
        {
          field: 'jmg',
          title: '加密狗',
          visible: false,
          formatter: function (value, row, index) {
            switch (value) {
              case '0':
                return '否'
                break;
              case '1':
                return '是'
                break;
              default:
                break;
            }
          }
        }, {
          field: 'sqsl',
          title: '数量',
          visible: false
        }, {
          field: 'jzsj',
          title: '截止时间',
          sortable: true,
          align: 'center',
          visible: false
        }, {
          field: 'sqsj',
          title: '申请时间',
          visible: false
        }, {
          field: 'sqxlm',
          title: '授权序列码',
          visible: false
        },
        {
          field: 'xmjzsj',
          title: '项目截止时间',
          sortable: true,
          visible: false
        }, {
          field: 'blzt',
          title: '办理状态',
          visible: false,
          formatter: function (value, row, index) {
            switch (value) {
              case '1':
                return '待认证'
                break;
              case '2':
                return '待审核'
                break;
              case '3':
                return '初审通过'
                break;
              case '4':
                return '复审通过'
                break;
              case '5':
                return '审核通过'
                break;
              case '6':
                return '在线授权失败'
                break;
              case '7':
                return '在线授权成功'
                break;
              case '8':
                return '申请成功'
                break;
              case '9':
                return '不予办理'
                break;
              case '10':
                return '发送邮件失败'
                break;
              default:
                break;
            }
          }
        },
        {
          field: 'operation',
          title: '操作',
          align: 'center',
          formatter: function (value, row, index) {
            var allow = "<button class='layui-btn layui-btn-xs btn-allow' onclick='allowApplications(" + JSON.stringify(row) + ")'>通过认证</button>";
            var refuse = "<button class='layui-btn layui-btn-xs layui-btn-danger btn-refuse' onclick='refuseApplications(" + JSON.stringify(row) + ")'>拒绝认证</button>";
            return allow + refuse;
          }
        }
      ];

      if (roleInfo.role === '5') {
        var checkBox = {
          checkbox: true
        };
        columnsUncheckedApplications = columnsUncheckedApplications.filter(item => item.field != 'swhtmc' && item.field != 'swlxr');
        var jzsjField = columnsUncheckedApplications.filter(item => item.field === 'jzsj');
        jzsjField[0].visible = true;
        var xzqdmField = columnsUncheckedApplications.filter(item => item.field === 'xzqdm');
        xzqdmField[0].visible = true;
        columnsUncheckedApplications.unshift(checkBox);
        $('.btn-batch-allow').show();
      }

      var indexLoading = layer.load(1);

      $.ajax({
        url: ADDRESS_UNCHECKEDAPPLICATIONS,
        type: 'GET',
        success: function (res) {
          layer.close(indexLoading);
          console.log(res);
          if (res.msg && !res.code) {
            layer.msg(res.msg, {
              time: 1000
            });
          }
          if (res.code === undefined) {
            $('#uncheckedApplicationsTable').bootstrapTable({
              striped: true,
              detailView: false,
              pageIndex: 0,
              pagination: true,
              pageSize: parseInt(($(window).height() - 300) / 35, 10) - 1,
              search: true,
              columns: columnsUncheckedApplications,
              sortName: 'sqsj', // 要排序的字段
              sortOrder: 'asc', // 排序规则              
            });
            $('#uncheckedApplicationsTable').bootstrapTable('load', res);
          } else if (res.code === '20022') {
            layer.msg(res.msg, {
              time: 1000
            });
            $('#uncheckedApplicationsTable').bootstrapTable({
              striped: true,
              detailView: false,
              pageIndex: 0,
              pagination: true,
              pageSize: parseInt(($(window).height() - 300) / 35, 10) - 1,
              search: true,
              columns: columnsUncheckedApplications,
              sortName: 'sqsj', // 要排序的字段
              sortOrder: 'asc', // 排序规则  
            });
            $('#uncheckedApplicationsTable').bootstrapTable('removeAll');
          } else {
            layer.alert(res.msg);
          }
        },
        error: function (err) {
          console.log(err);
        }
      });

    }

    allowApplications = function (row) {
      console.log(row);
      layer.alert('确认通过此项授权申请！', {
        title: '通过认证'
      }, function () {
        var reqDataCheckApplications = {
          "index": row.index,
          "sftg": "1",
          "shyj": "",
          "cpdm": row.cpdm,
          "xmddm": row.xmddm
        };

        console.log(reqDataCheckApplications);

        $.ajax({
          url: ADDRESS_CHECKEDAPPLICATIONS,
          type: 'POST',
          data: reqDataCheckApplications,
          success: function (res) {
            console.log(res);
            if (res.code === '0000') {
              // getUncheckedApplications();
              layer.msg('此申请审核完成！', {
                time: 1000,
                end: function () {
                  getUncheckedApplications();
                  var reqSaveRzjlData = {};
                  // if (row.blzt == "2") {
                  //   reqSaveRzjlData = {
                  //     "sqxx_index": row.index,
                  //     "sqr": row.yhm,
                  //     "sqrdw": row.dwmc,
                  //     "lxdh": row.lxdh,
                  //     "yxdz": row.yxdz,
                  //     "cpmc": row.cpmc,
                  //     "sqsl": row.sqsl,
                  //     "xzqdm": row.xzqdm,
                  //     "bljg": "1",
                  //     "bz": "无",
                  //     "blzt": 2
                  //   };
                  // } else if (row.blzt == "3") {
                  //   reqSaveRzjlData = {
                  //     "sqxx_index": row.index,
                  //     "bljg": "1",
                  //     "bz": "无",
                  //     "blzt": 3
                  //   };
                  // }


                  reqSaveRzjlData = {
                    "sqxx_index": row.index,
                    "sqr": row.yhm,
                    "sqrdw": row.dwmc,
                    "lxdh": row.lxdh,
                    "yxdz": row.yxdz,
                    "cpmc": row.cpmc,
                    "sqsl": row.sqsl,
                    "xzqdm": row.xzqdm,
                    "bljg": "1",
                    "bz": "无",
                    "blzt": parseInt(row.blzt)
                  };


                  console.log(reqSaveRzjlData);

                  $.ajax({
                    type: "POST",
                    url: ADDRESS_SAVERZJL,
                    data: reqSaveRzjlData,
                    success: function (res) {
                      console.log(res);
                    }
                  });
                }
              });
            } else if (res.msg) {
              layer.alert(res.msg);
            }
          },
          error: function (err) {
            console.log(err);
          }
        });
      });
    }


    refuseApplications = function (row) {
      $.ajax({
        url: ADDRESS_APPLICATIONREJECTREASON,
        type: 'GET',
        async: false,
        success: function (res) {
          $('#select-shyj').empty();
          $('#select-shyj').append('<option value="" disabled="disabled">请选择</option>')
          for (var i = 0; i < res.length; i++) {
            $('#select-shyj').append('<option value="' + res[i] + '">' + res[i] + '</option>');
          }
          $('#select-shyj').append('<option value="其它意见" selected="selected">其它意见</option>');
        }
      });
      layer.open({
        resize: false,
        type: 1,
        title: '拒绝认证',
        area: ['30%', '50%'],
        content: $('#div-refuseShyj').html(),
        btn: ['拒绝认证', '取消'],
        yes: function (idx) {
          var shyj;
          var otherShyj = $('.layui-layer .refuseShyj textarea').val().trim();
          var commonShyj = $('.layui-layer .select-refuseshyj').find("option:selected").text();
          if (commonShyj === '请选择' || commonShyj === '其它意见') {
            if (otherShyj === '') {
              layer.alert("请填写拒绝理由！");
            } else {
              shyj = otherShyj;
            }
          } else if (otherShyj === '') {
            shyj = commonShyj;
          } else {
            shyj = commonShyj + ',' + otherShyj;
          }

          if (shyj) {
            var reqDataCheckApplications = {
              "index": row.index,
              "sftg": "0",
              "shyj": shyj
            };

            console.log(reqDataCheckApplications);

            $.ajax({
              url: ADDRESS_CHECKEDAPPLICATIONS,
              type: 'POST',
              data: reqDataCheckApplications,
              success: function (res) {
                console.log(res);
                if (res.msg) {
                  layer.alert(res.msg);
                } else if (res.code === '0000') {
                  layer.msg('此申请审核完成！', {
                    time: 1000,
                    end: function () {
                      getUncheckedApplications();

                      var reqSaveRzjlData = {
                        "sqxx_index": row.index,
                        "sqr": row.yhm,
                        "sqrdw": row.dwmc,
                        "lxdh": row.lxdh,
                        "yxdz": row.yxdz,
                        "cpmc": row.cpmc,
                        "sqsl": row.sqsl,
                        "xzqdm": row.xzqdm,
                        "bljg": "0",
                        "bz": shyj,
                        "blzt": parseInt(row.blzt)
                      };

                      $.ajax({
                        type: "POST",
                        url: ADDRESS_SAVERZJL,
                        data: reqSaveRzjlData,
                        success: function (res) {
                          console.log(res);
                        }
                      });
                    }
                  });
                  // getUncheckedApplications();
                }
              },
              error: function (err) {
                console.log(err);
              }
            });

            layer.close(idx);
          }

        }
      });
    }


    $('#uncheckedApplicationsTable').on('dbl-click-row.bs.table', function (e, row, element) {
      console.log(row);

      $('.mySelected').removeClass('mySelected');
      $(element).addClass('mySelected');

      var checkDetails = JSON.stringify(row);
      window.sessionStorage["checkDetails"] = checkDetails;

      layer.open({
        resize: false,
        type: 2,
        title: '详细信息',
        area: ['55%', '90%'],
        content: './check_details.html'
      });
    });


    //----------------------------制作授权--------------------------------//


    function getNeedAuthority(jmg) {
      var columnsNeedAuthority = [{
          field: 'yhm',
          title: '用户名',
          sortable: true,
          align: 'center'
        }, {
          field: 'dwmc',
          title: '单位名称',
          sortable: true,
          align: 'center'
        }, {
          field: 'cpmc',
          title: '软件名称',
          sortable: true,
          align: 'center'
        }, {
          field: 'sqlx',
          title: '授权类型',
          sortable: true,
          align: 'center',
          formatter: function (value, row, index) {
            switch (value) {
              case '1':
                return '单机授权'
                break;
              case '2':
                return '服务器授权'
                break;
              default:
                break;
            }
          }
        }, {
          field: 'swhtmc',
          title: '商务合同',
          visible: true
        }, {
          field: 'xzqdm',
          title: '行政区代码',
          visible: true
        }, {
          field: 'sqsl',
          title: '申请数量',
          visible: true
        },
        {
          field: 'blzt',
          title: '办理状态',
          align: 'center',
          // visible: false,
          formatter: function (value, row, index) {
            switch (value) {
              case '1':
                return '待认证'
                break;
              case '2':
                return '待审核'
                break;
              case '3':
                return '初审通过'
                break;
              case '4':
                return '复审通过'
                break;
              case '5':
                return '审核通过'
                break;
              case '6':
                return '在线授权失败'
                break;
              case '7':
                return '在线授权成功'
                break;
              case '8':
                return '申请成功'
                break;
              case '9':
                return '不予办理'
                break;
              case '10':
                return '发送邮件失败'
                break;
              default:
                break;
            }
          }
        },
        {
          field: 'operation',
          title: '操作',
          align: 'center',
          visible: false,
          formatter: function (value, row, index) {
            var allow = '<button class="layui-btn layui-btn-xs btn-allow" id="allow-create-btn" onclick="allowCreate(' + '\'' + row.index + '\'' + ',' + '\'' + row.lxdh + '\'' + ')">制作完成</button>';
            var refuse = '<button class="layui-btn layui-btn-xs layui-btn-danger btn-refuse" id="refuse-create-btn" onclick="refuseCreate(' + '\'' + row.index + '\'' + ',' + '\'' + row.lxdh + '\'' + ')">不予办理</button>';
            return allow + refuse;
          }
        }
      ];

      var indexLoading = layer.load(1);
      $.ajax({
        url: ADDRESS_NEEDAUTHORITY,
        type: 'GET',
        // async:false,
        success: function (res) {
          layer.close(indexLoading);
          console.log(res);
          if (res.msg && !res.code) {
            layer.msg(res.msg, {
              time: 1000
            });
          }
          if (res.code === undefined) {
            $('#needAuthorityTable').bootstrapTable({
              striped: true,
              detailView: false,
              pageIndex: 0,
              pagination: true,
              pageSize: parseInt(($(window).height() - 300) / 35, 10) - 1,
              search: true,
              columns: columnsNeedAuthority
            });

            if (jmg === 1) {
              var resJmg = [];
              for (var i = 0; i < res.length; i++) {
                if (res[i].jmg == '1') {
                  resJmg.push(res[i]);
                }
              }
              if (resJmg.length == 0) {
                layer.alert('无加密狗申请！');
              } else {
                $('#needAuthorityTable').bootstrapTable('load', resJmg);
                $('#needAuthorityTable').tableExport({
                  type: 'excel',
                  ignoreColumn: [2, 3, 7],
                  fileName: '加密狗申请信息' + date.getFullYear() + (date.getMonth() + 1) + date.getDate(),
                  exportHiddenCells: true
                });
                $('#needAuthorityTable').bootstrapTable('load', res);
              }
            } else {
              $('#needAuthorityTable').bootstrapTable('load', res);
            }

          } else if (res.code === '30022') {
            layer.msg(res.msg, {
              time: 1000
            });
            $('#needAuthorityTable').bootstrapTable({
              striped: true,
              detailView: false,
              pageIndex: 0,
              pagination: true,
              pageSize: parseInt(($(window).height() - 300) / 35, 10) - 1,
              search: true,
              columns: columnsNeedAuthority
            });
            $('#needAuthorityTable').bootstrapTable('removeAll');
          } else {
            $('#btn-create-exportXls').hide();
            layer.alert(res.msg);
          }
        },
        error: function (err) {
          console.log(err);
        }
      });
    }

    $('#btn-create-exportXls').click(function () {
      getNeedAuthority(1);
    })

    $('#needAuthorityTable').on('dbl-click-row.bs.table', function (e, row, element) {
      console.log(row);

      $('.mySelected').removeClass('mySelected');
      $(element).addClass('mySelected');

      var checkDetails = JSON.stringify(row);
      window.sessionStorage["checkDetails"] = checkDetails;

      layer.open({
        resize: false,
        type: 2,
        title: '详细信息',
        area: ['55%', '90%'],
        content: './create_details.html',
        end: function () {
          getNeedAuthority();
        }
      });
    });



    $('.btn-batch-allow').click(function () {
      layer.alert('确认通过所选授权申请！', {
          title: '批量通过认证'
        },
        function () {
          var selectedItem = $('#uncheckedApplicationsTable').bootstrapTable('getSelections');
          console.log(selectedItem);

          var selectedIndex = selectedItem.map(function (item) {
            return item.index
          })

          console.log(selectedIndex.join());

          var reqDataCheckApplications = {
            "index": selectedIndex.join(),
          };

          $.ajax({
            type: "POST",
            url: '/test/check_batch_applications',
            data: reqDataCheckApplications,
            success: function (res) {
              console.log(res);
              if (res.code === '0000') {
                $.ajax({
                  type: "POST",
                  url: "/test/save_batch_rzjl",
                  data: {
                    index: selectedIndex.join(),
                  },
                  success: function (res) {
                    console.log(res);
                    if (res.code = '0000') {
                      getUncheckedApplications();
                      layer.msg('批量申请审核完成！', {
                        time: 1000
                      })
                    }
                  }
                });

              } else if (res.msg) {
                layer.alert(res.msg);
              }
            }
          });
        });
    })

  })
})