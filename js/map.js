// US State Map
$(document).ready(function(){
	var stData = {};
	// SVG width and height
	var width = 580;
	var height = 380;
   	// Map project, scale, and centering
	var projection = d3.geoAlbers()
		.scale(750)
		.translate([width / 2, height / 2]);
	// Set up map path    
	var path = d3.geoPath()
		.projection(projection);
	// Create SVG    
	var svg = d3.select("#usMap").append("svg")
		.attr("width", width)
		.attr("height", height)
		.style("margin-top","60px")  
	// Queue up datasets using d3 Queue
	d3.queue()
	    .defer(d3.json, "data/us.json") // Load US Counties
	    .defer(d3.csv, "data/ncs_states.csv") // Load state data
	    .await(ready); // Run ready function when JSONs are loaded 
	// Ready Function, handle data once loaded
	function ready(error, us, sts) {
		if (error) throw error;
		// Add merged US states behind map of states - used for glow filter
		svg.append("path")
				.datum(topojson.merge(us, us.objects.states.geometries))
				.attr("class", "state-border")
				.attr("d", path);
		//Container for the glow filter
		var defs = svg.append("defs");
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
		// Append a group to SVG that binds TopoJSON data elements	
  		svg.append("g")
			.selectAll("path")
			.data(topojson.feature(us, us.objects.states).features) 
			.enter().append("path")
			.attr("d", path)
			.attr("class", "states")
		// Initialize sliders
		$( ".slider" ).slider({ orientation:"vertical", range:"min", min:1, max:11, value:11,
	    	slide: function( event, ui ) { 
	        	updatePage();
	      	}
	    });
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
		// Symbolize states and update table
		function updatePage(){
			var ncs_fields = [];
			var area_fields = [];
			// Get selected field names for mitigation and area
			$(".check-slide-group .slider").each(function(i,v){
				if ( !$(v).slider( "option", "disabled" ) ){
					ncs_fields.push( $(v).attr("id") + $(v).slider("value")*10 );
					area_fields.push( $(v).attr("id") + "area" );
				}	
			})
			var tbl_vals = [];
			var map_vals = {};
			var map_leg = [];
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
			})
			// Sort mitigation values	
			var tv = tbl_vals.sort(compareValues("ncs", "desc"));
			// Classify selected values for domain
			var geoSeries = new geostats(map_leg);
			var jenks = geoSeries.getClassJenks(4);
			// Create map and table symbology using classified values
			var stColor = d3.scaleThreshold()
		    	.domain(jenks)
		    	.range(["#dedede","#d9f0a3","#addd8e","#78c679","#31a354","#006837"]);
		    // Sum of NCS mitigation numbers 
		    var sumMit = map_leg.reduce((a, b) => a + b, 0);	
		    // Update mitigation total element
		    $("#mitPotNum").html( roundTo(sumMit/1000000,0) );
			d3.selectAll('.states')
           		// Update state colors on map with symbology created above
           		.transition()
           		.style( "fill", function(d){
           			if ( map_vals[d.id] && sumMit > 0 ){
                    	return stColor(map_vals[d.id]["ncs"]);
                    }else{
                    	return "#dedede" // State isn't listed in state csv data
                    }
            	}); 
            // Empty table body
			$("#emMitTbl").find('tbody').empty();
			// Add table rows and build legend into table cells with same color generator used to symbolize states
			$.each(tbl_vals,function(i,v){ 
				var mi = "#FFF";
				var mip = "padding-left:4px;";
				if (sumMit > 0){
					mi = stColor(v.ncs);
					mip = "padding-left:24px;"
				}
				$("#emMitTbl").find('tbody')
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

	