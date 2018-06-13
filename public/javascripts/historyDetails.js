$(function () {

  var ADDRESS_XZQMC = '/api/xzqmc';  

  var details = JSON.parse(window.sessionStorage.getItem('historyDetails'));
  // var sqrlx = JSON.parse(window.sessionStorage.getItem('sqrlx'));

  
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
  if (!details.swhtmc) {
    details.swhtmc = '无';
  }

  if (!details.swlxr) {
    details.swlxr = '无';
  }

  if (!details.sqxks) {
    details.sqxks = '无';
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


  var tpl = $("#historyDetails-tpl").html();
  //预编译模板
  var template = Handlebars.compile(tpl);
  //匹配json内容
  var content = template(details);
  //输入模板
  $("#historyDetails-container").html(content);
  
  // console.log(sqrlx);
  // if (sqrlx === 0) {
  //   $('#show-jfsy').hide();
  // }

  if(details.swhtmc !=='无'){
    $('#show-jfsy').hide();
  }
}
  
})