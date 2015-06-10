  var duration = 1;
  var width = 300
  var height = 300
  var radius = Math.floor(Math.min(width/2, height/2) * 0.9);
  var color = d3.scale.category20();
      color.range(["#FF99FF","#CC3300"]);
   
  var data =   [{"label":"LOVE", "value":1}, 
                {"label":"HATE", "value":1}];

  var updateChart = function(dataset) {

    arcs.data(donut(dataset))
        .enter()
        .append("path")
        .attr("stroke", "white")
        .attr("stroke-width", 0.8)
        .attr("fill", function(d, i) { return color(i); })
        .attr("d", arc);

    arcs.transition()
      .duration(duration)
      .ease("elastic")
      .attrTween("d", arcTween);

    sliceLabel.data(donut(dataset));

    sliceLabel.transition()
      .duration(duration)
      .attr("transform", function(d) { return "translate(" + (arc.centroid(d)) + ")"; })
      .style("fill-opacity", function(d) {
        if (d.value === 0) { return 1e-6; }
        else { return 1; }
      });
      
    sliceLabel.data(donut(dataset)).enter()
    .append("text")
    .attr("class", "arcLabel")
    .attr("transform", function(d) { return "translate(" + (arc.centroid(d)) + ")"; })
    .attr("text-anchor", "middle")
    .style("fill-opacity", function(d) {
      if (d.value === 0) { return 1e-6; }
      else { return 1; }
    })
    .text(function(d) { return d.data.label; });
  };

  var donut = d3.layout.pie()
    .sort(null)
    .value(function(d) { return d.value; });

  var arc = d3.svg.arc()
    .innerRadius(radius * .4)
    .outerRadius(radius);

  var svg = d3.select("body")
    .append("svg")
    .attr("class", "canvas")
        .attr("width", width)
        .attr("height", height)
    .append("svg")
      .attr("width", width)
      .attr("height", height);

  var arc_grp = svg.append("g")
    .attr("class", "arcGrp")
    .attr("transform", "translate(" + (width / 2) + "," + (height / 2) + ")");

  var label_group = svg.append("g")
    .attr("class", "lblGroup")
    .attr("transform", "translate(" + (width / 2) + "," + (height / 2) + ")");

  var arcs = arc_grp.selectAll("path")
    .data(donut(data));

  arcs.enter()
    .append("path")
    .attr("stroke", "white")
    .attr("stroke-width", 0.8)
    .attr("fill", function(d, i) { return color(i); })
    .attr("d", arc)
    .each(function(d) { return this.current = d; });

  var sliceLabel = label_group.selectAll("text")
    .data(donut(data));

  sliceLabel.enter()
    .append("text")
    .attr("class", "arcLabel")
    .attr("transform", function(d) { return "translate(" + (arc.centroid(d)) + ")"; })
    .attr("text-anchor", "middle")
    .style("fill-opacity", function(d) {
      if (d.value === 0) { return 1e-6; }
      else { return 1; }
    })
    .text(function(d) { return d.data.label; });

  // Tween Function
  var arcTween = function(a) {
    var i = d3.interpolate(this.current, a);
    this.current = i(0);
    return function(t) { return arc(i(t)); };
  };
  
  var socket = io.connect();
  var counter = 0;

    socket.on('tweet', function (live_data) {

      counter++;
	
      // console.log(live_data);

      data = [{"value":~~live_data.love},   
              {"value":~~live_data.hate}];
      
      updateChart(data);

    });