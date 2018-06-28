// US State Map
$(document).ready(function(){
	// National map setup
		// SVG width and height for national map
		var naWidth = 580;
		var naHeight = 380;
	   	// National map project, scale, and centering
		var naProjection = d3.geoAlbers()
			.scale(750)
			.translate([naWidth / 2, naHeight / 2]);
		// Set up natinonal map path    
		var naPath = d3.geoPath()
			.projection(naProjection);
		// Create national map SVG    
		var naSvg = d3.select("#naMap").append("svg")
			.attr("width", naWidth)
			.attr("height", naHeight)
			.style("margin-top","60px")  

	// State map setup
		// SVG width and height for state map
		var stWidth = 560;
		var stHeight = 330;
	   	// National map project, scale, and centering
		var stProjection = d3.geoAlbers()
			.scale(700)
			.translate([stWidth / 2, stHeight / 2]);
		// Set up natinonal map path    
		var stPath = d3.geoPath()
			.projection(stProjection);
		// Create national map SVG    
		var stSvg = d3.select("#stMap").append("svg")
			.attr("width", stWidth)
			.attr("height", stHeight)
			.attr("class","stSvg")	
		// State fips selected by chosen menu
		var chFips = 0

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
				.attr("class", "state-border")
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
			d3.selectAll(".state-border")
				.style("filter", "url(#glow)");  
		
		// National map - append a group to SVG and bind TopoJSON data elements (states)	
  			naSvg.append("g")
				.selectAll("path")
				.data(topojson.feature(us, us.objects.states).features) 
				.enter().append("path")
				.attr("d", naPath)
				.attr("class", "naStates")

		// State map - append a group to SVG and bind TopoJSON data elements (states)	
  			var zoom = d3.zoom()
				.scaleExtent([1, 8])
				.on("zoom", zoomed);

  			var stG = stSvg.append("g");
  			
  			stG.append("path")
				.datum(topojson.merge(us, us.objects.states.geometries))
				.attr("class", "state-border1")
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
			d3.selectAll(".state-border1")
				.style("filter", "url(#glow1)");	

  			stG.append("g")
				.selectAll("path")
				.data(topojson.feature(us, us.objects.states).features) 
				.enter().append("path")
				.attr("d", stPath)
				.attr("class", "stStates")
				.on("click", clicked);		
			
			stSvg.call(zoom)
		// Event listeners needed inside ready function
			// Initialize sliders
			$( ".slider" ).slider({ orientation:"vertical", range:"min", min:1, max:11, value:11,
		    	slide: function( event, ui ) { 
		        	updatePage();
		      	}
		    });
		    // National, State, County toggle event listener
		    $(".toggle-btn input[name='nsc']").click(function(){
				$(".nsc-wrap").hide();
				$("#" + this.value).show();
				$("#mitpath-wrap").show();
			})
			// Trigger inital click on toggle
			$(".toggle-btn input[value='national']").trigger("click")
			// Checkbox listeners
			$(".check-slide-wrap input[type='checkbox']").click(function(){
				var tid = $(this).parent().parent().find(".slider").attr("id")
				var lbl = $(this).parent().parent().find("label");
				if (this.checked){
					$( "#" + tid ).slider( "enable" );
					$(lbl).css("color","#000");
				}else{
					$( "#" + tid ).slider( "disable" );
					$(lbl).css("color","#aaa");
				}
				updatePage();
			}) 
			$(".check-slide-wrap .check").click(function(){
				var cb = $(this).parent().find("input").trigger("click");
			})
			// Chosen state menu
			$("#chosenState").chosen({width:"155px", disable_search:true})
				.change(function(c){
					chFips = c.target.value;
					$(".trans").css("opacity","100");
					updatePage();
					var selst = $("#chosenState option:selected").text() 
					$("#stLegText").html("<b>" + selst + "</b>" + "'s<br>NCS Potential")
				})
			$.each(sts,function(i,v){
				var row = "<option value='" + v.state_fips + "'>" + v.state_name +"</option>"
				$("#chosenState").append(row);
			})	
			$("#chosenState").trigger("chosen:updated");

		// Symbolize states and update table
		function updatePage(){
			var ncs_fields = [];
			var area_fields = [];
			var ncs_max_fields = [];
			// Get selected field names for mitigation and area
			$(".check-slide-group .slider").each(function(i,v){
				if ( !$(v).slider( "option", "disabled" ) ){
					ncs_fields.push( $(v).attr("id") + $(v).slider("value")*10 );
					area_fields.push( $(v).attr("id") + "area" );
				}	
				ncs_max_fields.push( $(v).attr("id") + 110 );
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
				if ( $("#chosenState").val() == d.state_fips ){
					var mt = 0;
					var mtSum = 0;
					$.each(ncs_fields,function(i,v){
						var mid = v.substring(0, v.lastIndexOf("_") + 1);
						var lbl = $("#" + mid).parent().parent().find("label").html() 
						st_vals.push({pathway:lbl, mit:+d[v]})
						var num = +d[v]
						if ( num > -1 ){
							mt = mt + num;
						} 
					});
					$.each(ncs_max_fields,function(i,v){
						if ( +d[v] > -1 ){
							mtSum = +d[v] + mtSum;
						}
					})
					stPer = roundTo(mt/mtSum*100,0);
					$("#stMapLegBar").animate({
					    marginLeft: stPer + '%'
					}, 300);
					// Update state mitigation number		
					$("#stMitPotNum").html( roundTo(mt/1000000,0) )
					$("#stLegMax").html( roundTo(mtSum/1000000,0) ) 
					stTblData = st_vals.sort(compareValues("mit","desc"))
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
		    $("#mitPotNum").html( roundTo(sumMit/1000000,0) );
			d3.selectAll('.naStates')
           		// Update state colors on map with symbology created above
           		.transition()
           		.style( "fill", function(d){
           			if ( map_vals[d.id] && sumMit > 0 ){
                    	return naColor(map_vals[d.id]["ncs"]);
                    }else{
                    	return "#dedede" // State isn't listed in state csv data
                    }
            	}); 

           	// Empty national table body
			$("#naTbl").find('tbody').empty();
			// Add national table rows and build legend into table cells with same color generator used to symbolize states
			$.each(tbl_vals,function(i,v){ 
				var mi = "#FFF";
				var mip = "padding-left:4px;";
				if (sumMit > 0){
					mi = naColor(v.ncs);
					mip = "padding-left:24px;"
				}
				$("#naTbl").find('tbody')
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

			// State table
			$("#stTbl").find("tbody").empty();
			$.each(stTblData,function(i,v){
				if (v.mit == -9999){
					$("#stTbl").find('tbody')
						.append($('<tr>')
							.append($('<td>')
								.append(v.pathway)
							)
							.append($('<td>')
								.append("N/A")
							)
							.append($('<td>')
								.append(100)
							)
						);	
				}else{
					$("#stTbl").find('tbody')
						.append($('<tr>')
							.append($('<td>')
								.append(v.pathway)
							)
							.append($('<td>')
								.append(roundTo(v.mit/1000000,2))
							)
							.append($('<td>')
								.append(100)
							)
						);	
				}
					
			})	

			// State map
			d3.selectAll('.stStates')
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

			d3.selectAll('.stStates').select(function(d){
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
				      // .call(zoom.translate(translate).scale(scale).event); // not in d3 v4
				      .call( zoom.transform, d3.zoomIdentity.translate(translate[0],translate[1]).scale(scale) );

				}
			})

		}
		function clicked(d){
			$.each(sts,function(i,v){
				if(d.id == v.state_fips){
					$("#chosenState").val(d.id).trigger("chosen:updated").trigger("change");
				}
			})
		}
		function zoomed() {
		  stG.style("stroke-width", 1.5 / d3.event.transform.k + "px");
		  stG.attr("transform", d3.event.transform); // updated for d3 v4
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

	