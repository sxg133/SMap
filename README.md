SMap
====

Author:	Sahil Grover

Date:	2011-11-09

A lasso extension for google maps

Documentation
-------------

### Overview

Turn a div into a google map that allows users to select multiple markers with a box or polygon.

Start by creating a basic div element:

    <div id="map" style="height: 500px; width: 600px;"> </div>
    
Next initialize the markerSelectMap class:

    var selmap = new SMap.markerSelectMap('map');
    
The map will not display until you either add some markers:

	var point1 = new google.maps.LatLng(41.404374,-81.663493);
	var point2 = new google.maps.LatLng(41.40189,-81.663716);
	
	var markers = [];
	
	var marker1 = new google.maps.Marker({
		position: point1
	});
	
	var marker2 = new google.maps.Marker({
		position: point2
	});
	
	markers.push(marker1);
	markers.push(marker2);
	
	selmap.setMarkers(markers);
	
or manually set the map options:

	selmap.map.setOptions({
		center: new google.maps.LatLng(-34.397, 150.644),
		mapTypeId: google.maps.MapTypeId.ROADMAP,
		zoom: 15
	});
	
Once you've added your markers, you can set the tool you want to use (Hand, Box, or Polygon):

	selmap.setTool(SMap.Tools.HAND);
	selmap.setTool(SMap.Tools.BOX);
	selmap.setTool(SMap.Tools.POLYGON);
	
Get the selected markers using the getSelectedMarkers method:

	var markers = selmap.getSelectedMarkers();
	


### Methods

*	**addBoxListener(event_name, function)**
	
	Add a custom event to the box tool.
	
		selmap.addBoxListener('dragstart', function(event) {
			//do stuff
		});
		
	For more details, see the Events section.
	
*	**addMarkerGroup(name, markerset)**

	Add a named group of markers to the map.
	
		var markers = [];

		var marker1 = new google.maps.Marker({
			position: new google.maps.LatLng(41.404374,-81.663493);
		});
		
		var marker2 = new google.maps.Marker({
			position: new google.maps.LatLng(41.40189,-81.663716);
		});
		
		markers.push(marker1);
		markers.push(marker2);
		
		selmap.addMarkerGroup('My Markers', markerset);

### Options

### Events

Demos
-----

Coming soon...