// US State Map
$(document).ready(function(){
	// National map setup
		// SVG width and height for national map
		var naWidth = 450;
		var naHeight = 290;
	   	// National map project, scale, and centering
		var naProjection = d3.geoAlbers()
			.scale(610)
			.translate([naWidth / 2, naHeight / 2]);
		// Set up natinonal map path    
		var naPath = d3.geoPath()
			.projection(naProjection);
		// Create national map SVG    
		var naSvg = d3.select("#usm-naMap").append("svg")
			.attr("id","usm-naSvg")
			.attr("width", "100%")
			.attr("height", "100%")
			.attr("viewBox", "0 0 450 290")
			.style("margin-left","30px")  

	// State map setup
		// SVG width and height for state map
		var stWidth = 450;
		var stHeight = 290;
	   	// National map project, scale, and centering
		var stProjection = d3.geoAlbers()
			.scale(610)
			.translate([stWidth / 2, stHeight / 2]);
		// Set up natinonal map path    
		var stPath = d3.geoPath()
			.projection(stProjection);
		// Create national map SVG    
		var stSvg = d3.select("#usm-stMap").append("svg")
			.attr("width", "100%")
			.attr("height", "100%")
			.attr("viewBox", "0 0 450 290")
			.attr("class","stSvg")	
		// State fips selected by chosen menu
		var chFips = 0

		 var sttracker = 0;
	// Queue up datasets using d3 Queue
	d3.queue()
	    .defer(d3.json, "data/us.json") // Load US Counties
	    .defer(d3.csv, "data/ncs_states.csv") // Load state data
	    .await(ready); // Run ready function when JSONs are loaded 
	
	// Ready Function, handle data once loaded
	function ready(error, us, sts) {
		// Check for error
		if (error) throw error;
		
		// Glow filter on national map
			// Add merged US states behind national map 
			naSvg.append("path")
				.datum(topojson.merge(us, us.objects.states.geometries))
				.attr("class", "usm-state-border")
				.attr("d", naPath);
			//Container for the glow filter
			var defs = naSvg.append("defs");
			//Filter for the outside glow
			var filter = defs.append("filter")
				.attr("id","glow")
			// Attribute the filter    
			filter.append("feGaussianBlur")
				.attr("stdDeviation","3")
				.attr("result","coloredBlur");
			// Apply glow filter to class
			d3.selectAll(".usm-state-border")
				.style("filter", "url(#glow)");  
		
		// National map - append a group to SVG and bind TopoJSON data elements (states)	
  			naSvg.append("g")
				.selectAll("path")
				.data(topojson.feature(us, us.objects.states).features) 
				.enter().append("path")
				.attr("d", naPath)
				.attr("class", "usm-naStates")

		// State map - append a group to SVG and bind TopoJSON data elements (states)	
  			var zoom = d3.zoom()
				.scaleExtent([1, 8])
				.on("zoom", zoomed);

  			var stG = stSvg.append("g");
  			
  			stG.append("path")
				.datum(topojson.merge(us, us.objects.states.geometries))
				.attr("class", "usm-state-border1")
				.attr("d", stPath);
			//Container for the glow filter
			var defs1 = stG.append("defs");
			//Filter for the outside glow
			var filter1 = defs1.append("filter")
				.attr("id","glow1")
			// Attribute the filter    
			filter1.append("feGaussianBlur")
				.attr("stdDeviation","1")
				.attr("result","coloredBlur");
			// Apply glow filter to class
			d3.selectAll(".usm-state-border1")
				.style("filter", "url(#glow1)");	

  			stG.append("g")
				.selectAll("path")
				.data(topojson.feature(us, us.objects.states).features) 
				.enter().append("path")
				.attr("d", stPath)
				.attr("class", "usm-stStates")
				.on("click", clicked)	
				.on('mouseover', mouseOver)	
				.on('mouseout', mouseOut)	
			
			stSvg.call(zoom)

		// Event listeners needed inside ready function
		    var tcd = "no";
		 	var locked = "open";
		 	// Mitigation pathway button clicks
		 	$(".usm-path-btn-wrap .usm-toggle-btn input").click(function(c){
		 		var endval = $(this).val().split("_").pop()
		 		var clickedVal = $(this).val();
		 		if (locked == "closed"){
		 			var len = $(".usm-path-btn-wrap .usm-toggle-btn input").length
			 		$(".usm-path-btn-wrap .usm-toggle-btn input").each(function(i,v){
			 			var val = v.value.split("_").pop()
			 			if (endval == val){
			 				$(v).prop("checked", true)
			 				if (endval == 0){
		 						$(this).parent().children().eq(1).css("background-color","#959595");
		 					}
			 			}else{
			 				if (endval != 0){
			 					$(this).parent().children().eq(1).css("background-color","#fff");
			 				}
			 			}
			 		})	
		 		}
		 		if (locked == "open"){
		 			if (endval == 0){
		 				$(this).parent().children().eq(1).css("background-color","#959595");
			 		}else{
						$(this).parent().children().eq(1).css("background-color","#fff");
			 		}
		 		}
		 		updatePage();
		 	})
		 	
		 	$("#usm-fullExtent").click(function(){
				stSvg.transition()
				      .duration(750)
				      .call( zoom.transform, d3.zoomIdentity.translate(0,0));
				setTimeout(
					function(){
				    	$("#usm-fullExtent").hide()
					}, 800);
		 	})

		 	$("#usm-lockOpen").click(function(){
		 		$("#usm-lockOpen").hide()
		 		$("#usm-lockClosed").show()
		 		locked = "closed";
		 		var fc = $(".usm-path-btn-wrap .usm-toggle-btn input:checked")[0];
		 		$(fc).trigger("click")
		 	})
		 	$("#usm-lockClosed").click(function(){
		 		$("#usm-lockClosed").hide()
		 		$("#usm-lockOpen").show()
		 		locked = "open";
		 	})
		 	$("#usm-infoOpen").click(function(){
		 		$("#usm-infoOpen").hide();
		 		$("#usm-infoClose").show();
		 		$(".usm-pw-desc").slideDown();
		 	})
		 	$("#usm-infoClose").click(function(){
		 		$("#usm-infoClose").hide();
		 		$("#usm-infoOpen").show();
		 		$(".usm-pw-desc").slideUp();
		 	})

		    // National, State, County toggle event listener
		    $(".usm-toggle-btn input[name='nsc']").click(function(){
				$(".usm-nsc-wrap").hide();
				$("." + this.value).show();
				$("#usm-mitpath-wrap").show();
				$(".usm-pathway-wrap").show()
				if (this.value == "usm-state" && sttracker == 0){
					$(".usm-pathway-wrap").hide()
				}

			})
			// Trigger inital click on toggle
			$(".usm-toggle-btn input[value='usm-national']").trigger("click")

		// Symbolize states and update table
		function updatePage(){ 
			var ncs_fields = [];
			var area_fields = [];
			var ncs_max_fields = [];
			var ncs_dis_fields = [];
			// Get field names for mitigation and area
			var ncst = [];
			$(".usm-path-btn-wrap .usm-toggle-btn input").each(function(i,v){
				if (v.checked){
					var p1 = v.value.substr(0, v.value.lastIndexOf("_"));
					var p2 = v.value.split("_").pop()
					if (p2 == 0){
						ncs_dis_fields.push(v.value)
					}else{
						ncs_fields.push(v.value)
						area_fields.push(p1 + "_area_" + p2)
					}
					ncs_max_fields.push(p1 + "_4")	
				}
			})
			var tbl_vals = [];
			var map_vals = {};
			var map_leg = [];
			var st_vals = [];
			var stTblData = [];
			var stPer = 0;
			sts.forEach(function(d){
				// Calculate mitigation values using selected fields
				var nn = 0;
				$.each(ncs_fields,function(i,v){
					if (d[v] > -1){
						nn = nn + Number(d[v])	
					}
				})
				var nval = Math.round(nn);
				// Calculate area values using selected fields
				var an = 0;
				$.each(area_fields,function(i,v){
					if (d[v] > -1){
						an = an + Number(d[v])	
					}
				})
				aval = Math.round( an )
				tbl_vals.push({id:d.state_fips, state:d.state_name, ncs:nval, area:aval})
				map_vals[d.state_fips] = {ncs:nval}		
				map_leg.push(nval)	
				// Calculate mitigation values for selected state
				if ( chFips == d.state_fips ){
					var mt = 0;
					var mtSum = 0;
					$.each(ncs_fields,function(i,v){
						var mid = v.substring(0, v.lastIndexOf("_") + 1);
						var ar = mid + "area_" + v.split("_").pop();
						mid = "usm-" + mid.slice(0, -1) + "0";
						var lbl = $("#" + mid).parent().parent().find(".usm-path-btn-label").html() 
						st_vals.push({pathway:lbl, mit:+d[v], area:+d[ar]})
						var num = +d[v]
						if ( num > -1 ){
							mt = mt + num;
						} 
					});
					$.each(ncs_dis_fields,function(i,v){
						var mid = v.substring(0, v.lastIndexOf("_") + 1);
						mid = "usm-" +mid.slice(0, -1) + "0";
						var lbl = $("#" + mid).parent().parent().find(".usm-path-btn-label").html() 
						st_vals.push({pathway:lbl, mit:-2222, area:-2222})
					});	
					$.each(ncs_max_fields,function(i,v){
						if ( +d[v] > -1 ){
							mtSum = +d[v] + mtSum;
						}
					})
					stPer = roundTo(mt/mtSum*100,0);
					$("#usm-stMapLegBar").animate({
					    marginLeft: stPer + '%'
					}, 500);
					// Update state emmissions total
					var et = roundTo(+d["emis_xlulc"]/1000000,0)
					$("#usm-st_emis_xlulc").html(et)
					// Update state mitigation number		
					$("#usm-stMitPotNum").html( roundTo(mt/1000000,0) )
					$("#usm-stLegMax").html( "<b>" + roundTo(mtSum/1000000,0) + "</b> (Max NCS potential)" ) 
					// Sort state table values on mitigation
					stTblData = st_vals.sort(compareValues("mit","desc"))
					// Update values to remove -9999 and -2222
					$.each(stTblData,function(i,v){
						if (v.mit == -2222){
							v.mit = "";
						}else{
							if(v.mit == -9999){
								v.mit = "N/A";
							}else{
								v.mit = roundTo(v.mit/1000000,2)
							}
						}
						if (v.area == -2222){
							v.area = "";
						}else{	
							if(v.area == -9999){
								v.area = "N/A";
							}else{
								v.area = roundTo(v.area/1000000,2)
							}
						}	
					})

				}
			})
			var stColor = d3.scaleThreshold()
				.domain([0,20,40,60,80,100])
				.range(["#dedede","#d9f0a3","#addd8e","#78c679","#31a354","#006837"])
			// Sort mitigation values	
			var tv = tbl_vals.sort(compareValues("ncs", "desc"));
			// Classify selected values for domain
			var geoSeries = new geostats(map_leg);
			var jenks = geoSeries.getClassJenks(4);
			// Create map and table symbology using classified values
			var naColor = d3.scaleThreshold()
		    	.domain(jenks)
		    	.range(["#dedede","#d9f0a3","#addd8e","#78c679","#31a354","#006837"]);
		    // Sum of NCS mitigation numbers 
		    var sumMit = map_leg.reduce((a, b) => a + b, 0);	
		    // Update mitigation total element
		    $("#usm-mitPotNum").html( roundTo(sumMit/1000000,0) );
			d3.selectAll('.usm-naStates')
           		// Update state colors on map with symbology created above
           		.transition()
           		.style( "fill", function(d){
           			if ( map_vals[d.id] && sumMit > 0 ){
           				if (map_vals[d.id]["ncs"]/1000000 > 0.4){
	                    	return naColor(map_vals[d.id]["ncs"]);
                    	}else{
                    		return "#dedede"
                    	}
                    }else{
                    	return "#dedede" // State isn't listed in state csv data
                    }
            	}); 

           	// Empty national table body
			$("#usm-naTbl").find('tbody').empty();
			// Add national table rows and build legend into table cells with same color generator used to symbolize states
			$.each(tbl_vals,function(i,v){ 
				var mi = "#dedede";
				var mip = "padding-left:24px;";
				if (sumMit > 0){
					if (v.ncs/1000000 > 0.4){
						mi = naColor(v.ncs);
					}	
				}
				$("#usm-naTbl").find('tbody')
					.append($('<tr>')
						.append($('<td>')
							.append(v.state)
						)
						.append($('<td style="background:linear-gradient(to right, ' + mi + ' 0, ' + mi + ' 20px, #FFF 20px, #FFF 100%); ' + mip +'">')
							.append( roundTo(v.ncs/1000000,1) )
						)
						.append($('<td>')
							.append( roundTo(v.area/1000000,1) )
						)
					);
			});	
			document.getElementById("usm-nat-tbl-wrap").addEventListener("scroll",function(){
			   var translate = "translate(0,"+this.scrollTop+"px)";
			   
			   const allTh = this.querySelectorAll("th");
			   for( let i=0; i < allTh.length; i++ ) {
			     allTh[i].style.transform = translate;
			   }
			});

			// State table
			$("#usm-stTbl").find("tbody").empty();
			$.each(stTblData,function(i,v){
				if (v.mit.length == 0){
					$("#usm-stTbl").find('tbody')
						.append($('<tr style="text-decoration:line-through;">')
							.append( $('<td>').append(v.pathway) )
							.append( $('<td>').append("") )
							.append( $('<td>').append("") )
						);	
				}else{
					$("#usm-stTbl").find('tbody')
						.append($('<tr>')
							.append( $('<td>').append(v.pathway) )
							.append( $('<td>').append(v.mit) )
							.append( $('<td>').append(v.area) )
						);	
				}						
			})	

			// State map
			d3.selectAll('.usm-stStates')
           		.transition()
           		.style( "fill", function(d){ 
           			if (d.id == chFips){
           				return stColor(stPer);
           			}else{
           				if (map_vals[d.id]){
           					return "#b8b8b8";
           				}else{
           					return "#dedede";
           				}
           			}
           		})
           		.style("cursor",function(d){
           			if ( d.id != chFips && map_vals[d.id] ){
           				return "pointer";
           			}
           		})

			d3.selectAll('.usm-stStates').select(function(d){
				if (d.id == chFips){

				  	  var bounds = stPath.bounds(d),
				      dx = bounds[1][0] - bounds[0][0],
				      dy = bounds[1][1] - bounds[0][1],
				      x = (bounds[0][0] + bounds[1][0]) / 2,
				      y = (bounds[0][1] + bounds[1][1]) / 2,
				      scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / stWidth, dy / stHeight))),
				      translate = [stWidth / 2 - scale * x, stHeight / 2 - scale * y];

				  stSvg.transition()
				      .duration(750)
				      .call( zoom.transform, d3.zoomIdentity.translate(translate[0],translate[1]).scale(scale) );

				}
			})
		}
		function clicked(d){
			$.each(sts,function(i,v){
				if(d.id == v.state_fips){
					sttracker = 1;
					chFips = d.id;
					$(".usm-trans").slideDown();
					$(".usm-pathway-wrap").slideDown()
					updatePage();
					$("#usm-stLegText").html("<b>" + v.state_name + "</b>" + "'s Selected<br>NCS Potential")
					$("#usm-stateName").html(v.state_name)
				}
			})
			$("#usm-fullExtent").show();
		}
		function mouseOver(d){
			var cs = this;
			$.each(sts,function(i,v){
				if(d.id == v.state_fips && d.id != chFips){
					d3.select(cs).style("fill", "#88b8b8");
				}
			})	
		}
		function mouseOut(d){
			var cs = this;
			$.each(sts,function(i,v){
				if(d.id == v.state_fips && d.id != chFips){
					d3.select(cs).style("fill", "#b8b8b8");
				}
			})	
		}
		function zoomed() {
		  stG.style("stroke-width", 1.5 / d3.event.transform.k + "px");
		  stG.attr("transform", d3.event.transform); // updated for d3 v4
		  $("#usm-fullExtent").show();
		}
		// Call funtion to update map and table the first time the page loads
		updatePage();
	}
	// Sorts array of objects
	function compareValues(key, order='asc') {
	  return function(a, b) {
	    if(!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
	        return 0; 
	    }
	    const varA = (typeof a[key] === 'string') ? 
	      a[key].toUpperCase() : a[key];
	    const varB = (typeof b[key] === 'string') ? 
	      b[key].toUpperCase() : b[key];
	    let comparison = 0;
	    if (varA > varB) { comparison = 1; } 
	    	else if (varA < varB) { comparison = -1; }
	    return (
	      (order == 'desc') ? (comparison * -1) : comparison
	    );
	  };
	}
	// Adds commas to large numbers
	function commaSeparateNumber(val){
		while (/(\d+)(\d{3})/.test(val.toString())){
			val = val.toString().replace(/(\d+)(\d{3})/, '$1'+','+'$2');
		}
		return val;
	}
	// Rounds numbers to sepcified decimal points (digits)
	function roundTo(n, digits) {
		if (digits === undefined) {
		    	digits = 0;
		    }
		    var multiplicator = Math.pow(10, digits);
			n = parseFloat((n * multiplicator).toFixed(11));
			var test =(Math.round(n) / multiplicator);
			return +(test.toFixed(2));
	}
})

	