$(function () {

  var ADDRESS_XZQMC = '/api/xzqmc';

  var details = JSON.parse(window.sessionStorage.getItem('checkDetails'));
  

  var reqData = {
    'xzqdm':details.xzqdm.split(",")
  };
  
  $.ajax({
    url:ADDRESS_XZQMC,
    type: 'GET',
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
      
      renderToTpl();
    },
    error: function (err) {
      console.log(err); 
    }
  });

function renderToTpl() {
  layui.use(['layer'], function () {
    var layer = layui.layer;
    if (details.jzsj > details.xmjzsj) {
      layer.alert('请注意，此授权截止时间长于项目截止时间！',{title:'提醒'});
    }
  })


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
      details.blzt = '三审通过';
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
}
 

})