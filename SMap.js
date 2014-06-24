/*
 * Author: Sahil Grover
 * Description: A lasso extension for google maps to allow users to select multiple markers at a time
 * Requires:
 * 		Google Maps v3 API
 * 		Polygon contains LatLng (https://raw.github.com/tparkin/Google-Maps-Point-in-Polygon/master/maps.google.polygon.containsLatLng.js)
 */

"use strict";


/**
 * Google Marker Select Map Extension Namespace
 */
var SMap = SMap || {};

(function() {
	
	/**
	 * Enum for current tool
	 */
	SMap.Tools = {HAND:0, BOX:1, POLYGON:2}

	/**
	 * Class for turning a div into a Google Map with selectable markers
	 */
	SMap.MarkerSelectMap = function(mapId, mapOptions) {
		/** Private Members */
		var markerGroups = {};			//holds multiple named marker sets
		var mapMarkers = [];			//list of map markers
		var markerBounds;				//LatLngBounds for current marker set
		var mapTool = SMap.Tools.HAND;	//selected map tool
		
		//box vars
		var mouseDown;					//true if mouse button is currently being held down
		var box;						//google maps rectangle (user drags to create box)
		var downPoint;					//initial click point when box was started
		var mouseUpAdded = false;		//checks if mouseuplistener has already been added (workaround for no mouseup event on map)
		var boxListeners = 				//user events for box (dragStart,drag,dragEnd,click)
			{
				dragStart:[],
				drag:[],
				dragEnd:[],
				click:[]
			};
		
		//poly vars
		var poly;						//google maps polygon
		var polyMarkers = [];			//markers used to denote polygon edges
		var path;						//polygon path array
		var polyListeners = 			//user events for polygon
			{
				addPoint: [],
				removePoint: [],
				dragPointStart: [],
				dragPoint: [],
				dragPointend: []
			}
		
		var thisSelectMap = this;				//allow private functions to access public class variables
		
		
		/** Public Members */
		this.polyIcon;						//icon for polygon
		this.allowDragPolyOnHand = false;	//can user drag the polygon markers when the hand tool is selected
		
		//initialize map
		this.map = new google.maps.Map(document.getElementById(mapId), mapOptions);
		
		/**
		 * Sets new map markers
		 */
		this.setMarkers = function(markers) {
			//first clear the current map markers
			clearMapMarkers();
			//initialize bounds
			markerBounds = new google.maps.LatLngBounds();
			mapMarkers = markers;

			if (!mapMarkers || mapMarkers.length === 0) {
				return;
			}

			if (mapMarkers.length > 1) {
				for (var i=0, len=mapMarkers.length; i<len; i++) {
					//set map
					mapMarkers[i].setMap(this.map);
					//extend bounds
					markerBounds.extend(mapMarkers[i].position);
				}
				//set bounds
				this.map.fitBounds(markerBounds);
			}

			else if (mapMarkers.length === 1) {
				mapMarkers[0].setMap(this.map);
				this.map.setOptions({
					center: mapMarkers[0].getPosition(),
					zoom: 15
				});
			}
		}
		
		/**
		 * Add a marker group
		 */
		this.addMarkerGroup = function(name, markerset) {
			mapMarkers = mapMarkers.concat(markerset);
			markerBounds = new google.maps.LatLngBounds();
			if (mapMarkers.length > 1) {
				for (var i=0, len=mapMarkers.length; i<len; i++) {
					//set map
					mapMarkers[i].setMap(this.map);
					//extend bounds
					markerBounds.extend(mapMarkers[i].position);
				}
				//set bounds
				this.map.fitBounds(markerBounds);

			} else if (mapMarkers.length === 1) {
				this.map.setOptions({
					center: mapMarkers[0].getPosition(),
					zoom: 15
				})
				mapMarkers[0].setMap(this.map);
			}
			markerGroups[name] = markerset;
		}
		
		/**
		 * Change Map Tool
		 */
		this.setTool = function(tool) {
			if (mapTool === tool) {
				return;
			}
				
			//remove all event listeners
			google.maps.event.clearListeners(this.map, 'click');
			google.maps.event.clearListeners(this.map, 'mousemove');
			google.maps.event.clearListeners(this.map, 'mousedown');
			
			if (box) {
				google.maps.event.clearListeners(box, 'mousemove');
				google.maps.event.clearListeners(box, 'click');
			}
			if (poly) {
				google.maps.event.clearListeners(poly, 'click');
			}
				
			switch (tool) {
				case SMap.Tools.HAND:
					handTool();
					break;
				case SMap.Tools.BOX:
					boxTool();
					break;
				case SMap.Tools.POLYGON:
					polygonTool();
					break;
			}
		}
		
		/**
		 * Returns an array of the selected markers
		 */
		this.getSelectedMarkers = function() {
			var selectedMarkers = [];
			for (var i=0, len=mapMarkers.length; i<len; i++) {
				if (this.isSelected(mapMarkers[i])) {
					selectedMarkers.push(mapMarkers[i]);
				}
			}
			return selectedMarkers;
		}
		
		/**
		 * Get selected markers in a particular marker group(s)
		 */
		this.getSelectedGroupMarkers = function(groupName) {
			if (typeof(groupName) === 'string') {
				groupName = [groupName];
			}
			
			var selectedMarkers = {};
			
			for (var i=0, len=groupName.length; i<len; i++) {
				selectedMarkers[groupName[i]] = [];
				for (var j=0, len=markerGroups[groupName[i]].length; j<len; j++) {
					if (this.isSelected(markerGroups[groupName[i]][j])) {
						selectedMarkers[groupName[i]].push(markerGroups[groupName[i]][j]);
					}
				}
			}
			
			return selectedMarkers;
		}
		
		/**
		 * Checks if map marker is selected
		 */
		this.isSelected = function(marker) {
			if (box && box.getBounds()) {
				return box.getBounds().contains(marker.getPosition());
			}
			if (poly) {
				return poly.containsLatLng(marker.getPosition());
			}
			return false;
		}
		
		/**
		 * Clears all overlays
		 */
		this.clearOverlays = function() {
			if (box) {
				box.setMap(null);
				box = null;
			}
			if (poly) {
				poly.setMap(null);
				for (var i=0, len=polyMarkers.length; i<len; i++) {
					polyMarkers[i].setMap(null);
				}
				polyMarkers = [];
				poly = new google.maps.Polygon();
				poly.setMap(thisSelectMap.map);
				path = new google.maps.MVCArray();
				poly.setPaths(new google.maps.MVCArray([path]));
				google.maps.event.addListener(poly, 'click', polyClick);
			}
		}
		
		/**
		 * Allow user to set rectangle options
		 */
		this.setBoxOptions = function(boxoptions) {
			box.setOptions(boxoptions);
		}
		
		/**
		 * Allow user to set polygon options
		 */
		this.setPolygonOptions = function(polyoptions) {
			poly.setOptions(polyoptions);
		}
		
		/**
		 * Allow user to add a listener to the box
		 */
		this.addBoxListener = function(event, event_handler) {
			boxListeners[event].push(event_handler);
		}
		
		/**
		 * Allow user to clear custom listeners
		 */
		this.clearBoxListener = function(event) {
			if (!event) {
				boxListeners.drag = [];
				boxListeners.dragStart = [];
				boxListeners.dragEnd = [];
			}
			else {
				boxListeners[event] = [];
			}
		}
		
		/**
		 * Allow user to add a listener to polygon
		 */
		this.addPolygonListener = function(event, event_handler) {
			polyListeners[event].push(event_handler);
		}
		
		/**
		 * Allow user to clear polygon listener
		 */
		this.clearPolygonListener = function(event) {
			if (!event) {
				polyListeners.addPoint = [];
				polyListeners.removePoint = [];
				polyListeners.dragPoint = [];
			}
			else {
				polyListeners[event] = [];
			}
		}
		
		
		/*
		 * PRIVATE METHODS
		 */
		
		/**
		 * Clears all map markers
		 */
		var clearMapMarkers = function() {
			for (var i=0, len=mapMarkers.length; i<len; i++) {
				mapMarkers[i].setMap(null);
			}
		}
		
		/**
		 * Set up hand tool
		 */
		var handTool = function() {
			mapTool = SMap.Tools.HAND;
			thisSelectMap.map.setOptions({
				draggable: true,
				draggableCursor: ""
			});
			if (polyMarkers.length > 0 && !thisSelectMap.allowDragPolyOnHand) {
				for (var i=0, len=polyMarkers.length; i < len; i++) {
					polyMarkers[i].setOptions({
						draggable: false
					});
				}
			}
		}
		
		/**
		 * Set up box tool
		 */
		var boxTool = function() {
			if (poly) {
				thisSelectMap.clearOverlays();
			}
			mapTool = SMap.Tools.BOX;
			thisSelectMap.map.setOptions({
				draggable: false,
				draggableCursor: "default"
			});

			if (!box) {
				box = new google.maps.Rectangle();
				google.maps.event.addListener(box, 'mouseover', boxMousemove);
				google.maps.event.addListener(box, 'click', boxClick);
			}
			
			google.maps.event.addListener(thisSelectMap.map, 'mousedown', boxMouseDown);
			if (!mouseUpAdded) {
				google.maps.event.addDomListener(document, 'mouseup', function(event){
					mouseDown = false;
					if (mapTool === SMap.Tools.BOX) {
						for (var i=0, len=boxListeners.dragEnd.length ;i<len ;i++) {
							boxListeners.dragEnd[i](event);
						}
					}
				});
				mouseUpAdded = true;
			}

			google.maps.event.addListener(thisSelectMap.map, 'mousemove', boxMousemove);
		}
		
		/**
		 * Set up polygon tool
		 */
		var polygonTool = function() {
			if (box) {
				thisSelectMap.clearOverlays();
			}

			mapTool = SMap.Tools.POLYGON;
			thisSelectMap.map.setOptions({
				draggable: false,
				draggableCursor: "crosshair"
			});

			if (polyMarkers.length === 0) {
				poly = new google.maps.Polygon();
				poly.setMap(thisSelectMap.map);
				path = new google.maps.MVCArray();
				poly.setPaths(new google.maps.MVCArray([path]));

			} else {
				for (var i=0, len=polyMarkers.length; i < len; i++) {
					polyMarkers[i].setOptions({
							draggable: true
					});
				}
			}

			google.maps.event.addListener(thisSelectMap.map, 'click', polyClick);
			google.maps.event.addListener(poly, 'click', polyClick);
			if (!thisSelectMap.polyIcon)
				thisSelectMap.polyIcon = "http://maps.google.com/mapfiles/ms/icons/green.png";
		}
		
		/*
		 * EVENT HANDLERS
		 */
		
		/**
		 * Mouse down event handler for box tool
		 */
		var boxMouseDown = function(event) {
			//only if box tool is selected
			if (mapTool != SMap.Tools.BOX) {
				return;
			}
				
			mouseDown = true;
			downPoint = event.latLng;
			
			//clear current box
			if (box) {
				box.setMap(null);
			}

			box = new google.maps.Rectangle({
				map: thisSelectMap.map,
				bounds: new google.maps.LatLngBounds(downPoint, downPoint)
			});
			google.maps.event.addListener(box, 'click', boxClick);
			google.maps.event.addListener(box, 'mousemove', boxMousemove);
			for (var i=0, len=boxListeners.dragStart.length ;i<len ;i++) {
				boxListeners.dragStart[i](event);
			}
		}
		
		/**
		 * Mouse move event handler for box tool
		 */
		var boxMousemove = function(event) {
			if (mapTool != SMap.Tools.BOX) {
				return;
			}
				
			if (mouseDown) {
				// must make sure to pass southwest and northeast of box -- will not work otherwise
				var sw, ne;
				if (event.latLng.lat() < downPoint.lat() && downPoint.lng() > event.latLng.lng()) //top right to bottom left drag
				{
					sw = event.latLng;
					ne = downPoint;
				}
				else if (event.latLng.lng() > downPoint.lng() && downPoint.lat() > event.latLng.lat()) //top left to bottom right drag
				{
					sw = new google.maps.LatLng(event.latLng.lat(), downPoint.lng());
					ne = new google.maps.LatLng(downPoint.lat(), event.latLng.lng());
				}
				else if (event.latLng.lng() < downPoint.lng() && downPoint.lat() < event.latLng.lat()) //bottom right to top left drag
				{
					sw = new google.maps.LatLng(downPoint.lat(), event.latLng.lng());
					ne = new google.maps.LatLng(event.latLng.lat(), downPoint.lng());
				}
				else //bottom left to top right drag
				{
					ne = event.latLng;
					sw = downPoint;
				}
				box.setBounds(new google.maps.LatLngBounds(sw, ne));
				for (var i=0, len=boxListeners.drag.length; i<len ;i++) {
					boxListeners.drag[i](event);
				}
			}
		}
		
		/**
		 * Click event for box
		 */
		var boxClick = function(event) {
			for (var i=0, len=boxListeners.click; i<len ;i++) {
				boxListeners.click[i](event);
			}
		}
		
		/**
		 * Click event for polygon
		 */
		var polyClick = function(event) {
			if (mapTool != SMap.Tools.POLYGON) {
				return;	
			}
			
			//add to polygon path
			path.insertAt(path.length, event.latLng);
			
			//add marker at click point
			var m = new google.maps.Marker({
				map: thisSelectMap.map,
				position: event.latLng,
				draggable: true,
				icon: thisSelectMap.polyIcon
			});
			polyMarkers.push(m);
			
			//delete marker on click
			google.maps.event.addListener(m, 'click', function() {
				if (mapTool != SMap.Tools.POLYGON) {
					return;
				}

				for (var i=0, len=polyMarkers.length; i<len && polyMarkers[i] != m; i++);

				polyMarkers.splice(i, 1);
				m.setMap(null);
				path.removeAt(i);

				for (var i=0, len=polyListeners.removePoint.length; i<len; i++) {
					polyListeners.removePoint[i](event);
				}
			});
			
			//start drag for point
			google.maps.event.addListener(m, 'dragStart', function(event) {
				for (var i=0, len=polyListeners.dragPointStart.length; i<len ;i++) {
					polyListeners.dragPointStart[i](event);
				}
			});
			
			//draggable polygon
			google.maps.event.addListener(m, 'drag', function(event) {
				for (var i=0, len=polyMarkers.length; i<len && polyMarkers[i]!=m; i++);
				path.setAt(i,m.getPosition());
				for (var i=0, len=polyListeners.dragPoint.length; i<len; i++) {
					polyListeners.dragPoint[i](event);
				}
			});
			
			//end drag for point
			google.maps.event.addListener(m, 'dragEnd', function(event) {
				for (var i=0, len=polyListeners.dragPointend.length; i<len; i++) {
					polyListeners.dragPointend[i](event);
				}
			});
			
			//add user events
			for (var i=0, len=polyListeners.addPoint.length; i<len; i++) {
				polyListeners.addPoint[i](event);
			}
		}
		
	}

})();