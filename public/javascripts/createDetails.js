$(function () {


  var ADDRESS_APPLICATIONREJECTREASON = '/api/application_reject_reason';
  var ADDRESS_CHECKEDAUTHORITY = '/api/checked_authority';

  var ADDRESS_XZQMC = '/api/xzqmc';

  var ADDRESS_SAVERZJL = '/api/save_rzjl';
  


  var details = JSON.parse(window.sessionStorage.getItem('checkDetails'));

  var reqData = {
    'xzqdm':details.xzqdm.split(",")
  };
  
  $.ajax({
    url:ADDRESS_XZQMC,
    type: 'GET',
    async: false,
    data:reqData,
    success: function (res) {
      console.log(res);
      var xzqmcStr = '';
      res.map(function(item){
        if (item.mc && item.mc !== '') {
          xzqmcStr = xzqmcStr + item.mc + ',';
        } else {
          xzqmcStr = xzqmcStr + item.dm + ',';
        }
      });

      xzqmcStr=(xzqmcStr.substring(xzqmcStr.length-1)==',')?xzqmcStr.substring(0,xzqmcStr.length-1):xzqmcStr;

      console.log(xzqmcStr);

      details.xzqmc = xzqmcStr;

    },
    error: function (err) {
      console.log(err); 
    }
  });

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
      details.blzt = '一审通过';
      break;
    case '4':
      details.blzt = '二审通过';
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

  var tpl = $("#checkDetails-tpl").html();
  //预编译模板
  var template = Handlebars.compile(tpl);
  //匹配json内容
  var content = template(details);
  //输入模板
  $("#checkDetails-container").html(content);
  
  if(details.swhtmc !=='无'){
    $('#show-jfsy').hide();
  }

  layui.use(['layer', 'form'], function () {
    var layer = layui.layer;
    var form = layui.form;

    $('.btn-allow').click(function () {
      layer.alert('确认已经完成授权制作并发送', {
        title: '通过认证'
      }, function () {
        var reqDataCheckedAuthority = {
          'index': details.index,
          'lxdh': details.lxdh,
          'sftg': '1',
          'shyj': '申请属实，予以通过'
        };
        $.ajax({
          url: ADDRESS_CHECKEDAUTHORITY,
          type: 'POST',
          data: reqDataCheckedAuthority,
          success: function (res) {
            layer.msg('审核通过，授权已经制作并发送',{time:1000,end:function () {
              var index = parent.layer.getFrameIndex(window.name); //获取当前窗体索引
              parent.layer.close(index); //执行关闭
              var reqSaveRzjlData = {
                "sqxx_index":details.index,
                "sqr":details.yhm,
                "sqrdw":details.dwmc,
                "lxdh":details.lxdh,
                "yxdz":details.yxdz,
                "cpmc":details.cpmc,
                "sqsl":details.sqsl,
                "bljg":"1",
                "bz":"无"
              };
              $.ajax({
                type: "POST",
                url: ADDRESS_SAVERZJL,
                data: reqSaveRzjlData,
                success: function (response) {
                  console.log(response); 
                }
              });
            }});
          },
          error: function (err) {
            console.log(err);
          }
        });
      });
    })

    // function closeLayer() {
    //   var index = parent.layer.getFrameIndex(window.name); //获取当前窗体索引
    //   parent.layer.close(index); //执行关闭
    // }

    $('.btn-refuse').click(function () {
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
        type: 1,
        title: '拒绝认证',
        area: ['65%', '65%'],
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
          var reqDataCheckedAuthority = {
            "index": details.index,
            'lxdh': details.lxdh,            
            "sftg": "0",
            "shyj": shyj
          };


          console.log(reqDataCheckedAuthority);

          $.ajax({
            url: ADDRESS_CHECKEDAUTHORITY,
            type: 'POST',
            data: reqDataCheckedAuthority,
            success: function (res) {
              console.log(res);
              layer.msg('审核未通过，如有疑问请联系工作人员',{time:1000,end:function () {
                var index = parent.layer.getFrameIndex(window.name); //获取当前窗体索引
                parent.layer.close(index); //执行关闭

                var reqSaveRzjlData = {
                  "sqxx_index":details.index,
                  "sqr":details.yhm,
                  "sqrdw":details.dwmc,
                  "lxdh":details.lxdh,
                  "yxdz":details.yxdz,
                  "cpmc":details.cpmc,
                  "sqsl":details.sqsl,
                  "bljg":"0",
                  "bz":shyj
                };
                $.ajax({
                  type: "POST",
                  url: ADDRESS_SAVERZJL,
                  data: reqSaveRzjlData,
                  success: function (response) {
                    console.log(response); 
                  }
                });
              }});
            },
            error: function (err) {
              console.log(err);
            }
          });
        }
      });
    })

  })


})