function generateCode(file,options) {  

    console.log(options);

  var codeLines = [
        '<!DOCTYPE html>',
        '<meta charset="utf-8">',
        '<style>',
        '',
        'path {',
        function() { if (options.strokeWidth > 0) return '  stroke-width: '+options.strokeWidth+'px;'; return null; },
        function() { if (options.strokeWidth > 0) return '  stroke: '+options.stroke+';'; return '  stroke: none;' },
        '  fill: '+options.fill+';',
        '  cursor: pointer;',
        '}',.length
        '',
        function() { if (options.highlight != options.fill) return 'path:hover, path.higlighted {';  return null; },
        function() { if (options.highlight != options.fill) return '  fill: '+options.highlight+';';  return null; },
        function() { if (options.highlight != options.fill) return '}'; return null; },
        function() { if (options.highlight != options.fill) return ''; return null; },
        '</style>',
        '<body>',
        '<script src="http://d3js.org/d3.v3.min.js"></script>',
        function(){ if (file.type == "topojson") return '<script src="http://d3js.org/topojson.v1.min.js"></script>'; return null; },
        '<script>',
        '',
        '//Map dimensions (in pixels)',
        'var width = '+options.width+',',
        '    height = '+options.height+';',
        '',
        '//Map projection',
        'var projection = d3.geo.'+options.projectionType+'()',
        function() {
            return '    .scale('+options.projection.scale()+')'+
            (("center" in options.projection) ? '' : ';') + ' //map scale'},
        function() {
            if ("center" in options.projection)
                return '    .center('+options.projection.center()+') //projection center';
            return null;
        },            
        function() {
            if ("parallels" in options.projection)
                return '    .parallels(['+options.projection.parallels().join(",")+']) //parallels for conic projection';
            return null;
        },
        function() {
            if ("parallels" in options.projection && "rotate" in options.projection)
                return '    .rotate(['+options.projection.rotate().filter(function(d){ return d; }).join(",")+']) //rotation for conic projection';
            return null;
        },
        function() {
            if ("center" in options.projection)
                return '    .translate(['+options.projection.translate().join(",")+']) //translate to center the map in view';
            return null;
        },          
        '',
        '//Generate paths based on projection',
        'var path = d3.geo.path()',
        '    .projection(projection);',
        '',
        '//Create an SVG',
        'var svg = d3.select("body").append("svg")',
        '    .attr("width", width)',
        '    .attr("height", height);',
        '',
        '//Group for the map features',
        'var features = svg.append("g")',
        '    .attr("class","features");',        
        '',
        function() { if (options.clickToZoom) return '//Keeps track of currently zoomed feature'; return null; },
        function() { if (options.clickToZoom) return 'var centered;'; return null; },
        function() { if (options.clickToZoom) return ''; return null; },,
        'd3.json('+file.name+',function(error,geodata) {',
        '  if (error) return console.log(error); //unknown error, check the console',
        '',
        '  //Create a path for each map feature in the data',
        '  features.selectAll("path")',
        function() {            
            if (file.type == "topojson") {
                for (var o in file.topology.objects) {
                    if (!o.match(/^[$_A-Za-z][$_A-Za-z0-9]+$/)) {
                        return '    .data(topojson.feature(geodata,geodata.objects["'+o.replace('"','\"')+'"])) //generate features from TopoJSON';
                    }
                    return '    .data(topojson(geodata,geodata.objects.'+o+')) //generate features from TopoJSON';
                }
            }
            return '    .data(geodata.features)';
        },
        '    .enter()',
        '    .append("path")',
        function() { return '    .attr("d",path)'+(options.clickToZoom ? '' : ';' ); },
        function() { if (options.clickToZoom) return '    .on("click",clicked);'; return null; },
        '',
        '});',
        ''
    ];


    if (options.clickToZoom) {

        codeLines = codeLines.concat([
                '//Zoom to feature on click',
                'function clicked(d) {',
                '',
                '  var x, y, k;',
                '',
                '  if (d && centered !== d) {',
                '    //Compute the new map center and scale to zoom to',
                '    var centroid = path.centroid(d);',
                '    var b = path.bounds(d);',
                '    x = centroid[0];',
                '    y = centroid[1];',
                '    k = .8 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height);',
                '    centered = d',                
                '  } else {',
                '    x = width / 2;',
                '    y = height / 2;',
                '    k = 1;',
                '    centered = null;',
                '  }',
                '',
                '  //Highlight the new feature',
                '  features.selectAll("path")',
                '      .classed("highlighted",function(d) {',
                '          return d === centered;',
                function() { return '      })'+(options.strokeWidth ? '' : ';' ); },
                function() { if (options.strokeWidth) return '      .attr("stroke-width", '+options.strokeWidth+' / k + "px"); //Scale the border thickness so it stays constant'; return null; },
                '',
                '  //Zoom and re-center the map',
                '  features.transition()',
                '      .duration(500)',
                '      .attr("transform","translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")");',
                '}',
                ''
            ]);
    }

    codeLines.push('</script>');    

    var result = codeLines
        .map(function(l) {
            return (typeof l === "function") ? l() : l;
        })
        .filter(function(l) {
            return l !== null;
        }).join("\n");

    return result;

}