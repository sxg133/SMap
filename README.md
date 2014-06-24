SMap
====

Author:	Sahil Grover

Date:	2011-11-09

A lasso extension for google maps

Documentation
-------------

### Overview

Turn a div into a google map that allows users to select multiple markers with a box or polygon.

Start by including the required scripts:

	<script type="text/javascript" src="http://maps.googleapis.com/maps/api/js?v=3&sensor=false"></script>
	<script type="text/javascript" src="https://raw.github.com/tparkin/Google-Maps-Point-in-Polygon/master/maps.google.polygon.containsLatLng.js"></script>
	<script type="text/javascript" src="SMap.js"></script>

Next, create a basic div element:

    <div id="map" style="height: 500px; width: 600px;"> </div>
    
Then initialize the MarkerSelectMap class:

	var selmap = new SMap.MarkerSelectMap('map', {
		mapTypeId: google.maps.MapTypeId.ROADMAP
	});
    
The map will not display until you add some markers:

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

*	**dragpolyonhand**

	Allow the user to drag the point of the polygon while using the hand tool.
	
		selmap.dragpolyonhand = true;
		
*	**polyicon**

	Set a custom icon for the points on the polygon.
	
		selmap.polyicon = 'url to my icon'.
		


### Events

You can add custom event handlers to the box and polygon tools.
	
*	**Box Events**

	*	_dragstart_ -- will trigger when the user first clicks on the map with the box tool.
	*	_drag_ -- will trigger continuously while the user is dragging the mouse on the map.
	*	_dragstop_ -- will trigger when the user releases the drag.
	
*	**Polygon Events**

	*	_addpoint_ -- will trigger when the user adds a new point to the polygon.
	*	_removepoint_ -- will trigger when the user removes a new point to the polygon.
	*	_dragpointstart_ -- will trigger when the user starts to drag a point on the polygon.
	*	_dragpoint_ -- will trigger continuously while the user is dragging a point on the polygon.
	*	_dragpointend_ -- will trigger when the user release the drag on a polygon point.
	
	

Demos
-----

*	**basic.html**

	The most basic use of the extension.  Simple marker setting and selecting.
	
*	**markerGroups.html**

	Demonstrates grouping markers into groups, and distinguishing between which selected markers are in which groups.
	

