$(function () {
  var ADDRESS_XMZXX = '/api/get_option/xmzxx';
  // var ADDRESS_RJCPLX = '/api/get_option/rjcplx';
  // var ADDRESS_XZQDM = '/api/get_option/xzqdm';
  var ADDRESS_XZQDM = '/api/get_ssqy';

  var ADDRESS_LOGOUT = '/api/logout';

  var ADDRESS_GETUSERINFO = '/api/get_userInfo';
  var ADDRESS_SUBMITUSERINFO = '/api/submit_userInfo';
  var ADDRESS_USERHISTORY = '/api/user_history';

  var ADDRESS_UNCHECKEDUSERS = '/api/unchecked_users';
  var ADDRESS_UNCHECKEDAPPLICATIONS = '/api/unchecked_applications';
  var ADDRESS_CHECKEDUSERS = '/api/checked_users';
  var ADDRESS_CHECKEDAPPLICATIONS = '/api/checked_applications';

  var ADDRESS_NEEDAUTHORITY = '/api/need_authority';
  var ADDRESS_CHECKEDAUTHORITY = '/api/checked_authority';

  var ADDRESS_USERREJECTREASON = '/api/user_reject_reason';
  var ADDRESS_APPLICATIONREJECTREASON = '/api/application_reject_reason';

  var ADDRESS_REVOKEAPPLICATION = '/api/revokeApplication';

  var ADDRESS_GETBLZT = '/api/get_blzt';

  var ADDRESS_SAVERZJL = '/api/save_rzjl';

  var ADDRESS_FLOWCHART = '/api/flowchart_info';


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

    $('#welcomeUser').click(function () {
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
    });

    // function getQueryString(name) {
    //   var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
    //   var url = decodeURI(window.location.search);
    //   var r = url.substr(1).match(reg);
    //   if (r != null) return (r[2]);
    //   return '';
    // }


    if (roleInfo.role === '0') {
      $('#content-init').hide();
      $('#content-apply').show();
      $('#btn-checkUsers').hide();
      $('#btn-checkApplications').hide();
      $('#btn-needAuthority').hide();
      $('#btn-applyAuthenrization').addClass('btn-selected');
      $("#goToAdmin").hide();
      getApplicationInfo();
    } else if (roleInfo.role === '1') {
      $('#content-init').hide();
      $('#content-checkUsers').show();
      $('#btn-checkUsers').addClass('btn-selected');
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


    // $('.layui-input').not('#input-ssqy').focus(function () {
    //   $('#show-ssqy').show();
    //   $('#select-ssqy').hide();
    // });

    // $(document).click(function () {
    //   $('#show-ssqy').show();
    //   $('#select-ssqy').hide();

    //   var selectedSsqy = $('#input-ssqy').val();

    //   if ($('#select-district').val() !== '') {
    //     selectedSsqy = $('#select-district').val();
    //   } else if ($('#select-city').val() !== '') {
    //     selectedSsqy = $('#select-city').val();
    //   } else if ($('#select-province').val() !== '') {
    //     selectedSsqy = $('#select-province').val();
    //   } 

    //   $('#input-ssqy').val(selectedSsqy);

    // });


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

    // function loadXzqdmSelect() {
    //   $.ajax({
    //     url: ADDRESS_XZQDM,
    //     async: false,
    //     success: function (dataXzqdm) {
    //       console.log(dataXzqdm);

    //       console.log('get xzqdm success');
    //       $.each(dataXzqdm, function (idx, obj) {
    //         if (obj.dm.slice(-4) === '0000') {
    //           provinceData.push(obj);
    //           loadSelectOptions($('#select-province'), provinceData);
    //           // $('#select-province').prepend('<option value="">请选择省份</option>');
    //           form.render('select', 'select-ssqy-filter');

    //         } else if (obj.dm.slice(-2) === '00') {
    //           cityData.push(obj);
    //         } else {
    //           districtData.push(obj);
    //         }
    //       });

    //     },
    //     error: function (err) {
    //       console.log(err);
    //     }
    //   });
    // }

    // $('#select-city').next().hide();
    // $('#select-district').next().hide();

    // form.on('select(province-filter)', function (data) {
    //   var showCityData = [];
    //   // $('#select-city').empty();
    //   // $('#select-city').append('<option value=""></option>');
    //   $.each(cityData, function (idx, obj) {
    //     if (obj.dm.substr(0, 2) === $('#select-province').val().substr(0, 2)) {
    //       showCityData.push(obj);
    //     }
    //   });
    //   loadSelectOptions($('#select-city'), showCityData);
    //   form.render('select', 'select-ssqy-filter');

    //   // $('#select-city').prepend('<option value="">请选择城市</option>');      
    //   // form.render('select', 'city-filter');
    //   $('#select-district').next().hide();
    //   if ($('#select-province').val() === '') {
    //     $('#select-city').next().hide();
    //   }
    // });

    // form.on('select(city-filter)', function (data) {
    //   var showDistrictData = [];
    //   // $('#select-district').empty();
    //   // $('#select-district').append('<option value=""></option>');
    //   $.each(districtData, function (idx, obj) {
    //     if (obj.dm.substr(0, 4) === $('#select-city').val().substr(0, 4)) {
    //       showDistrictData.push(obj);
    //     }
    //   });
    //   loadSelectOptions($('#select-district'), showDistrictData);
    //   form.render('select', 'select-ssqy-filter');
    //   // $('#select-district').prepend('<option value="">请选择区县</option>');      
    //   if ($('#select-city').val() === '') {
    //     $('#select-district').next().hide();
    //   }
    //   // form.render('select', 'district-filter');
    // });
    // //----------------------------------------------------------------------------------//


    //--------------------------获取用户信息并显示---------------------------------------------//
    var newUser, sqr, sqrlx, sqrdw, ssqy, lxdh;
    getUserInfo();

    function getUserInfo() {
      $.ajax({
        url: ADDRESS_GETUSERINFO,
        type: 'GET',
        success: function (userInfo) {
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
            // $('#input-lxdh').val(getQueryString('id'));
            console.log(phone);

            $('#input-lxdh').val(phone);
          }

          $('#welcomeUser').text('欢迎您，' + userInfo.sqr);

          $(document).click(function () {
            // $('#show-ssqy').show();
            // $('#select-ssqy').hide();

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


          var zt;
          switch (userInfo.zt) {
            case '1':
              zt = '待认证';
              break;
            case '2':
              zt = '一审通过';
              break;
            case '3':
              zt = '二审通过';
              break;
            case '4':
              zt = '通过认证';
              break;
            case '9':
              zt = '未通过认证';
              break;

            default:
              break;
          }
          // $('#input-zt').attr({
          //   disabled: 'disabled'
          // });
          // $('#input-zt').addClass('layui-disabled');
          // $('#input-zt').val(zt);

          $('#show-zt').text(zt);

          if (zt === '通过认证') {
            $('#btn-addApplication').show();
          }

          sqr = userInfo.sqr;
          sqrlx = userInfo.sqrlx;
          sqrdw = userInfo.sqrdw;
          ssqy = userInfo.ssqy;
          lxdh = userInfo.lxdh;


          newUser = userInfo.newUser;

          if (newUser === '1') {
            // $('#btn-addApplication').hide();
            $('#welcomeUser').text('欢迎您，新用户');

            // $('#content-apply').empty();
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

          // $('#select-ssqy').hide();
          // $('#show-ssqy').show();
          // $('#input-ssqy').val(userInfo.ssqy);

          // $('#input-ssqy').focus(function () {
          //   $('#show-ssqy').hide();
          //   $('#select-ssqy').show();
          //   if ($('#select-city').val() === '') {
          //     $('#select-city').next().hide();
          //     $('#select-district').next().hide();
          //   }

          //   if ($('#select-district').val() === '') {
          //     $('#select-district').next().hide();
          //   }
          //   // $('#select-city').next().hide();
          //   // $('#select-district').next().hide();
          // })

          if ($('#input-ssqy').val() !== '') {
            $('#select-province').attr({
              'lay-verify': ''
            });
          }

          $("#select-sqrlx option").each(function () {
            // console.log($(this).text());          
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

      // var selectedSsqy = $('#input-ssqy').val();

      // if ($('#select-district').val() !== '') {
      //   selectedSsqy = $('#select-district').val();
      // } else if ($('#select-city').val() !== '') {
      //   selectedSsqy = $('#select-city').val();
      // } else if ($('#select-province').val() !== '') {
      //   selectedSsqy = $('#select-province').val();
      // }

      // $('#input-ssqy').val(selectedSsqy);

      var reqDataUserInfo = {
        "sqr": $('#input-sqr').val(),
        "sqrlx": $('#select-sqrlx').val(),
        "wechat": $('#input-wechat').val(),
        "jsyx": $('#input-jsyx').val(),
        "ssqy": $('#select-ssqydm').val(),
        "lxdh": $('#input-lxdh').val()
      };

      console.log(reqDataUserInfo);


      if (sqrlx === '甲方用户') {
        sqrlx = '0';
      } else if (sqrlx === '内部用户') {
        sqrlx = '1';
      }

      if (reqDataUserInfo.sqrlx === '1') {
        reqDataUserInfo.sqrdw = $('#div-xmzxx .layui-this').text();
        // reqDataUserInfo.sqrdw = $('#select-xmzxx option:selected').text();
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
        reqDataUserInfo.updateUser = '1';
        submitUserInfo();
      } else if (reqDataUserInfo.sqr !== sqr || reqDataUserInfo.sqrlx !== sqrlx || reqDataUserInfo.sqrdw !== sqrdw || reqDataUserInfo.ssqy !== ssqy) {
        reqDataUserInfo.updateUser = '1';
        layer.alert('更改了重要信息，您的账号需要进行重新认证！', {
          title: '更改信息'
        }, function () {
          // $('#show-ssqy').show();
          // $('#select-ssqy').hide();
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
              // $('#select-ssqy').hide();
              // $('#show-ssqy').show();
              // $('#input-ssqy').val(reqDataUserInfo.ssqy);

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
                    zt = '一审通过';
                    break;
                  case '3':
                    zt = '二审通过';
                    break;
                  case '4':
                    zt = '通过认证';
                    break;
                  case '9':
                    zt = '未通过认证';
                    break;

                  default:
                    break;
                }
                // $('#div-zt').show();
                // $('#input-zt').val(zt);
                // $('#input-zt').attr({
                //   disabled: 'disabled'
                // });
                // $('#input-zt').addClass('layui-disabled');

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
          content: 'http://' + window.location.host + '/apply.html?sfnb=0',
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
          content: 'http://' + window.location.host + '/apply.html?sfnb=1',
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
      var columnsApplication = []
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
              if (row.shzt !== '申请已办结' && row.shzt !== '不予办理') {
                var revoke = '<button class="layui-btn layui-btn-xs btn-revoke" onclick="revokeApplication(\'' + row.index + '\')">撤销申请</button>';
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
            align: 'center',
            formatter: function (value, row, index) {
              // var flowchart = '<button class="layui-btn layui-btn-xs btn-flowchart" onclick="openFlowchart(\'' + row.index + '\')">流程图</button>';
              var flowchart = "<button class='layui-btn layui-btn-xs btn-flowchart' onclick='openFlowchart(" + JSON.stringify(row) + ")'>流程图</button>";
              return flowchart;
            }
          }, {
            field: 'operation',
            title: '操作',
            align: 'center',
            formatter: function (value, row, index) {
              // var revoke = '<button class="layui-btn layui-btn-xs btn-revoke" onclick="revokeApplication(\'' + row.index + '\')">撤销申请</button>';
              // return revoke;
              if (row.shzt !== '申请已办结' && row.shzt !== '不予办理') {
                var revoke = '<button class="layui-btn layui-btn-xs btn-revoke" onclick="revokeApplication(\'' + row.index + '\')">撤销申请</button>';
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
        sortName: 'jzsj', // 要排序的字段
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

          if (!res.fsr && !res.sqshr) {
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
            area: ['50%', '100%'],
            content: 'http://' + window.location.host + '/flowchart.html'
          });

        }
      });

    }

    revokeApplication = function (index) {
      layer.confirm('确定撤销此申请？', function (idx) {
        var reqDataRevoke = {
          'index': index
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
    }

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
        content: 'http://' + window.location.host + '/historyDetails.html'
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



    // $('#applyHistoryTable').bootstrapTable('load', resData);

    //----------------------------------------------------------------------------------//



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
          window.location.href = '/';
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
      $('#content-needAuthority').show();
      $('#content-init').hide();
      if ($('.btn-side').hasClass('btn-selected')) {
        $('.btn-side').removeClass('btn-selected');
      }
      $(this).addClass('btn-selected');
      getNeedAuthority();
    });

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
                return '一审通过';
                break;
              case '3':
                return '二审通过';
                break;
              case '4':
                return '通过认证';
                break;
              case '9':
                return '未通过认证';
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
            // ' + '\'' + row.index + '\'' + ',' + '\'' + row.lxdh + '\''+ ',' + '\'' + row.rzzt + '\'' + '
            var allow = '<button class="layui-btn layui-btn-xs btn-allow" onclick="allowUsers(\'' + row.index + '\')">通过认证</button>';
            var refuse = '<button class="layui-btn layui-btn-xs layui-btn-danger btn-refuse" onclick="refuseUsers(\'' + row.index + '\')">拒绝认证</button>';
            return allow + refuse;
          }
        }
      ];

      // $('#uncheckedUsersTable').bootstrapTable({
      //   striped: true,
      //   detailView: false,
      //   pageIndex: 0,
      //   pagination: true,
      //   pageSize: parseInt(($(window).height() - 200) / 35, 10) - 1,
      //   columns: columnsUncheckedUsers
      // });

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




    allowUsers = function (index) {

      layer.alert('确认通过此用户认证！', {
        title: '通过认证'
      }, function () {
        var reqDataCheckUsers = {
          "index": index,
          "sftg": "1",
          "shyj": ""
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


    refuseUsers = function (index) {
      $.ajax({
        url: ADDRESS_USERREJECTREASON,
        type: 'GET',
        async: false,
        success: function (res) {
          $('#select-shyj').empty();
          $('#select-shyj').append('<option value="" selected="selected" disabled="disabled">请选择</option>')
          for (var i = 0; i < res.length; i++) {
            $('#select-shyj').append('<option value="' + res[i] + '">' + res[i] + '</option>');
          }
          $('#select-shyj').append('<option value="其它意见">其它意见</option>');
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
            shyj = otherShyj;
          } else if (otherShyj === '') {
            shyj = commonShyj;
          } else {
            shyj = commonShyj + ',' + otherShyj;
          }

          var reqDataCheckUsers = {
            "index": index,
            "sftg": "0",
            "shyj": shyj
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
          title: '行政区',
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
          visible: false
        },
        {
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
                return '一审通过'
                break;
              case '4':
                return '二审通过'
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
                return '审核完成'
                break;
              case '9':
                return '不予办理'
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
            // onclick="allowApplications(\'' + row.index + '\')"
            var allow = "<button class='layui-btn layui-btn-xs btn-allow' onclick='allowApplications(" + JSON.stringify(row) + ")'>通过认证</button>";
            var refuse = "<button class='layui-btn layui-btn-xs layui-btn-danger btn-refuse' onclick='refuseApplications(" + JSON.stringify(row) + ")'>拒绝认证</button>";
            return allow + refuse;
          }
        }
      ];


      // $('#uncheckedApplicationsTable').bootstrapTable({
      //   striped: true,
      //   detailView: false,
      //   pageIndex: 0,
      //   pagination: true,
      //   pageSize: parseInt(($(window).height() - 200) / 35, 10) - 1,
      //   columns: columnsUncheckedApplications
      // });

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
              columns: columnsUncheckedApplications
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
              columns: columnsUncheckedApplications
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
          "shyj": ""
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
                  if ((row.blzt === "4" && row.jmg === "0" && row.sqlx === "1") || (!row.xmddm && !row.swhtmc && !row.swlxr)) {
                    layer.msg('授权制作中请稍等,请勿关闭此窗口！', {
                      time: 10000,
                      shade: 0.6,
                      end: function getBlzt() {
                        $.ajax({
                          type: "GET",
                          url: ADDRESS_GETBLZT,
                          async: false,
                          data: {
                            "sqxx_index": row.index
                          },
                          success: function (res) {
                            console.log(res);
                            if (res.blzt === "8" || res.blzt === "5") {
                              var reqSaveRzjlData = {
                                "sqxx_index": row.index,
                                "sqr": row.yhm,
                                "sqrdw": row.dwmc,
                                "lxdh": row.lxdh,
                                "yxdz": row.yxdz,
                                "cpmc": row.cpmc,
                                "sqsl": row.sqsl,
                                "bljg": "1",
                                "bz": "无"
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
                          }
                        });
                      }
                    });

                  }
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
          $('#select-shyj').append('<option value="" selected="selected" disabled="disabled">请选择</option>')
          for (var i = 0; i < res.length; i++) {
            $('#select-shyj').append('<option value="' + res[i] + '">' + res[i] + '</option>');
          }
          $('#select-shyj').append('<option value="其它意见">其它意见</option>');
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
            shyj = otherShyj;
          } else if (otherShyj === '') {
            shyj = commonShyj;
          } else {
            shyj = commonShyj + ',' + otherShyj;
          }
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

                    $.ajax({
                      type: "GET",
                      url: ADDRESS_GETBLZT,
                      async: false,
                      data: {
                        "sqxx_index": row.index
                      },
                      success: function (res) {
                        console.log(res);

                        if (res.blzt === "9") {
                          var reqSaveRzjlData = {
                            "sqxx_index": row.index,
                            "sqr": row.yhm,
                            "sqrdw": row.dwmc,
                            "lxdh": row.lxdh,
                            "yxdz": row.yxdz,
                            "cpmc": row.cpmc,
                            "sqsl": row.sqsl,
                            "bljg": "0",
                            "bz": shyj
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
        content: 'http://' + window.location.host + '/checkDetails.html'
      });
    });


    //----------------------------制作授权--------------------------------//


    function getNeedAuthority() {
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
          title: '商务合同名称',
          sortable: true,
          visible: false
        }, {
          field: 'swlxr',
          title: '商务联系人',
          sortable: true,
          visible: false
        }, {
          field: 'xzqdm',
          title: '行政区',
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
          visible: false
        },
        {
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
                return '一审通过'
                break;
              case '4':
                return '二审通过'
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
                return '制作完成'
                break;
              case '9':
                return '不予办理'
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

      // $('#needAuthorityTable').bootstrapTable({
      //   striped: true,
      //   detailView: false,
      //   pageIndex: 0,
      //   pagination: true,
      //   pageSize: parseInt(($(window).height() - 200) / 35, 10) - 1,
      //   columns: columnsNeedAuthority
      // });

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
            $('#needAuthorityTable').bootstrapTable('load', res);
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
            layer.alert(res.msg);
          }
        },
        error: function (err) {
          console.log(err);
        }
      });
    }

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
        content: 'http://' + window.location.host + '/createDetails.html',
        end: function () {
          getNeedAuthority();
        }
      });
    });

    // allowCreate = function (index,lxdh) {
    //   layer.alert('确认已经完成授权制作并发送', {
    //     title: '通过认证'
    //   }, function () {
    //     var reqDataCheckedAuthority = {
    //       'index': index,
    //       'lxdh': lxdh,
    //       'sftg': '1',
    //       'shyj': '申请属实，予以通过'
    //     };
    //     $.ajax({
    //       url: ADDRESS_CHECKEDAUTHORITY,
    //       type: 'POST',
    //       data: reqDataCheckedAuthority,
    //       success: function (res) {
    //         layer.msg('审核通过，授权已经制作并发送', {
    //           time: 1000,
    //           end: function () { 
    //             getNeedAuthority();
    //           } 
    //         });
    //         // getNeedAuthority();
    //       },
    //       error: function (err) {
    //         console.log(err);
    //       }
    //     });
    //   });
    // };


    // refuseCreate = function (index,lxdh) {
    //   $.ajax({
    //     url: ADDRESS_APPLICATIONREJECTREASON,
    //     type: 'GET',
    //     async: false,
    //     success: function (res) {
    //       $('#select-shyj').empty();
    //       $('#select-shyj').append('<option value="" selected="selected" disabled="disabled">请选择</option>')
    //       for (var i = 0; i < res.length; i++) {
    //         $('#select-shyj').append('<option value="' + res[i] + '">' + res[i] + '</option>');
    //       }
    //       $('#select-shyj').append('<option value="其它意见">其它意见</option>');
    //     }
    //   });
    //   layer.open({
    //     resize: false,                          
    //     type: 1,
    //     title: '拒绝认证',
    //     area: ['30%', '50%'],
    //     content: $('#div-refuseShyj').html(),
    //     btn: ['拒绝认证', '取消'],
    //     yes: function (idx) {
    //       var shyj;
    //       var otherShyj = $('.layui-layer .refuseShyj textarea').val().trim();
    //       var commonShyj = $('.layui-layer .select-refuseshyj').find("option:selected").text();
    //       if (commonShyj === '请选择' || commonShyj === '其它意见') {
    //         shyj = otherShyj;
    //       } else if (otherShyj === '') {
    //         shyj = commonShyj;
    //       } else {
    //         shyj = commonShyj + ',' + otherShyj;
    //       }
    //       var reqDataCheckedAuthority = {
    //         "index": index,
    //         'lxdh': lxdh,            
    //         "sftg": "0",
    //         "shyj": shyj
    //       };


    //       console.log(reqDataCheckedAuthority);

    //       $.ajax({
    //         url: ADDRESS_CHECKEDAUTHORITY,
    //         type: 'POST',
    //         data: reqDataCheckedAuthority,
    //         success: function (res) {
    //           console.log(res);
    //           if (res.code === '0000') {
    //             layer.msg('审核未通过，如有疑问请联系工作人员', {
    //               time: 1000,
    //               end: getNeedAuthority
    //             });
    //             // getNeedAuthority();
    //           }
    //         },
    //         error: function (err) {
    //           console.log(err);
    //         }
    //       });
    //       layer.close(idx);
    //     }
    //   });
    // };

  })


})