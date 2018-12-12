"use strict";
$(function () {
  var ADDRESS_RJCPLX = '/test/get_option/rjcplx';
  var ADDRESS_XZQDM = '/test/get_option/xzqdm';
  var ADDRESS_SWLXR = '/test/get_swlxr';
  var ADDRESS_APPLY = '/test/submitApplication';
  var ADDRESS_POSTINFO_TPL = '/test/get_postinfo_tpl';
  var ADDRESS_GETPOSTINFO = '/test/get_postinfo';
  var ADDRESS_SAVEPOSTINFO = '/test/save_postinfo';
  var ADDRESS_INVOICEINFO_TPL = '/test/get_invoiceinfo_tpl';
  var ADDRESS_GETINVOICEINFO = '/test/get_invoiceinfo';
  var ADDRESS_SAVEINVOICEINFO = '/test/save_invoiceinfo';

  var uuidv1 = require('uuidv1');

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
        /^[1-9][0-9]?$/, '许可数必须大于1,小于99'
      ],
      fixedTel: [
        /^(\(\d{3,4}\)|\d{3,4}-|\s)?\d{7,14}$/, '固定电话号码有误'
      ]
    });

    var formSelects = layui.formSelects;


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
        $('#select-xzqdmCity').removeAttr("multiple")
        $('#select-xzqdmCity').attr({
          'lay-verify': 'required'
        });

        // $('#select-cpdm').removeAttr("multiple");

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
        $('#select-swlxr').attr({
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
        $('#select-swlxr').attr({
          'lay-verify': 'required'
        });
        $('#div-sqxks').hide();
        $('#input-sqxks').attr({
          'lay-verify': ''
        });

        //甲方使用不允许产品多选
        // $('#select-cpdm').attr({
        //   'lay-verify': 'required'
        // });
        // $('#select-cpdm').val("");
        // $('#select-cpdm').removeAttr("multiple");
        // form.render(null, 'div-cpdm-filter');
        $('#div-djrj').hide();
        $('#select-sqlx').val('');
        form.render();
        $('#div-multiselect-cpdm').hide();
        $('#multiselect-cpdm').removeAttr('lay-verify');
        $('#multiselect-cpdm').siblings('.xm-select-parent').find('.xm-hide-input').removeAttr('lay-verify');
        $('#div-single-select-cpdm').show();
        $('#single-select-cpdm').val('');
        $('#single-select-cpdm').attr({
          'lay-verify': 'required'
        });
        loadSelectOptions($('#single-select-cpdm'), singleOptionData)
        form.render(null, 'div-single-cpdm-filter');

        $('#select-xzqdmCity').val("");
        $('#select-xzqdmProvince').val("");
        $('#select-xzqdmDistrict').val("");
        $('#select-xzqdmCity').removeAttr("multiple");
        form.render(null, 'xzqdm-filter');
        $('#select-xzqdmCity').next().hide();
        $('#select-xzqdmDistrict').next().hide();
      } else {
        $('#input-swhtmc').attr({
          'lay-verify': ''
        });
        $('#select-swlxr').attr({
          'lay-verify': ''
        });
        $('#input-swhtmc').val('');
        // $('#input-swlxr').val('');
        $('#select-swlxr').val('');
        $('#div-swhtmc').hide();
        $('#div-swlxr').hide();
        $('#div-sqxks').hide();
        $('#input-sqxks').attr({
          'lay-verify': ''
        });

        //内部申请允许产品多选
        // $('#select-cpdm').removeAttr("lay-verify");
        // $('#select-cpdm').val("");
        // $('#select-cpdm').attr("multiple", "multiple");
        // form.render(null, 'div-cpdm-filter');

        $('#select-sqlx').val('');
        form.render();
        $('#div-single-select-cpdm').hide();
        $('#single-select-cpdm').val('');
        $('#single-select-cpdm').removeAttr('lay-verify');
        $('#div-multiselect-cpdm').show();
        $('#multiselect-cpdm').siblings('.xm-select-parent').find('.xm-hide-input').attr({
          'lay-verify': 'required'
        });

        $('#select-xzqdmCity').val("");
        $('#select-xzqdmProvince').val("");
        $('#select-xzqdmDistrict').val("");
        $('#select-xzqdmCity').attr("multiple", "multiple");
        form.render(null, 'xzqdm-filter');
        $('#select-xzqdmCity').next().hide();
        $('#select-xzqdmDistrict').next().hide();

      }
    });


    //--------------------加载产品代码-----------------------//
    var multiOptionsData = [];
    var djrjData, otherrjData = [];
    var djrjDataOption, otherrjDataOption = [];
    var singleOptionData = [];
    $.ajax({
      url: ADDRESS_RJCPLX,
      async: false,
      success: function (data) {
        console.log(data);
        djrjData = data.filter(function (item) {
          return item.type == '1'
        });
        otherrjData = data.filter(function (item) {
          return item.type == '0'
        });

        singleOptionData = data;

        djrjDataOption = djrjData.map(function (item) {
          return {
            name: item.mc,
            value: item.dm
          }
        })

        otherrjDataOption = otherrjData.map(function (item) {
          return {
            name: item.mc,
            value: item.dm
          }
        })

        // multiOptionsData = data.map(function (item) {
        //   return {
        //     name: item.mc,
        //     value: item.dm
        //   }
        // })

        // layui.formSelects.data('multiselect-cpdm', 'local', {
        //   arr: multiOptionsData
        // });

        // loadSelectOptions($('#select-cpdm'), data)
        // form.render(null, 'div-cpdm-filter');
      },
      error: function (err) {
        console.log(err);
      }
    });

    // form.on('select(cpdm-filter)', function (data) {
    //   var $multiSelect = document.getElementsByClassName('multiSelect')[0]
    //   if ($multiSelect.scrollHeight > 38) {
    //     $multiSelect.style.height = $multiSelect.scrollHeight + 'px';
    //   }
    // })

    //----------------------------------------------------------------------//
    $('#div-single-select-cpdm').hide();
    //----------------满足单机授权和服务器授权的不同条件-----------------------------//
    form.on('select(sqlx-filter)', function (data) {
      var jfsy = $('input[name="jfsy"]:checked').val();
      // if (sfnb == '0' || jfsy == '1') {

      //   $('#div-multiselect-cpdm').hide();
      //   $('#multiselect-cpdm').removeAttr('lay-verify');
      //   $('#div-single-select-cpdm').show();
      //   $('#single-select-cpdm').attr({
      //     'lay-verify': 'required'
      //   });
      //   loadSelectOptions($('#single-select-cpdm'), singleOptionData)
      //   form.render(null, 'div-single-cpdm-filter');
      // }

      if (data.value === '2') {
        $('#div-multiselect-cpdm').hide();
        $('#multiselect-cpdm').removeAttr('lay-verify');
        $('#multiselect-cpdm').siblings('.xm-select-parent').find('.xm-hide-input').removeAttr('lay-verify');
        $('#div-single-select-cpdm').show();
        $('#single-select-cpdm').attr({
          'lay-verify': 'required'
        });
        loadSelectOptions($('#single-select-cpdm'), singleOptionData)
        form.render(null, 'div-single-cpdm-filter');

        $('#div-djrj').hide();
        $('#div-sqxks').show();
        $('#input-sqxks').attr({
          'lay-verify': 'required|over1'
        });
        $("#div-jmg").hide();

        $('.jmg-info').hide();
        $('.jmg-info input').removeAttr('lay-verify');
        $('#div-sqxlm').show();


      } else {
        if (sfnb == '1' && jfsy == '0') {
          $('#div-sqxks').hide();
          $('#input-sqxks').attr({
            'lay-verify': ''
          });
          $("#div-jmg").show();

          if ($('input[name="jmg"]:checked').val() == '1') {
            $('.jmg-info').show();
            $('.jmg-info input').attr({
              'lay-verify': 'required'
            });

            $('#input-sjrlxdh').attr({
              'lay-verify': 'required|phone'
            })

            $('#input-companylxdh').attr({
              'lay-verify': 'required|fixedTel'
            })
          }

          $('#div-djrj').show();

          $('#div-single-select-cpdm').hide();
          $('#single-select-cpdm').removeAttr('lay-verify');
          $('#div-multiselect-cpdm').show();
          formSelects.data('multiselect-cpdm', 'local', {
            arr: otherrjDataOption
          });
          $("[method|='反选']").hide();

        } else {
          $('#div-sqxks').hide();
          $('#input-sqxks').attr({
            'lay-verify': ''
          });
          $("#div-jmg").show();

          if ($('input[name="jmg"]:checked').val() == '1') {
            $('.jmg-info').show();
            $('.jmg-info input').attr({
              'lay-verify': 'required'
            });

            $('#input-sjrlxdh').attr({
              'lay-verify': 'required|phone'
            })

            $('#input-companylxdh').attr({
              'lay-verify': 'required|fixedTel'
            })
          }

          $('#div-multiselect-cpdm').hide();
          $('#multiselect-cpdm').removeAttr('lay-verify');
          $('#multiselect-cpdm').siblings('.xm-select-parent').find('.xm-hide-input').removeAttr('lay-verify');
          $('#div-single-select-cpdm').show();
          $('#single-select-cpdm').attr({
            'lay-verify': 'required'
          });
          loadSelectOptions($('#single-select-cpdm'), singleOptionData)
          form.render(null, 'div-single-cpdm-filter');
        }

      }

    });

    $('#input-sqxks').focus(function () {
      layer.tips('<span style="color:black">客户端允许连接的最大数量(2-99)</span>', '#div-sqxks', {
        tips: [1, '#f2f2f2']
      });
    });

    //选择是否为地籍软件，软件产品的多选下拉框加载对应软件
    form.on('radio(filter-djrj)', function (data) {
      // 默认为否，在下拉选择时，先加载非地籍软件
      console.log(data.value);
      if (data.value === '1') {
        console.log(djrjDataOption);

        formSelects.data('multiselect-cpdm', 'local', {
          arr: djrjDataOption
        });

        $("[method|='反选']").hide();

      } else {
        console.log(otherrjDataOption);

        formSelects.data('multiselect-cpdm', 'local', {
          arr: otherrjDataOption
        });

        $("[method|='反选']").hide();
      }

    })

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

    $('.jmg-info input').removeAttr('lay-verify');
    //---------------------选择加密狗模式----------------//
    form.on('radio(jmg-filter)', function (data) {
      if (data.value === '1') {
        // layer.alert('您需向我司提供加密狗方可制作授权！')

        //选择加密狗后，授权序列码隐藏，不必上传 2018.9.28
        $('#div-sqxlm').hide();

        $('.jmg-info').show();
        $('.jmg-info input').attr({
          'lay-verify': 'required'
        });

        $('#input-sjrlxdh').attr({
          'lay-verify': 'required|phone'
        })

        $('#input-companylxdh').attr({
          'lay-verify': 'required|fixedTel'
        })

        //序列码清空
        $('#input-sqxlm').val('');
        sqxlmsArray = [];
        fileDatArr = [];

        var optionLengthSjr = $('#select-sjrTpl').find("option").length;
        var optionLengthInvoice = $('#select-invoiceTpl').find("option").length;

        if (optionLengthSjr === 1) {
          $.ajax({
            type: "GET",
            url: ADDRESS_POSTINFO_TPL,
            success: function (res) {
              console.log(res);
              loadSelectOptions($('#select-sjrTpl'), res);
              form.render(null, 'sjrtpl-filter');
            }
          });
        }

        if (optionLengthInvoice === 1) {
          $.ajax({
            type: "GET",
            url: ADDRESS_INVOICEINFO_TPL,
            success: function (res) {
              console.log(res);
              loadSelectOptions($('#select-invoiceTpl'), res);
              form.render(null, 'invoiceTpl-filter');
            }
          });
        }


      } else {
        $('.jmg-info').hide();
        $('.jmg-info input').removeAttr('lay-verify');
        $('#div-sqxlm').show();
      }
    });


    form.on('select(sjrtpl-filter)', function (data) {
      var reqDataSjr = {
        post_index: data.value
      };
      $.ajax({
        type: "GET",
        url: ADDRESS_GETPOSTINFO,
        data: reqDataSjr,
        success: function (res) {
          console.log(res);
          if (res.code == '0000') {
            $('#input-sjr').val(res.sjr);
            $('#input-sjrlxdh').val(res.lxdh);
            $('#input-sjrdz').val(res.sjrdz);
            $('.post-info input').attr({
              disabled: 'disabled'
            });
            $('.post-info input').addClass('layui-disabled');
          } else {
            $('.post-info input').removeAttr('disabled');
            $('.post-info input').removeClass('layui-disabled');
            $('.post-info input').val('');
          }
        }
      });
    })

    form.on('select(invoiceTpl-filter)', function (data) {
      var reqDataInvoice = {
        invoice_index: data.value
      };
      $.ajax({
        type: "GET",
        url: ADDRESS_GETINVOICEINFO,
        data: reqDataInvoice,
        success: function (res) {
          console.log(res);
          if (res.code == '0000') {
            $('#input-company').val(res.companyName);
            $('#input-companylxdh').val(res.companyTel);
            $('#input-companydz').val(res.companyAddress);
            $('#input-tax').val(res.taxObjectId);
            $('#input-bank').val(res.bank);
            $('#input-account').val(res.account);
            $('.invoice-info input').attr({
              disabled: 'disabled'
            });
            $('.invoice-info input').addClass('layui-disabled');
          } else {
            $('.invoice-info input').removeAttr('disabled');
            $('.invoice-info input').removeClass('layui-disabled');
            $('.invoice-info input').val('');
          }
        }
      });
    })

    //------------------------------xzqdm多选三级联动--------------------------------//

    var provinceData = [];
    var districtData = [];
    var cityData = [];

    $.ajax({
      type: "GET",
      url: "/test/xzqdm",
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

      var loadCityData = [];

      if (xzqdmProvince) {
        var reqDataCity = {
          "xzqjb": "2",
          // "xzqdm": $('#select-xzqdmProvince').val()[0]
          "xzqdm": xzqdmProvince
        };

        $.ajax({
          type: "GET",
          url: "/test/xzqdm",
          // async: false,
          data: reqDataCity,
          dataType: "json",
          async: false,
          success: function (res) {
            cityData = res;
            loadSelectOptionsXzqdm($('#select-xzqdmCity'), cityData);
            form.render(null, 'xzqdm-filter');
            $('#select-xzqdmDistrict').next().hide();
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
      var reqDataDistrict = {};
      var jfsy = $('input[name="jfsy"]:checked').val();
      if (sfnb === '0' || jfsy === '1') {
        $('#select-xzqdmDistrict').next().show();
        // reqDataDistrict = {
        //   "xzqjb": "3",
        //   "xzqdm": $('#select-xzqdmCity').val()
        // };

        var reqSwlxrData = {
          xzqdm: $('#select-xzqdmCity').val()
        };
        $.ajax({
          type: "GET",
          url: ADDRESS_SWLXR,
          data: reqSwlxrData,
          success: function (res) {
            loadSelectOptionsSwlxr($('#select-swlxr'), res);
            form.render('select', 'swlxr-filter');

          }
        });
      } else {
        var xzqdmCityAmount = $('#select-xzqdmCity').val().length;
        console.log(xzqdmCityAmount);

        // if (xzqdmCityAmount === 1) {
        //   // $('#select-xzqdmDistrict').next().show();
        //   reqDataDistrict = {
        //     "xzqjb": "3",
        //     "xzqdm": $('#select-xzqdmCity').val()[0]
        //   };
        // } else {
        //   // $('#select-xzqdmDistrict').next().hide();
        //   reqDataDistrict = {
        //     "xzqjb": "3",
        //     "xzqdm": "000000"
        //   };
        // }
      }

      var cityNameArray = [];
      $('#select-xzqdmCity').siblings('.layui-form-select').find('.layui-form-checked').find('span').each(function () {
        cityNameArray.push($(this).text());
      });

      var cityXzqdm = $('#select-xzqdmCity').val();
      var loadDistrictData = [];
      console.log(cityXzqdm);

      if (typeof cityXzqdm == 'string') {
        $.ajax({
          type: "GET",
          url: "/test/xzqdm",
          async: false,
          data: {
            'xzqjb': 3,
            'xzqdm': cityXzqdm
          },
          dataType: "json",
          success: function (res) {
            console.log(res);
            var resultDistrictData = res.map(function (item) {
              return {
                name: item.mc,
                value: item.dm
              }
            });
            loadDistrictData = loadDistrictData.concat(resultDistrictData);
          },
          error: function (err) {
            console.log(err);
          }
        });
      } else {
        for (let i = 0; i < cityXzqdm.length; i++) {
          let cityCode = cityXzqdm[i];
          let cityName = cityNameArray[i];
          $.ajax({
            type: "GET",
            url: "/test/xzqdm",
            async: false,
            data: {
              'xzqjb': 3,
              'xzqdm': cityCode
            },
            dataType: "json",
            success: function (res) {
              console.log(res);
              var resultDistrictData = res.map(function (item) {
                return {
                  name: item.mc,
                  value: item.dm
                }
              });
              resultDistrictData.unshift({
                name: cityName,
                type: 'optgroup'
              });
              loadDistrictData = loadDistrictData.concat(resultDistrictData);
            },
            error: function (err) {
              console.log(err);

            }
          });
        }
      }

      console.log(loadDistrictData);

      formSelects.data('multiselect-district', 'local', {
        arr: loadDistrictData
      });

      $('#select-xzqdmDistrict').next().show();

      // loadMultiSelectOptionsXzqdm($('#select-xzqdmDistrict'), loadData);
      // form.render(null, 'xzqdm-filter');
      if (xzqdmCityAmount === 0) {
        $('#select-xzqdmDistrict').next().hide();
      }

      // $.ajax({
      //   type: "GET",
      //   url: "/test/xzqdm",
      //   // async: false,
      //   data: reqDataDistrict,
      //   dataType: "json",
      //   async: false,
      //   success: function (res) {
      //     districtData = res;
      //     loadSelectOptionsXzqdm($('#select-xzqdmDistrict'), districtData);
      //     // form.render();
      //     form.render(null, 'xzqdm-filter');
      //     if (xzqdmCityAmount > 1 || xzqdmCityAmount === 0) {
      //       $('#select-xzqdmDistrict').next().hide();
      //     }
      //   },
      //   error: function (err) {
      //     console.log(err);

      //   }
      // });
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

      // if (data[0].dm.slice(-2) !== '00') {
      //   $selector.append(rendered);        
      // } else {
      //   $selector.html(rendered);
      // }
    }

    function loadMultiSelectOptionsXzqdm($selector, data) {
      $selector.html('');
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

    function loadSelectOptionsSwlxr($selector, data) {
      var options = [{
        mc: '请选择（请确保行政区选择正确）',
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

      //原先一个dat一个dat的删
      // if (value) {
      //   var sqxlmInputArr = value.split(',');
      //   console.log(sqxlmInputArr[0]);
      //   if (sqxlmInputArr.length === 1) {
      //     sqxlmsArray = [];
      //     fileDatArr = [];
      //   }
      //   sqxlmsArray.remove(sqxlmInputArr[0]);
      //   for (var i = 0; i < fileDatArr.length; i++) {
      //     if (fileDatArr[i].indexOf(sqxlmInputArr[0]) > -1) {
      //       fileDatArr.splice(i, 1);
      //     }
      //   }
      // } else {
      //   sqxlmsArray = [];
      //   fileDatArr = [];
      // }

      // if (value.indexOf(',') > -1) {
      //   value = value.replace(/.*?\,/, '');
      // } else {
      //   value = '';
      // }
      // $('#input-file').val('');

      //点击删除清楚所有
      if (value) {
        sqxlmsArray = [];
        fileDatArr = [];
      } else {
        layer.msg('已经删除上传的dat文件');
      }
      $('#input-sqxlm').val('');
      $('#input-file').val('');

      console.log(sqxlmsArray);


    });



    form.on('submit(formApplication)', function (data) {
      // //2018/11/02
      // var cpmcArray = [];

      // $('#select-cpdm').siblings('.layui-form-select').find('.layui-form-checked').find('span').each(function () {
      //   cpmcArray.push($(this).text());
      // });

      // var cpdmArray = [];
      // if (!(typeof $('#select-cpdm').val() == 'string')) {
      //   cpdmArray = $('#select-cpdm').val();
      //   if (cpmcArray.length < cpdmArray.length) {
      //     cpdmArray = cpdmArray.filter(function (item, index, array) {
      //       return array.indexOf(item) === index;
      //     });
      //   }
      // }

      var amountSqxlm = $('#input-sqxlm').val().split(',').length;

      if (amountSqxlm === 1 && !$('#input-sqxlm').val().split(',')[0]) {
        amountSqxlm = amountSqxlm - 1;
      }

      console.log(amountSqxlm);
      // if (jfsy == '0' && cpmcArray.length === 0) {
      //   layer.alert('请选择软件产品');
      //   $('#select-cpdm').addClass('layui-form-danger');
      // } else 
      if ($('#input-sqsl').val() !== amountSqxlm.toString() && $('input[name="jmg"]:checked').val() != '1') {
        layer.msg('申请数量与授权序列码个数不一致，请修改！')
      } else if (amountSqxlm > 10) {
        layer.msg('申请数量不得超过10个，请修改！')
      } else {
        var jfsy = $('input[name="jfsy"]:checked').val();
        var sqlx = $('#select-sqlx').val();
        var singleSelectName = $('#single-select-cpdm').siblings('.layui-form-select').find('dd.layui-this').text();
        var reqDataApplication = {
          swhtmc: $('#input-swhtmc').val(),
          swlxr: $('#select-swlxr').val(),
          jzsjlx: $('input[name="jzsjlx"]:checked').val(),
          sqlx: sqlx,
          // cpdm: $('#select-cpdm').val(),
          // cpdm: (typeof $('#select-cpdm').val() === 'string') ? $('#select-cpdm').val() : cpdmArray.join(), //2018/11/02
          cpdm: (jfsy == '0' && sfnb == '1' && sqlx == '1') ? formSelects.value('multiselect-cpdm', 'valStr') : $('#single-select-cpdm').val(),
          jmg: $('input[name="jmg"]:checked').val(),
          sqsl: $('#input-sqsl').val(),
          sqxlm: "[" + fileDatArr.join(',') + "]",
          jfsy: jfsy,
          cpmc: (jfsy == '0' && sfnb == '1' && sqlx == '1') ? formSelects.value('multiselect-cpdm', 'nameStr') : singleSelectName,
          // cpmc: cpmcArray.length === 0 ? $('#select-cpdm').siblings('.layui-form-select').find('dd.layui-this').text() : cpmcArray.join(), //2018/11/02
          // cpmc: $('#select-cpdm').siblings('.layui-form-select').find('dd.layui-this').text(),
          remark: $('#input-remark').val()
        };

        var jmg = $('input[name="jmg"]:checked').val();

        if (jmg == '1') {
          var post_index = $('#select-sjrTpl').val();
          if (post_index == '0') {
            reqDataApplication.post_index = uuidv1();
            var reqDataPostInfo = {
              sjr: $('#input-sjr').val(),
              sjrdz: $('#input-sjrdz').val(),
              sjrlxdh: $('#input-sjrlxdh').val(),
              post_index: reqDataApplication.post_index
            };

            $.ajax({
              type: "POST",
              url: ADDRESS_SAVEPOSTINFO,
              data: reqDataPostInfo,
              success: function (res) {
                console.log(res);
              }
            });
          } else {
            reqDataApplication.post_index = post_index;
          }

          var invoice_index = $('#select-invoiceTpl').val();
          if (invoice_index == '0') {
            reqDataApplication.invoice_index = uuidv1();
            var reqDataInvoiceInfo = {
              invoice_index: reqDataApplication.invoice_index,
              company_name: $('#input-company').val(),
              company_address: $('#input-companydz').val(),
              company_tel: $('#input-companylxdh').val(),
              tax_objectid: $('#input-tax').val(),
              account: $('#input-account').val(),
              bank: $('#input-bank').val()
            };
            $.ajax({
              type: "POST",
              url: ADDRESS_SAVEINVOICEINFO,
              data: reqDataInvoiceInfo,
              success: function (res) {
                console.log(res);
              }
            });
          } else {
            reqDataApplication.invoice_index = invoice_index;
          }
        }

        var jfsy = $('input[name="jfsy"]:checked').val();
        //测试默认320101
        console.log('是否甲方使用', jfsy);
        console.log('是否内部使用', sfnb);

        if (sfnb === '1' && jfsy === '0') {
          console.log($('#select-xzqdmCity').val());
          if (formSelects.value('multiselect-district', 'valStr')) {
            // reqDataApplication.xzqdm = $('#select-xzqdmDistrict').val().join(',');
            reqDataApplication.xzqdm = formSelects.value('multiselect-district', 'valStr');
          } else if ($('#select-xzqdmCity').val().length !== 0 && $('#select-xzqdmCity').val()[0] !== '') {
            reqDataApplication.xzqdm = $('#select-xzqdmCity').val().join(',');
          } else {
            reqDataApplication.xzqdm = $('#select-xzqdmProvince').val();
          }
        } else {
          if (formSelects.value('multiselect-district', 'valStr')) {
            reqDataApplication.xzqdm = formSelects.value('multiselect-district', 'valStr');
            // reqDataApplication.xzqdm = $('#select-xzqdmDistrict').val().join(',');
            // reqDataApplication.xzqdm = $('#select-xzqdmCity').val(); //选择区县直接跳转给上一级市            
          } else if ($('#select-xzqdmCity').val().length !== 0 && $('#select-xzqdmCity').val()[0] !== '') {
            reqDataApplication.xzqdm = $('#select-xzqdmCity').val();
          } else {
            // reqDataApplication.xzqdm = $('#select-xzqdmProvince').val();
          }
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
              console.log(res);
              layer.alert(res.msg);
            }
          },
          error: function (err) {
            layer.msg(err);
          }
        });
      }
      return false
    });
  })

})

var sqxlmsArray = [];
var fileDatArr = [];
var fileDat;

$("#btn-reset").click(function () {
  sqxlmsArray = [];
})

function selectSeries(file) {
  if (!file.files || !file.files[0]) {
    return;
  }

  for (var i = 0; i < file.files.length; i++) {
    var index = file.files[i].name.split(".").length - 1;
    var fileAccept = file.files[i].name.split(".")[index];
    // console.log(fileAccept);
    if (fileAccept !== 'dat') {
      layer.msg('请上传.dat格式文件');
    } else {
      //获取dat文件名
      let fileName = file.files[i].name.slice(0, -4);
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
          if (sqxlmsArray.indexOf(series.trim()) > -1) {
            layer.alert('存在重复授权序列码！')
          } else {
            var seriesStr = series.trim() + ',' + $('#input-sqxlm').val();
            $('#input-sqxlm').val(seriesStr.substr(0, seriesStr.length - 1));
            sqxlmsArray.push(series.trim());

            fileDat = `{"name":"${fileName}","value":"${series.trim()}"}`;
            fileDatArr.push(fileDat);
          }
        }

      }
    }
  }
}