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
	
or manually set the map options ([google.maps.MapOptions](http://code.google.com/apis/maps/documentation/javascript/reference.html#MapOptions)):

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
	
	Add a custom event handler to the box tool.
	
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
		
		selmap.addMarkerGroup('group1', markerset);
		
		
		
*	**addPolygonListener(event_name, function)**

	Add a custom event handler to the polygon tool.
	
		selmap.addPolygonListener('dragpointstart', function() {
			//do stuff
		});
		
		
		
*	**clearBoxListener(,event_name)**

	Remove all custom event handlers from the box tool:
	
		selmap.clearBoxListener();
		
	or remove handlers for a specific event:
	
		selmap.clearBoxListener('dragstart');
		
*	**clearOverlays()**

	Remove box or polygon on map.
	
		selmap.clearOverlays();
		

*	**clearPolygonListener(,event_name)**

	Remove all custom event handlers from the polygon tool:
	
		selmap.clearPolygonListener();
		
	or remove handlers for a specific event:
	
		selmap.clearPolygonListener('dragpointstart');
		
		

*	**getSelectedGroupMarkers(group_name)**

	Returns selected markers for a particluar marker group(s).
	
		var markerGroups = selmap.getSelectedGroupMarkers( ['group1', 'group2'] );
		var group1 = markerGroups.group1;
		var group2 = markerGroups.group2;
		
	You can also get one group at a time, though this is slower than the method above:
	
		var group1 = selmap.getSelectedGroupMarkers('group1');
		var group2 = selmap.getSelectedGroupMarkers('group2');
		


*	**getSelectedMarkers()**

	Returns all selected markers.
	
		var markers = selmap.getSelectedMarkers();
		
	

*	**isSelected(marker)**

	Check if a specific marker is selected.
	
		if (selmap.isSelected(mymarker))
			alert('My marker is selected.');
			
	

*	**setBoxOptions(boxoptions)**

	Set options for the box rectangle ([google.maps.RectangleOptions](http://code.google.com/apis/maps/documentation/javascript/reference.html#RectangleOptions)).
	
		selmap.setBoxOptions({
			fillColor: 'green'
		});
		
		

*	**setPolygonOptions(polyoptions)**

	Set options for the polygon ([google.PolygonOptions](http://code.google.com/apis/maps/documentation/javascript/reference.html#PolygonOptions)).
	
		selmap.setPolygonOptions({
			fillColor: 'blue'
		});



*	**setTool(tool)**

	Set the current tool for the map.
	
		selmap.setTool(SMap.Tools.HAND);
		selmap.setTool(SMap.Tools.BOX);
		selmap.setTool(SMap.Tools.POLYGON);
		
		
		
### Options

### Events

Demos
-----

Coming soon...