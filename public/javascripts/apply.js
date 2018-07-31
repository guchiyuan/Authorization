$(function () {
  var ADDRESS_RJCPLX = '/api/get_option/rjcplx';
  var ADDRESS_XZQDM = '/api/get_option/xzqdm';

  var ADDRESS_APPLY = '/api/submitApplication';

  layui.use(['layer', 'form', 'laydate'], function () {
    var layer = layui.layer,
      form = layui.form;

    var laydate = layui.laydate;

    laydate.render({
      elem: '#input-jzsj', //指定元素
      format: 'yyyy-MM-dd'
    });

    form.verify({
      isNumber: [
        /^[1-9]\d*$/, '申请数量必须为正整数'
      ],
      over1: [
        /^[2-9]\d*$/, '许可数必须大于1'
      ]
    });


    //-----------------------根据角色申请单位类型不同提供不同申请界面--------------------------------//
    function getQueryString(name) {
      var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
      var url = decodeURI(window.location.search);
      var r = url.substr(1).match(reg);
      if (r != null) return (r[2]);
      return '';
    }

    var sfnb = getQueryString('sfnb');

    switch (sfnb) {
      case '0':
        $('#div-swhtmc').show();
        $('#div-swlxr').show();
        //内部用户才可以自定义截止时间
        // $('input[title="自定义截止时间"]').next().remove();
        // $('input[title="自定义截止时间"]').remove();
        // $('#input-jzsj').parent().hide();
        break;
      case '1':
        $('#div-jfsy').show();
        $('#div-swhtmc').hide();
        $('#div-swlxr').hide();
        $('#input-swhtmc').attr({
          'lay-verify': ''
        });
        $('#input-swlxr').attr({
          'lay-verify': ''
        });
        break;

      default:
        break;
    }

    form.on('radio(filter-jfsy)', function (data) {
      console.log(data.value); //被点击的radio的value值
      if (data.value === "1") {
        $('#div-swhtmc').show();
        $('#div-swlxr').show();
        $('#input-swhtmc').attr({
          'lay-verify': 'required'
        });
        $('#input-swlxr').attr({
          'lay-verify': 'required'
        });
      } else {
        $('#input-swhtmc').attr({
          'lay-verify': ''
        });
        $('#input-swlxr').attr({
          'lay-verify': ''
        });
        $('#input-swhtmc').val('');
        $('#input-swlxr').val('');
        $('#div-swhtmc').hide();
        $('#div-swlxr').hide();
      }
    });


    //----------------满足单机授权和服务器授权的不同条件-----------------------------//
    form.on('select(sqlx-filter)', function (data) {
      if (data.value === '2') {
        $('#div-sqxks').show();
        $('#input-sqxks').attr({
          'lay-verify': 'required'
        });
        // $("input[name='jmg']").attr({
        //   disabled: 'disabled'
        // });
        // $("input[name='jmg']").addClass('layui-disabled');
        // form.render('radio');
        $("#div-jmg").hide();
      } else {
        $('#div-sqxks').hide();
        $('#input-sqxks').attr({
          'lay-verify': ''
        });
        $("#div-jmg").show();
        // $("input[name='jmg']").removeAttr('disabled');
        // $("input[name='jmg']").removeClass('layui-disabled');
      }
    });

    $('#input-sqxks').focus(function () {
      layer.tips('<span style="color:black">客户端允许连接的最大数量</span>', '#div-sqxks', {
        tips: [1, '#f2f2f2']
      });
    });

    //----------------------不选择自定义截止时间不可输入时间----------------------//
    form.on('radio(jzsjlx-filter)', function (data) {

      if (data.value === '3') {
        $('#input-jzsj').val('');
        $('#customJzsj').show();
        $('#input-jzsj').attr({
          'lay-verify': 'required'
        });

        $('#input-jzsj').removeAttr('disabled');
        $('#input-jzsj').removeClass('layui-disabled');
      } else {
        $('#customJzsj').hide();
        $('#input-jzsj').removeAttr('lay-verify');
        $('#input-jzsj').attr({
          disabled: 'disabled'
        });
        $('#input-jzsj').addClass('layui-disabled');
      }
    });


    //---------------------选择加密狗模式进行提示----------------//
    form.on('radio(jmg-filter)', function (data) {
      if (data.value === '1') {
        layer.alert('您需向我司提供加密狗方可制作授权！')
      }
    });


    //--------------------加载产品代码-----------------------//
    $.ajax({
      url: ADDRESS_RJCPLX,
      async: false,
      success: function (data) {
        console.log(data);
        loadSelectOptions($('#select-cpdm'), data)
        form.render('select');
      },
      error: function (err) {
        console.log(err);
      }
    });

    //----------------------------------------------------------------------//

    //------------------------------xzqdm多选三级联动--------------------------------//

    var provinceData = [];
    var districtData = [];
    var cityData = [];

    // $('#select-xzqdmCity').hide();
    // $('#select-xzqdmDistrict').hide();
    // // $('#select-xzqdmProvince').hide();

    $.ajax({
      type: "GET",
      url: "/api/xzqdm",
      async: false,
      data: {
        "xzqjb": "1"
      },
      dataType: "json",
      async: false,
      success: function (res) {
        provinceData = res;
        loadSelectOptionsXzqdm($('#select-xzqdmProvince'), provinceData);
        // $("#select-xzqdmProvince").prepend("<option value=''>请选择</option>");
        form.render(null, 'xzqdm-filter');

        $('.multiSelect').append('<input placeholder="请选择" style="line-height:2;background-color:#fff;border:none" disabled>');
        // if (sfnb === '0') {
        //   $('input[title="自定义截止时间"]').next().hide();
        // }
      },
      error: function (err) {
        console.log(err);
      }
    });

    $('#select-xzqdmCity').next().hide();
    $('#select-xzqdmDistrict').next().hide();


    form.on('select(xzqdmProvince-filter)', function (data) {
      // var xzqdmProvinceAmount = $('#select-xzqdmProvince').val().length;
      var xzqdmProvince = $('#select-xzqdmProvince').val();

      if (xzqdmProvince) {
        // $('#select-xzqdmDistrict').next().show();
        // $('#select-xzqdmCity').next().empty();
        // $('#select-xzqdmCity').next().show();
        var reqDataCity = {
          "xzqjb": "2",
          // "xzqdm": $('#select-xzqdmProvince').val()[0]
          "xzqdm": xzqdmProvince
        };

        $.ajax({
          type: "GET",
          url: "/api/xzqdm",
          // async: false,
          data: reqDataCity,
          dataType: "json",
          async: false,
          success: function (res) {
            cityData = res;
            loadSelectOptionsXzqdm($('#select-xzqdmCity'), cityData);
            // $('#select-xzqdmCity').append('<option value="">请选择</option>');
            // form.render();
            form.render(null, 'xzqdm-filter');

            $('#select-xzqdmDistrict').next().hide();
            // if (sfnb === '0') {
            //   $('input[title="自定义截止时间"]').next().hide();
            // }
          },
          error: function (err) {
            console.log(err);

          }
        });

      } else {
        $('#select-xzqdmCity').empty();
        $('#select-xzqdmCity').next().hide();
        $('#select-xzqdmDistrict').empty();
        $('#select-xzqdmDistrict').next().hide();
      }
    })

    form.on('select(xzqdmCity-filter)', function (data) {
      var xzqdmCityAmount = $('#select-xzqdmCity').val().length;

      if (xzqdmCityAmount === 1) {
        $('#select-xzqdmDistrict').next().show();

        var reqDataDistrict = {
          "xzqjb": "3",
          "xzqdm": $('#select-xzqdmCity').val()[0]
        };

        $.ajax({
          type: "GET",
          url: "/api/xzqdm",
          // async: false,
          data: reqDataDistrict,
          dataType: "json",
          async: false,
          success: function (res) {
            districtData = res;
            loadSelectOptionsXzqdm($('#select-xzqdmDistrict'), districtData);
            // form.render();
            form.render(null, 'xzqdmDistrict-filter');
            // if (sfnb === '0') {
            //   $('input[title="自定义截止时间"]').next().hide();
            // }
          },
          error: function (err) {
            console.log(err);

          }
        });

      } else {
        $('#select-xzqdmDistrict').next().hide();
      }
    })





    //------加载select选项的函数，利用handlebars进行渲染----------------------//
    function loadSelectOptions($selector, data) {
      var options = [];
      $.each(data, function (idx, obj) {
        options.push({
          mc: obj.mc,
          dm: obj.dm
        });
      });

      var tpl = $("#select-tpl").html();
      var rendered = RenderData(tpl, {
        option: options
      });
      $selector.append(rendered);
    }

    //------------------------------------加载多选行政区---------------------------------//
    function loadSelectOptionsXzqdm($selector, data) {
      var options = [{
        mc: '请选择',
        dm: ''
      }];
      $.each(data, function (idx, obj) {
        options.push({
          mc: obj.mc,
          dm: obj.dm
        });
      });

      var tpl = $("#select-tpl").html();
      var rendered = RenderData(tpl, {
        option: options
      });
      $selector.html(rendered);
    }

    //----------------------------------------------------------------------------------//

    function RenderData(tpl, data) {

      var template = Handlebars.compile(tpl);
      return template(data);
    }
    //----------------------------------------------------------------------------------//


    Array.prototype.remove = function (val) {
      var index = this.indexOf(val);
      if (index > -1) {
        this.splice(index, 1);
      }
    };



    $('#btn-delete').click(function () {
      var value = $('#input-sqxlm').val();

      console.log(value);

      if (value) {
        var sqxlmInputArr = value.split(',');
        console.log(sqxlmInputArr[0]);
        if (sqxlmInputArr.length === 1) {
          sqxlmsArray = [];
        }
        sqxlmsArray.remove(sqxlmInputArr[0]);
      } else {
        sqxlmsArray = [];
      }


      if (value.indexOf(',') > -1) {
        value = value.replace(/.*?\,/, '');
      } else {
        value = '';
      }
      $('#input-sqxlm').val(value);
      $('#input-file').val('');

      console.log(sqxlmsArray);


    });



    // form.on('select(cpdm-filter)',function(data){
    //     console.log(data.value);
    //     console.log( $('#select-cpdm').siblings('.layui-form-select').find('dd.layui-this').text() );

    // });

    form.on('submit(formApplication)', function (data) {
      // console.log(sqxlmsArray);
      var amountSqxlm = $('#input-sqxlm').val().split(',').length;
      console.log(amountSqxlm);

      if ($('#input-sqsl').val() !== amountSqxlm.toString()) {
        layer.msg('申请数量与授权序列码个数不一致，请修改！')
      } else if (amountSqxlm > 10) {
        layer.msg('申请数量不得超过10个，请修改！')
      } else {
        var reqDataApplication = {
          swhtmc: $('#input-swhtmc').val(),
          swlxr: $('#input-swlxr').val(),
          jzsjlx: $('input[name="jzsjlx"]:checked').val(),
          sqlx: $('#select-sqlx').val(),
          cpdm: $('#select-cpdm').val(),
          jmg: $('input[name="jmg"]:checked').val(),
          //xzqdm: '320101',
          sqsl: $('#input-sqsl').val(),
          // jzsj: new Date($('#input-jzsj').val()), //Date.parse(new Date($('#jzsj').val())),
          // sqxlm: $('#input-sqxlm').val(),
          sqxlm: sqxlmsArray.join(','),
          jfsy: $('input[name="jfsy"]:checked').val(),

          cpmc: $('#select-cpdm').siblings('.layui-form-select').find('dd.layui-this').text()
        };

        //测试默认320101
        if ($('#select-xzqdmDistrict').val().length !== 0) {
          reqDataApplication.xzqdm = $('#select-xzqdmDistrict').val().join(',');
        } else if ($('#select-xzqdmCity').val().length !== 0) {
          reqDataApplication.xzqdm = $('#select-xzqdmCity').val().join(',');
        } else {
          reqDataApplication.xzqdm = $('#select-xzqdmProvince').val();
        }

        if ($('#select-sqlx').val() === '2') {
          reqDataApplication.sqxks = $('#input-sqxks').val();
        }

        if ($('input[name="jzsjlx"]:checked').val() === '3') {
          var date = new Date($('#input-jzsj').val().replace(/-/g, '/'));
          reqDataApplication.jzsj = date.getTime();
        }

        console.log(reqDataApplication);

        $.ajax({
          url: ADDRESS_APPLY,
          type: 'POST',
          data: reqDataApplication,
          success: function (res) {
            if (res.code === '0000') {
              parent.layer.msg('申请完成，请等待审核');
              var index = parent.layer.getFrameIndex(window.name); //获取当前窗体索引
              parent.layer.close(index); //执行关闭
            } else {
              layer.alert(res.msg);
            }
            // window.parent.getApplicationInfo();
            console.log(res);
          },
          error: function (err) {
            console.log(err);
          }
        });
      }


      return false
    });


  })

})

var sqxlmsArray = [];

function selectSeries(file) {

  // var fileAccept = file.val().split(".")[1]; //获取上传文件的后缀  
  // if (fileAccept != ".dat") {
  //   alert("只能上传.doc和.docx的文件！");
  // }

  if (!file.files || !file.files[0]) {
    return;
  }

  for (var i = 0; i < file.files.length; i++) {
    var fileAccept = file.files[i].name.split(".")[1];
    if (fileAccept !== 'dat') {
      layer.msg('请上传.dat格式文件');
    } else {
      var reader = new FileReader();
      reader.readAsText(file.files[i]);
      reader.onload = function (evt) {
        var series = evt.target.result;
        console.log(series);
        //----------新增对授权序列码的控制--------------------------//
        if (series.indexOf(',') > -1) {
          layer.alert('上传的序列码内容不正确！')
          console.log(sqxlmsArray);
        } else {
          if (sqxlmsArray.indexOf(series) > -1) {
            layer.alert('存在重复授权序列码！')
          } else {
            var seriesStr = series + ',' + $('#input-sqxlm').val();
            $('#input-sqxlm').val(seriesStr.substr(0, seriesStr.length - 1));
            sqxlmsArray.push(series);
          }
        }

      }
    }
  }
  // var reader = new FileReader();
  // reader.readAsText(file.files[0]);
  // reader.onload = function (evt) {
  //   var series = evt.target.result;
  //   var seriesStr = series + ',' + $('#input-sqxlm').val();
  //   $('#input-sqxlm').val(seriesStr.substr(0, seriesStr.length - 1));
  // }
}