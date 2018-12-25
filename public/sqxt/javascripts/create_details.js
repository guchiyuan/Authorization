$(function () {


  var ADDRESS_APPLICATIONREJECTREASON = '/test/application_reject_reason';
  var ADDRESS_CHECKEDAUTHORITY = '/test/checked_authority';

  var ADDRESS_XZQMC = '/test/xzqmc';

  var ADDRESS_SAVERZJL = '/test/save_rzjl';



  var details = JSON.parse(window.sessionStorage.getItem('checkDetails'));

  var reqData = {
    'xzqdm': details.xzqdm.split(",")
  };

  if (!details.swhtmc) {
    details.swhtmc = '无';
  }

  if (!details.swlxr) {
    details.swlxr = '无';
  }

  if (!details.sqxks) {
    details.sqxks = '无';
  }

  if (!details.xmjzsj) {
    details.xmjzsj = '无';
  }

  if (!details.sqxlm || details.sqxlm == '[]') {
    details.sqxlm = '无';
  }

  switch (details.sqlx) {
    case '1':
      details.sqlx = '单机授权';
      break;
    case '2':
      details.sqlx = '服务器授权';
      break;
    default:
      break;
  }

  switch (details.jmg) {
    case '0':
      details.jmg = '不使用';
      break;
    case '1':
      details.jmg = '使用';
      break;
    default:
      break;
  }

  switch (details.blzt) {
    case '1':
      details.blzt = '待认证';
      break;
    case '2':
      details.blzt = '待审核';
      break;
    case '3':
      details.blzt = '初审通过';
      break;
    case '4':
      details.blzt = '复审通过';
      break;
    case '5':
      details.blzt = '审核通过';
      break;
    case '6':
      details.blzt = '在线授权失败';
      break;
    case '7':
      details.blzt = '在线授权成功';
      break;
    case '8':
      details.blzt = '审核完成';
      break;
    case '9':
      details.blzt = '不予办理';
      break;
    default:
      break;
  }

  switch (details.jfsy) {
    case '0':
      details.jfsy = '否';
      break;
    case '1':
      details.jfsy = '是';
      break;
    default:
      break;
  }

  // details.sqxlm = details.sqxlm.replace(/,/g, '<br>')

  var tpl = $("#checkDetails-tpl").html();
  //预编译模板
  var template = Handlebars.compile(tpl);
  //匹配json内容
  var content = template(details);
  //输入模板
  $("#checkDetails-container").html(content);

  // $('#sqxlm').html(details.sqxlm);

  if (details.swhtmc !== '无') {
    $('#show-jfsy').hide();
  }

  function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }

  layui.use(['layer', 'form'], function () {
    var layer = layui.layer;
    var form = layui.form;

    $('.btn-download').click(function () {
      console.log(details.sqxlm);
      var sqxlmArr = [];
      // download("hello.dat", "This is the content of my file :)");
      if (details.sqxlm.slice(0, 1) === '[') {
        sqxlmArr = JSON.parse(details.sqxlm);
        console.log(sqxlmArr);
        if (sqxlmArr.length === 0) {
          layer.alert('请注意，此申请为加密狗模式')
        } else {
          sqxlmArr.forEach(function (item) {
            download(item.name + ".dat", item.value);
          });
        }
      } else {
        sqxlmArr = details.sqxlm.split(',');
        sqxlmArr.forEach(function (item, i) {
          download(details.yhm + '微信申请' + i + ".dat", item);
        });
      }


    })

    function debounce(fn, delay) {
      // 记录上一次的延时器
      var timer = null;
      return function () {
        // 清除上一次延时器
        clearTimeout(timer)
        timer = setTimeout(function () {
          fn.apply(this)
        }, delay)
      }
    }

    $('.btn-allow').click(function () {
      layer.alert('确认已经完成授权制作并发送', {
        title: '通过认证'
      }, debounce(function () {
        var reqDataCheckedAuthority = {
          'index': details.index,
          'lxdh': details.lxdh,
          'sftg': '1',
          'shyj': '申请属实，予以通过',
          'jmg': details.jmg,
          'sqsl': details.sqsl
        };
        $.ajax({
          url: ADDRESS_CHECKEDAUTHORITY,
          type: 'POST',
          data: reqDataCheckedAuthority,
          success: function (res) {
            layer.msg('审核通过，授权已经制作并发送', {
              time: 1000,
              end: function () {
                var index = parent.layer.getFrameIndex(window.name); //获取当前窗体索引
                parent.layer.close(index); //执行关闭

                var reqSaveRzjlData = {
                  "sqxx_index": details.index,
                  "bljg": "1",
                  "bz": "无",
                  "blzt": "制作授权"
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
          },
          error: function (err) {
            console.log(err);
          }
        });
      },2000));
    })

    $('.btn-refuse').click(function () {
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
        type: 1,
        title: '拒绝认证',
        area: ['65%', '65%'],
        content: $('#div-refuseShyj').html(),
        btn: ['拒绝认证', '取消'],
        yes: debounce(function (idx) {
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
            var reqDataCheckedAuthority = {
              "index": details.index,
              'lxdh': details.lxdh,
              "sftg": "0",
              "shyj": shyj,
              "jmg": details.jmg
            };


            console.log(reqDataCheckedAuthority);

            $.ajax({
              url: ADDRESS_CHECKEDAUTHORITY,
              type: 'POST',
              data: reqDataCheckedAuthority,
              success: function (res) {
                console.log(res);
                layer.msg('审核未通过，如有疑问请联系工作人员', {
                  time: 1000,
                  end: function () {
                    var index = parent.layer.getFrameIndex(window.name); //获取当前窗体索引
                    parent.layer.close(index); //执行关闭

                    var reqSaveRzjlData = {
                      "sqxx_index": details.index,
                      "bljg": "0",
                      "bz": shyj,
                      "blzt": "制作授权"
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
              },
              error: function (err) {
                console.log(err);
              }
            });
          }

        },2000)
      });
    })

  })


})