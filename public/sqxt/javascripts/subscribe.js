$(function () {
  var ADDRESS_ACCESSTOKEN = '/test/get_access_token';
  var ADDRESS_GETTICKET = '/test/get_qrcode_ticket';
  var ADDRESS_QRCODE = 'https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=TICKET';


  var lxdh = getQueryString("lxdh");
  getQrCode(lxdh);

  function getQueryString(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
    var url = decodeURI(window.location.search);
    var r = url.substr(1).match(reg);
    if (r != null) return (r[2]);
    return '';
  }

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
});