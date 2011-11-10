/*
 * Author: Sahil Grover
 * Description: An extension for google maps to allow users to select multiple markers at a time
 * Requires:
 * 		Google Maps v3 API
 * 		Polygon contains LatLng (http://code.google.com/p/google-maps-extensions/source/browse/google.maps.Polygon.getBounds.js)
 */


/**
 * Google Marker Select Map Extension Namespace
 */
var SMap = {
	
	/**
	 * Enum for current tool
	 */
	Tools : {HAND:0, BOX:1, POLYGON:2},
	
	/**
	 * Class for turning a div into a Google Map with selectable markers
	 */
	markerSelectMap: function(mapid)
	{
		//private
		var markerGroups = {};			//holds multiple named marker sets
		var mapmarkers = [];			//list of map markers
		var markerbounds;				//LatLngBounds for current marker set
		var maptool = SMap.Tools.HAND;	//selected map tool
		
		//box vars
		var mousedown;					//true if mouse button is currently being held down
		var box;						//google maps rectangle (user drags to create box)
		var downpoint;					//initial click point when box was started
		var mouseupadded = false;		//checks if mouseuplistener has already been added (workaround for no mouseup event on map)
		var boxlisteners = 				//user events for box (dragstart,drag,dragend,click)
			{
				dragstart:[],
				drag:[],
				dragend:[],
				click:[]
			};
		
		//poly vars
		var poly;						//google maps polygon
		var polymarkers = [];			//markers used to denote polygon edges
		var path;						//polygon path array
		//var polymarkerlisteners  = [];	//user events for polygon marker [OBSOLETE]
		var polylisteners = 			//user events for polygon
			{
				addpoint: [],
				removepoint: [],
				dragpointstart: [],
				dragpoint: [],
				dragpointend: []
			}
		
		var getthis = this;				//allow private functions to access public class variables
		
		this.polyicon;					//icon for polygon
		
		//initialize map
		this.map = new google.maps.Map(document.getElementById(mapid), {
			//zoom: 15,
			mapTypeId: google.maps.MapTypeId.ROADMAP
		});
		
		/**
		 * Sets new map markers
		 */
		this.setMarkers = function(_markers) {
			//first clear the current map markers
			clearMapMarkers();
			//initialize bounds
			markerbounds = new google.maps.LatLngBounds();
			mapmarkers = _markers;
			if (!mapmarkers || mapmarkers.length == 0)
			{
				
			}
			if (mapmarkers.length > 1)
			{
				for (var i=0;i<mapmarkers.length;i++) {
					//set map
					mapmarkers[i].setMap(this.map);
					//extend bounds
					markerbounds.extend(mapmarkers[i].position);
				}
				//set bounds
				this.map.fitBounds(markerbounds);
			}
			else if (mapmarkers.length==1)
			{
				mapmarkers[0].setMap(this.map);
				this.map.setOptions({
					center: mapmarkers[0].getPosition(),
					zoom: 15
				});
			}
		}
		
		/**
		 * Add a marker group
		 */
		this.addMarkerGroup = function(name, markerset) {
			mapmarkers = mapmarkers.concat(markerset);
			markerbounds = new google.maps.LatLngBounds();
			if (mapmarkers.length > 1) {
				for (var i=0;i<mapmarkers.length;i++) {
					//set map
					mapmarkers[i].setMap(this.map);
					//extend bounds
					markerbounds.extend(mapmarkers[i].position);
				}
				//set bounds
				this.map.fitBounds(markerbounds);
			}
			else if (mapmarkers.length == 1) {
				this.map.setOptions({
					center: mapmarkers[0].getPosition(),
					zoom: 15
				})
				mapmarkers[0].setMap(this.map);
			}
			markerGroups[name] = markerset;
		}
		
		/**
		 * Change Map Tool
		 */
		this.setTool = function(tool) {
			if (maptool == tool)
				return;
				
			//remove all event listeners
			google.maps.event.clearListeners(this.map, 'click');
			google.maps.event.clearListeners(this.map, 'mousemove');
			google.maps.event.clearListeners(this.map, 'mousedown');
			
			if (box)
			{
				google.maps.event.clearListeners(box,'mousemove');
				google.maps.event.clearListeners(box,'click');
			}
			if (poly)
				google.maps.event.clearListeners(poly,'click');
				
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
			var selectedmarkers = [];
			for (var i=0;i<mapmarkers.length;i++) {
				if (this.isSelected(mapmarkers[i])) {
					selectedmarkers.push(mapmarkers[i]);
				}
			}
			return selectedmarkers;
		}
		
		/**
		 * Get selected markers in a particular marker group(s)
		 */
		this.getSelectedGroupMarkers = function(groupName) {
			if (typeof(groupName) === 'string') {
				groupName = [groupName];
			}
			
			var selectedMarkers = {};
			
			for (var i=0;i<groupName.length;i++) {
				selectedMarkers[groupName[i]] = [];
				for (var j=0;j<markerGroups[groupName[i]].length;j++) {
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
			if (box && box.getBounds())
				return box.getBounds().contains(marker.getPosition());
			if (poly)
				return poly.containsLatLng(marker.getPosition());
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
				for (var i=0;i<polymarkers.length;i++) {
					polymarkers[i].setMap(null);
				}
				polymarkers = [];
				poly = new google.maps.Polygon();
				poly.setMap(getthis.map);
				path = new google.maps.MVCArray();
				poly.setPaths(new google.maps.MVCArray([path]));
				google.maps.event.addListener(poly,'click',polyClick);
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
			boxlisteners[event].push(event_handler);
		}
		
		/**
		 * Allow user to clear custom listeners
		 */
		this.clearBoxListener = function(event) {
			if (!event) {
				boxlisteners.drag = [];
				boxlisteners.dragstart = [];
				boxlisteners.dragend = [];
			}
			else {
				boxlisteners[event] = [];
			}
		}
		
		/**
		 * Allow user to add a listener to polygon
		 */
		this.addPolygonListener = function(event, event_handler) {
			polylisteners[event].push(event_handler);
		}
		
		/**
		 * Allow user to clear polygon listener
		 */
		this.clearPolygonListener = function(event) {
			if (!event) {
				polylisteners.addpoint = [];
				polylisteners.removepoint = [];
				polylisteners.dragpoint = [];
			}
			else {
				polylisteners[event] = [];
			}
		}
		
		/** 
		 *Allow user to add a listener to polygon markers [OBSOLETE]
		 */
		/*this.addPolygonMarkerListener = function(event, event_handler) {
			polymarkerlisteners.push({event:event, event_handler:event_handler});
		}*/
		
		
		/*
		 * PRIVATE METHODS
		 */
		
		/**
		 * Clears all map markers
		 */
		var clearMapMarkers = function() {
			for (var i=0; i<mapmarkers.length; i++) {
				mapmarkers[i].setMap(null);
			}
		}
		
		/**
		 * Set up hand tool
		 */
		var handTool = function() {
			maptool = SMap.Tools.HAND;
			getthis.map.setOptions({
				draggable: true,
				draggableCursor: ""
			});
		}
		
		/**
		 * Set up box tool
		 */
		var boxTool = function() {
			if (poly) {
				//need to clear other overlays
				getthis.clearOverlays();
			}
			maptool = SMap.Tools.BOX;
			getthis.map.setOptions({
				draggable: false,
				draggableCursor: "default"
			});
			//set rectangle
			if (!box)
			{
				box = new google.maps.Rectangle();
				google.maps.event.addListener(box,'mouseover',boxMousemove);
				google.maps.event.addListener(box,'click',boxClick);
			}
			
			//set up event handlers for box tool
			google.maps.event.addListener(getthis.map,'mousedown',boxMousedown);
			if (!mouseupadded) //so we don't add it multiple times
			{
				google.maps.event.addDomListener(document,'mouseup',function(event){
					mousedown = false;
					if (maptool == SMap.Tools.BOX) {
						for (var i=0;i<boxlisteners.dragend.length;i++) {
							boxlisteners.dragend[i](event);
						}
					}
				});
				mouseupadded = true;
			}

			google.maps.event.addListener(getthis.map,'mousemove',boxMousemove);
		}
		
		/**
		 * Set up polygon tool
		 */
		var polygonTool = function() {
			if (box) {
				//need to clear other overlays
				getthis.clearOverlays();
			}
			maptool = SMap.Tools.POLYGON;
			getthis.map.setOptions({
				draggable: false,
				draggableCursor: "crosshair"
			});
			if (polymarkers.length == 0) {
				poly = new google.maps.Polygon();
				poly.setMap(getthis.map);
				path = new google.maps.MVCArray();
				poly.setPaths(new google.maps.MVCArray([path]));
			}
			google.maps.event.addListener(getthis.map,'click',polyClick);
			google.maps.event.addListener(poly,'click',polyClick);
			if (!getthis.polyicon)
				getthis.polyicon = "http://maps.google.com/mapfiles/ms/icons/green.png";
		}
		
		/*
		 * EVENT HANDLERS
		 */
		
		/**
		 * Mouse down event handler for box tool
		 */
		var boxMousedown = function(event) {
			//only if box tool is selected
			if (maptool != SMap.Tools.BOX)
				return;
				
			mousedown = true;
			downpoint = event.latLng;
			
			//clear current box
			if (box)
				box.setMap(null);
			//create new box
			box = new google.maps.Rectangle({
				map: getthis.map,
				bounds: new google.maps.LatLngBounds(downpoint, downpoint)
			});
			google.maps.event.addListener(box,'click',boxClick);
			google.maps.event.addListener(box,'mousemove',boxMousemove);
			for (var i=0;i<boxlisteners.dragstart.length;i++) {
				boxlisteners.dragstart[i](event);
			}
		}
		
		/**
		 * Mouse move event handler for box tool
		 */
		var boxMousemove = function(event) {
			if (maptool != SMap.Tools.BOX)
				return;
				
			if (mousedown)
			{
				// must make sure to pass southwest and northeast of box if i want this working correctly
				var sw;
				var ne;
				if (event.latLng.lat() < downpoint.lat() && downpoint.lng() > event.latLng.lng()) //top right to bottom left drag
				{
					sw = event.latLng;
					ne = downpoint;
				}
				else if (event.latLng.lng() > downpoint.lng() && downpoint.lat() > event.latLng.lat()) //top left to bottom right drag
				{
					sw = new google.maps.LatLng(event.latLng.lat(), downpoint.lng());
					ne = new google.maps.LatLng(downpoint.lat(), event.latLng.lng());
				}
				else if (event.latLng.lng() < downpoint.lng() && downpoint.lat() < event.latLng.lat()) //bottom right to top left drag
				{
					sw = new google.maps.LatLng(downpoint.lat(), event.latLng.lng());
					ne = new google.maps.LatLng(event.latLng.lat(), downpoint.lng());
				}
				else //bottom left to top right drag
				{
					ne = event.latLng;
					sw = downpoint;
				}
				box.setBounds(new google.maps.LatLngBounds(sw, ne));
				for (var i=0;i<boxlisteners.drag.length;i++) {
					boxlisteners.drag[i](event);
				}
			}
		}
		
		/**
		 * Click event for box
		 */
		var boxClick = function(event) {
			for (var i=0;i<boxlisteners.click;i++) {
				boxlisteners.click[i](event);
			}
		}
		
		/**
		 * Click event for polygon
		 */
		var polyClick = function(event) {
			if (maptool != SMap.Tools.POLYGON)
				return;	
			
			//add to polygon path
			path.insertAt(path.length, event.latLng);
			
			//add marker at click point
			var m = new google.maps.Marker({
				map: getthis.map,
				position: event.latLng,
				draggable: true,
				icon: getthis.polyicon
			});
			polymarkers.push(m);
			
			//delete marker on click
			google.maps.event.addListener(m,'click',function() {
				if (maptool != SMap.Tools.POLYGON) return;
				for (var i=0;i<polymarkers.length && polymarkers[i] != m;i++);
				polymarkers.splice(i,1);
				m.setMap(null);
				path.removeAt(i);
				for (var i=0;i<polylisteners.removepoint.length;i++) {
					polylisteners.removepoint[i](event);
				}
			});
			
			//start drag for point
			google.maps.event.addListener(m,'dragstart',function(event) {
				for (var i=0;i<polylisteners.dragpointstart.length;i++) {
					polylisteners.dragpointstart[i](event);
				}
			});
			
			//draggable polygon
			google.maps.event.addListener(m,'drag',function(event) {
				for (var i=0;i<polymarkers.length && polymarkers[i]!=m;i++);
				path.setAt(i,m.getPosition());
				for (var i=0;i<polylisteners.dragpoint.length;i++) {
					polylisteners.dragpoint[i](event);
				}
			});
			
			//end drag for point
			google.maps.event.addListener(m,'dragend',function(event) {
				for (var i=0;i<polylisteners.dragpointend.length;i++) {
					polylisteners.dragpointend[i](event);
				}
			});
			
			//add user events
			for (var i=0;i<polylisteners.addpoint.length;i++) {
				polylisteners.addpoint[i](event);
			}
		}
		
	}

}
