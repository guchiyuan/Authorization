'use strict';

var flowchart = JSON.parse(window.sessionStorage.getItem('flowchart'));
if (flowchart.bz) {
  var flowchart_bz = JSON.parse(flowchart.bz);
}
console.log(flowchart);



d3.select("svg").append("rect")
  .attr("x", 10)
  .attr("y", 10)
  .attr("width", 80)
  .attr("height", 30)
  .attr("fill", "#eee");

d3.select("svg").append("text").text('未办理')
  .attr("x", 20)
  .attr("y", 30);

d3.select("svg").append("rect")
  .attr("x", 10)
  .attr("y", 50)
  .attr("width", 80)
  .attr("height", 30)
  .attr("fill", "#EEE685");

d3.select("svg").append("text").text('正在办理').attr("x", 20)
  .attr("y", 70);

d3.select("svg").append("rect")
  .attr("x", 10)
  .attr("y", 90)
  .attr("width", 80)
  .attr("height", 30)
  .attr("fill", "#9AFF9A");

d3.select("svg").append("text").text('办理完成').attr("x", 20)
  .attr("y", 110);


// Create a new directed graph
var g = new dagreD3.graphlib.Graph().setGraph({
  align: "UL",
  nodesep: 200
});

var states_jf = ["申请", "一审", "二审", "三审", "制作授权", "申请已办结"];
var states_jf_zt = ["待审核", "一审通过", "二审通过", "审核通过", "申请已办结", "不予办理"];
if (flowchart.sfnb === '0') {
  states_jf.forEach(function (state) {
    g.setNode(state, {
      label: state
    });
  });

  // Set up the edges
  g.setEdge("申请", "一审", {
    label: "    一审人：" + flowchart.csr + "\n所属部门：" + flowchart.csrbm + "\n联系电话：" + flowchart.csrlxdh
  });
  // g.setEdge("一审", "不予办理", {
  //   label: "",
  // });
  g.setEdge("一审", "二审", {
    // labelpos: 'l',
    label: "    二审人：" + flowchart.fsr + "\n所属部门：" + flowchart.fsrbm + "\n联系电话：" + flowchart.fsrlxdh

  });
  // g.setEdge("二审", "不予办理", {
  //   label: ""
  // });

  g.setEdge("二审", "三审", {
    // labelpos: 'l',
    label: "    三审人：" + flowchart.sqshr + "\n所属部门：" + flowchart.sqshrbm + "\n联系电话：" + flowchart.sqshrlxdh

  });

  // g.setEdge("三审", "不予办理", {
  //   label: ""
  // });
  g.setEdge("三审", "制作授权", {
    // labelpos: 'l',
  });

  g.setEdge("制作授权", "申请已办结", {
    label: ""
  });
  // g.setEdge("制作授权", "不予办理", {
  //   label: ""
  // });


  if (flowchart.shzt === '申请已办结') {
    g.node('申请').style = "fill: #9AFF9A";
    g.node('一审').style = "fill: #9AFF9A";
    g.node('二审').style = "fill: #9AFF9A";
    g.node('三审').style = "fill: #9AFF9A";
    g.node('制作授权').style = "fill: #9AFF9A";
    g.node('申请已办结').style = "fill: #9AFF9A";
    // let blztIndex = states_jf.indexOf(flowchart.shzt);    
    // for (let i = 0; i < blztIndex; i++) {
    //   g.node(states_jf[i]).style = "fill: #9AFF9A";
    //   g.setEdge(states_jf[i], states_jf[i+1], {
    //     style: "stroke: #0fb2cc; fill: none;",
    //     arrowheadStyle: "fill: #0fb2cc;stroke: #0fb2cc;"
    //   }); 
    // }
  } else if (flowchart.shzt === '待审核') {
    g.node('申请').style = "fill: #9AFF9A";
    g.node('一审').style = "fill: #EEE685";
  } else if (flowchart.shzt === '不予办理' && flowchart_bz) {
    let blztIndex = states_jf.indexOf(flowchart_bz.shzt);

    for (let i = 0; i <= blztIndex; i++) {
      g.node(states_jf[i]).style = "fill: #9AFF9A";
    }

    g.setEdge(states_jf[blztIndex], states_jf[states_jf.length - 1], {
      label: ""
    });

    g.node(states_jf[states_jf.length - 1]).style = "fill: #9AFF9A";

  } else if (flowchart.shzt === '在线授权失败') {
    g.node('申请').style = "fill: #9AFF9A";
    g.node('一审').style = "fill: #9AFF9A";
    g.node('二审').style = "fill: #9AFF9A";
    g.node('三审').style = "fill: #9AFF9A";
    g.node('制作授权').style = "fill: #EEE685";
  } else {
    let blztIndex = states_jf_zt.indexOf(flowchart.shzt) + 1;
    for (let i = 0; i < blztIndex; i++) {
      g.node(states_jf[i]).style = "fill: #9AFF9A";

    }
    g.node(states_jf[blztIndex]).style = "fill: #EEE685";
  }
}

var states_nb = ["申请", "审核", "制作授权", "申请已办结"];
var states_nb_zt = ["待审核", "审核通过", "申请已办结", "不予办理"];
if (flowchart.sfnb === '1') {
  states_nb.forEach(function (state) {
    g.setNode(state, {
      label: state
    });
  });

  // Set up the edges
  g.setEdge("申请", "审核", {
    label: "    审核人：" + flowchart.csr + "\n所属部门：" + flowchart.csrbm + "\n联系电话：" + flowchart.csrlxdh
  });

  g.setEdge("审核", "制作授权", {});

  g.setEdge("制作授权", "申请已办结", {
    label: ""
  });




  if (flowchart.shzt === '申请已办结') {
    g.node('申请').style = "fill: #9AFF9A";
    g.node('审核').style = "fill: #9AFF9A";
    g.node('制作授权').style = "fill: #9AFF9A";
    g.node('申请已办结').style = "fill: #9AFF9A";
  } else if (flowchart.shzt === '待审核') {
    g.node('申请').style = "fill: #9AFF9A";
    g.node('审核').style = "fill: #EEE685";
  } else if (flowchart.shzt === '不予办理' && flowchart_bz) {
    let blztIndex = states_nb.indexOf(flowchart_bz.shzt);

    for (let i = 0; i <= blztIndex; i++) {
      g.node(states_nb[i]).style = "fill: #9AFF9A";

    }
    g.setEdge(states_nb[blztIndex], states_nb[states_nb.length - 1], {
      label: ""
    });
    g.node(states_nb[states_nb.length - 1]).style = "fill: #9AFF9A";
  } else if (flowchart.shzt === '在线授权失败') {
    g.node('申请').style = "fill: #9AFF9A";
    g.node('审核').style = "fill: #9AFF9A";
    g.node('制作授权').style = "fill: #EEE685";
  } else {
    let blztIndex = states_nb.indexOf("审核");
    for (let i = 0; i <= blztIndex; i++) {
      g.node(states_nb[i]).style = "fill: #9AFF9A";
    }
    g.node(states_nb[blztIndex + 1]).style = "fill: #EEE685";
  }
}

// Set some general styles
g.nodes().forEach(function (v) {
  var node = g.node(v);
  node.rx = node.ry = 5;
});



var svg = d3.select("svg"),
  inner = svg.select("g");

// Set up zoom support
var zoom = d3.behavior.zoom().on("zoom", function () {
  inner.attr("transform", "translate(" + d3.event.translate + ")" +
    "scale(" + d3.event.scale + ")");
});
// svg.call(zoom);

// Create the renderer
var render = new dagreD3.render();

// Run the renderer. This is what draws the final graph.
render(inner, g);

// Center the graph
var initialScale;
if (flowchart.sfnb === '0') {
  initialScale = 0.84;
} else {
  initialScale = 1.1;
}
zoom
  .translate([(svg.attr("width") - g.graph().width * initialScale) / 2, 20])
  .scale(initialScale)
  .event(svg);
svg.attr('height', g.graph().height * initialScale + 40);