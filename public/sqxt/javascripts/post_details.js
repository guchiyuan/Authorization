$(function () {

  var details = JSON.parse(window.sessionStorage.getItem('checkDetails'));
  renderToTpl();
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

    if (!details.xmjzsj) {
      details.xmjzsj = '无';
    }

    var tpl = $("#checkDetails-tpl").html();
    //预编译模板
    var template = Handlebars.compile(tpl);
    //匹配json内容
    var content = template(details);
    //输入模板
    $("#checkDetails-container").html(content);
  }  
})