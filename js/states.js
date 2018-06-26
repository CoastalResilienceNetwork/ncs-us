// For zoom to state
			// d3.selectAll('.states').select(function(d){
			// 	if (d.id == 8){

			// 	  	var x, y, k;

			// 		  if (d && centered !== d) {
			// 		    var centroid = path.centroid(d);
			// 		    x = centroid[0];
			// 		    y = centroid[1];
			// 		    k = 4;
			// 		    centered = d;
			// 		  } else {
			// 		    x = width / 2;
			// 		    y = height / 2;
			// 		    k = 1;
			// 		    centered = null;
			// 		  }

			// 		  g.selectAll("path")
			// 		      .classed("active", centered && function(d) { return d === centered; });

			// 		  g.transition()
			// 		      .duration(750)
			// 		      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
			// 		      .style("stroke-width", 1.5 / k + "px");

			// 	}
			// })