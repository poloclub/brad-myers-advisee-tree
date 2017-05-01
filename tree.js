var margin = {top: 20, right: 120, bottom: 20, left: 120},
    width = 1700 - margin.right - margin.left,
    height = 1400 - margin.top - margin.bottom;

var i = 0,
    duration = 750,
    root;

var depthCounter = 0;

var tree = d3.tree()
    .size([height, width]);

var svg = d3.select("#tree").append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var stratify = d3.stratify()
  .id(function(d) {
    return d.name;//This position
  })
  .parentId(function(d) {
    return d.parent; //What position this position reports to
  });

function collapse(d) {
  if (d.children) {
      d._children = d.children;

    d._children.forEach(collapse);
    d.children = null;
  }
}

var nodeColor = "#845fb4";
var nodeColorNoChildren = "#ffffff";
var NodeStrokeColor = "#542988";

// var nodeColor = "#ffffff";
// var nodeColorNoChildren = "#ffffff";
// var NodeStrokeColor = "#cccccc";

var allChildren = [];

function getChildren(root) {

  root.children.each(function(d) {
    
    allChildren.push(d);
    
    if (d._children) {
      console.log(d);
      getChildren(d);
    }
  });

  return allChildren;
}

d3.csv("brad-test-after-clean.csv", function(error, data) {

  root = stratify(data);

  root.each(function(d) {

      d.name = d.id; //transferring name to a name variable
      d.id = i; //Assigning numerical Ids
      i++;

    });

  root.x0 = height / 2;
  root.y0 = 0;

  // allChildren = getChildren(root);

  root.children.forEach(collapse);
  // root.children.reverse();
  update(root);


  depthCounter = 1;
});

d3.select(self.frameElement).style("height", "800px");

function update(source) {

  console.log('update');

  // Compute the new tree layout.
  var nodes = tree(root).descendants(),
      links = nodes.slice(1);

  // console.log(nodes);

  allChildren = nodes;

  // Normalize for fixed-depth.
  nodes.forEach(function(d) { d.y = d.depth * 260; }); //100 for ribbon

  // Update the nodes…
  var node = svg.selectAll("g.node")
      .data(nodes, function(d) { return d.id || (d.id = ++i); });

  // Enter any new nodes at the parent's previous position.
  var nodeEnter = node.enter().append("g")
      .attr("class", "node")
      .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
      .on("click", click);

  nodeEnter.append("circle")
      .attr("r", 1e-6)
      .style("fill", nodeColor);

  nodeEnter.append("a")
      .attr("href", function(d) { return d.data.img; })
      .append("text")
      .attr("x", function(d) { return d.children || d._children ? -10 : 10; })
      .attr("dy", ".35em")
      .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
      .text(function(d) { return d.name; })
      .style("fill-opacity", 1e-6)
      .style("font-size", function(d) {
        if (d.depth === 1 || d.depth === 0) {
          return "14px";
        }
      });

  // Transition nodes to their new position.
  var nodeUpdate = node.merge(nodeEnter).interrupt().transition()
      .duration(duration)
      .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

  nodeUpdate.select("circle")
      .attr("r", 4.55) //2.5 for ribbon
      .style("fill", nodeColor)
      .style("stroke", function(d) { return d._children ? NodeStrokeColor : nodeColorNoChildren; })
      .style("stroke-width", function(d) { return d._children ? "5" : "0"; });

  nodeUpdate.select("text")
      .style("fill-opacity", 1);

  // Transition exiting nodes to the parent's new position.
  var nodeExit = node.exit().interrupt().transition()
      .duration(duration)
      .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
      .remove();

  nodeExit.select("circle")
      .attr("r", 1e-6);

  nodeExit.select("text")
      .style("fill-opacity", 1e-6);

  // Update the links…
  var link = svg.selectAll("path.link")
      .data(links, function(link) { var id = link.id + '->' + link.parent.id; return id; });

  // Transition links to their new position.
  link.interrupt().transition()
      .duration(duration)
      .attr("d", connector);

  // Enter any new links at the parent's previous position.
  var linkEnter = link.enter().insert("path", "g")
                        .attr("class", "link")
                        .attr("d", function(d) {
        var o = {x: source.x0, y: source.y0, parent:{x: source.x0, y: source.y0}};
        return connector(o);
      });

  // Transition links to their new position.
  link.merge(linkEnter).interrupt().transition()
      .duration(duration)
      .attr("d", connector);

  // Transition exiting nodes to the parent's new position.
  link.exit().interrupt().transition()
      .duration(duration)
      .attr("d",  function(d) {
        var o = {x: source.x, y: source.y, parent:{x: source.x, y: source.y}};
        return connector(o);
      })
      .remove();

  // Stash the old positions for transition.
  nodes.forEach(function(d) {
    d.x0 = d.x;
    d.y0 = d.y;
  });

}

// Toggle children on click.
function click(d) {
  if (d.children) {
    d._children = d.children;//.reverse(); // senior students at top
    d.children = null;
  } else {
    d.children = d._children;//.reverse(); // senior students at top
    d._children = null;
  }
  update(d);
  console.log('clicked!');
}

// replaces d3 v3 diagonal
function connector(d) {
  return "M" + d.y + "," + d.x +
    "C" + (d.y + d.parent.y) / 2 + "," + d.x +
    " " + (d.y + d.parent.y) / 2 + "," + d.parent.x +
    " " + d.parent.y + "," + d.parent.x;
}


// Expand and Collapse all
function expand(d){
    var children = (d.children)?d.children:d._children;

    if (d._children) {
        d.children = d._children;
        d._children = null;
    }
    if(children)
      children.forEach(expand);
}

function expandAll(){
    expand(root);
    update(root);
}

function collapseAll(){
    root.children.forEach(collapse);
    collapse(root);
    update(root);
}

function expandOne(){
    // root.children.forEach(click);
    // update(root);

    getDescendants(root);

}

function getDescendants(root) {
  // root.children.forEach(function(d) {

  //     getDescendants(d);

  // });

    var nodes = tree(root).descendants();
    console.log('nodes', nodes);
    nodes.forEach(function(d) {

      console.log(d.depth);

      if (d.depth === depthCounter && d.children !== undefined){
        console.log(d.children);
        expand_node(d);
        update(d);
      }
  });

  depthCounter = depthCounter + 1;
  console.log(depthCounter);

}

function collapseOne(){
    // root.children.forEach(click);
    // update(root);

    getDescendantsCollapse(root);

}

function getDescendantsCollapse(root) {
  // root.children.forEach(function(d) {

  //     getDescendants(d);

  // });

    var nodes = tree(root).descendants();
    console.log('nodes', nodes);
    nodes.forEach(function(d) {

      console.log(d.depth);

      if (d.depth === depthCounter-1 && d.children !== undefined){
        console.log(d.children);
        click(d);
      }
  });

  depthCounter = depthCounter - 1;
  console.log(depthCounter);

}

var clicked = 2;
var pastClicked = 2;

function expandOrCollapse() {

}

function expand_node(nod){
  if (nod._children) {
      nod.children = nod._children;
      nod._children = null;
  }
}

// function collapse_node(nod) {
//   if (nod.children) {
//     nod._children = nod.children;
//     nod.children = null;
//   }
// }

// function show_depth_n(cur_node, n){
//   console.log(cur_node.name);

//   if (cur_node._children){
//     if (d.depth < n) {
//       expand_node(cur_node);
//     }
//   }
//   if (cur_node.children){
//     cur_node.children.forEach(function(d) {
//       if (d.depth < n) {
//       	expand_node(d);
//         show_depth_n(d, n);

//       } else {
//         collapse_node(d);
//       }
//     });
//   }
//   update(cur_node);
// }

function show_depth_n2(cur_node, n){
  if (cur_node.children) {
    if (cur_node.depth < n) {
      // expand_node(cur_node);
      cur_node.children.forEach(function(d) {
        show_depth_n2(d, n);
      });
    } else {
      collapse(cur_node);
    }
    update(cur_node);
  } else {

    if (cur_node.depth < n) {
      expand_node(cur_node);
      update(cur_node);
      if(cur_node.children) {
        cur_node.children.forEach(function(d) {
        show_depth_n2(d, n);
        });
      }
    }
  }
}


function changeFontSize() {
  d3.selectAll('.node text').style('font-size', function(d) {
    switch (d.depth) {
      case 0:
        return '16px';
      case 1:
        return '16x';
      case 2:
        return '16px';
      case 3:
        return '16px';
      case 4:
        return '16px';
      case 5:
        return '16px';
      case 6:
        return '16px';
      default:
        return '16px';
    }
  });
}

function gen1() {
  console.log(allChildren);
  show_depth_n2(root, 1);
  // update(root);
  changeFontSize();
}

function gen2() {
  console.log(allChildren);
  show_depth_n2(root, 2);
  // update(root);
  changeFontSize();
}

function gen3() {
  console.log(allChildren);
  show_depth_n2(root, 3);
  // update(root);
  changeFontSize();
}

function gen4() {
  console.log(allChildren);
  show_depth_n2(root, 4);
  // update(root);
  changeFontSize();
}

function gen5() {
  console.log(allChildren);
  show_depth_n2(root, 5);
  // update(root);
  changeFontSize();
}

function gen6() {
  console.log(allChildren);
  show_depth_n2(root, 6);
  // update(root);
  changeFontSize();
}






