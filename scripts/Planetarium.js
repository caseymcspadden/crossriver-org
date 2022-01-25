Planetarium = function(canvasID, options, displayTime)
{
	var starColors = {
		'O': "rgb(200,200,255)",
		'B': "rgb(225,225,255)",
		'A': "rgb(240,240,255)",
		'F': "rgb(255,255,255)",
		'G': "rgb(255,255,200)",
		'K': "rgb(255,229,137)",
		'M': "rgb(255,155,128)"
	};

	this.displayTime = displayTime;
	this.animate=false;
	
	var zoom = 1;
	var deltaAz = 0;
	var deltaAlt = 0;
	var lon = options.longitude;
	var lat = options.latitude;
	var showHorizon = options.showHorizon;
	var showRADec = options.showRADec;
	var showEcliptic = options.showEcliptic;
	var showAltAz = options.showAltAz;
	var showConstellations = options.showConstellations;
	var showStarNames = options.showStarNames;
	var showSatelliteNames = options.showSatelliteNames;
	var starServer = options.starServer;
	var constellationBoundariesServer = options.constellationBoundariesServer;
	var constellationServer = options.constellationServer;
	var constellationLimitsServer = options.constellationLimitsServer;
	var constellationFiguresServer = options.constellationFiguresServer;
	var planets = options.planets;
	var stars = [];
	var constellationBoundaries = null;
	var constellationLimits = null;
	var constellations = null;
	var astro = new Astro();
	var c=document.getElementById(canvasID);
	var ctx=c.getContext("2d");
	var canvas2 = document.createElement('canvas');
	canvas2.width = c.width;
	canvas2.height = c.height;
	var ctx2 = canvas2.getContext('2d');
	ctx2.font="10px Arial";
	var width = c.width;
	var height = c.height;
	var radius = Math.min(width,height)/2 - 10;
	var utc = astro.getUTC();
	var d = astro.date_to_day(utc);
	var dateLocal = new Date();
	var lst = astro.local_sidereal_time(d,lon); // Local sidereal time at longitiude lon	
	var hms = astro.deg_to_hms(lst);
	var I = new Matrix(true);
	var deltaAlt0 = 0;
	var deltaAz0 = 0;
	var deltaT = 0;
	var bullseye=null;
	var currentConstellation = null;
	var matrix = I.rotate(2,lst).rotate(1,90-lat);
	var inverse = I.rotate(1,lat-90).rotate(2,-lst);
	var dialog = $('<div class="uiDialog"></div>') .html('').dialog({width:800, height:400, autoOpen:false}); 
	var that = this;

	var helper = new CanvasHelper(canvasID,this);
	helper.drag = function(data) {
		if (data.beginDrag)
		{
			deltaAlt0 = deltaAlt;
			deltaAz0 = deltaAz;
		}
		data.context.change_viewer_orientation(deltaAlt0 - 360 * data.deltaY/(2*radius*zoom), deltaAz0 + 360 * data.deltaX/(2*radius*zoom), null);
	}
	
	helper.click = function(data)
	{
 		for (name in planets)
		{
			var item = planets[name];
			if (item.visible && Math.abs(data.X-item.plotX)<item.diameter/2 && Math.abs(data.Y-item.plotY)<item.diameter/2)
			{
				dialog.dialog("option","title",name);
				dialog.html(html).dialog("open");
				return true;	
			}
		}

		var found = null;
		for (var i=0;i<stars.length;i++) {
			var item = stars[i];
			if (item.visible && Math.abs(data.X-item.plotX)<3 && Math.abs(data.Y-item.plotY)<3)
			{
				found=item;
				break;
			}
		}
		if (found != null)
		{
			var hms = astro.deg_to_hms(360*found.ra/24);
			var dms = astro.deg_to_dms(found.de);
		
			var html = "<div>";
			html += "<p>RA: " + hms.h + " " + hms.m + " " + hms.s + " " + " DEC: " + (found.de>=0 ? "+" : "-") + dms.d + " " + dms.m + " " + dms.s + "</p>";
			html += "<p>Class: " + found.class + "</p>";
			html += "<p>Magnitude: " + found.mag + "</p>";
			html += "<p>Constellation: " + data.context.inConstellation(found.ra,found.de,utc.getFullYear()) + "</p>";
			html += "</div>";
			//html += "<div>SIMBAD query results (http://simbad.u-strasbg.fr/simbad):";	
			//html += '<iframe class="dialogFrame" src="http://simbad.u-strasbg.fr/simbad/sim-id?Ident=hr+' + found.hr + '">';
			//html += '</iframe></div>';
			dialog.dialog("option","title","HR " + found.hr + (found.name.length>0 ? " " + found.name : "") +  (found.altname.length>0 ? " " + found.altname : ""));
			dialog.html(html).dialog("open");
			bullseye = {ra:360*found.ra/24, dec:found.de};
			if (!that.animate)
				that.animateSky();
		}
		else
		{
			var radec = that.display_to_radec(data);
			var constellation = that.inConstellation(radec.ra,radec.dec,dateLocal.getFullYear()).toUpperCase();
			currentConstellation = ((constellation==currentConstellation || !showConstellations) ? null : constellation);
			if (!that.animate)
				that.animateSky();			
		}
		
		return (found!=null)
	}
	
	helper.move = function(data)	
	{	
		var ret = data.context.display_to_radec(data);
		//$("#tooltip").tooltip("open");
	}

	helper.hover = function(data)
	{
		//var r = Math.sqrt((data.x-width/2)*(data.x-width/2) + (data.y-height/2)*(data.y-height/2));
		if (0)
		{
			var radec = that.display_to_radec(data);
			currentConstellation = that.inConstellation(radec.ra,radec.dec,dateLocal.getFullYear()).toUpperCase();
			if (!that.animate)
				that.animateSky();
		}
	}
	
	Planetarium.prototype.showHorizon = function(value) {
		showHorizon=value;
		if (!this.animate)
			this.animateSky();	
	}
	Planetarium.prototype.showRADec = function(value) {
		showRADec=value;
		if (!this.animate)
			this.animateSky();	
	}
	Planetarium.prototype.showEcliptic = function(value) {
		showEcliptic=value;
		if (!this.animate)
			this.animateSky();	
	}
	Planetarium.prototype.showAltAz = function(value) {
		showAltAz=value;
		lst = astro.local_sidereal_time(d,lon); // Local sidereal time at longitiude lon	
		if (!this.animate)
			this.animateSky();	
	}
	Planetarium.prototype.showConstellations = function(value) {
		showConstellations=value;
		if (!this.animate)
			this.animateSky();	
	}
	Planetarium.prototype.showStarNames = function(value) {
		showStarNames=value;
		if (!this.animate)
			this.animateSky();	
	}
	Planetarium.prototype.showSatelliteNames = function(value) {
		showSatelliteNames=value;
		if (!this.animate)
			this.animateSky();	
	}
	
	Planetarium.prototype.setLocation = function(latitude,longitude) {
		lat=latitude;
		lon=longitude;
		this.resetOrientation();
	}
		
	Planetarium.prototype.setZoom = function(value)
	{
		zoom = value;
		if (!this.animate)
			this.animateSky();
	}
	
	Planetarium.prototype.setAnimate = function(value)
	{
		this.animate = value;
		if (this.animate)
			this.animateSky();
	}

	Planetarium.prototype.coords_to_display = function(latLon)   // returns {x:X, y:Y}
	{
		var ret = {};
		var r = zoom * (radius)*(90-latLon.lat)/90;
		ret.x = Math.round(width/2 - r*astro.sind(latLon.lon));
		ret.y = Math.round(height/2 + r*astro.cosd(latLon.lon));
		return ret;
	}
	
	Planetarium.prototype.display_to_coords = function(coords)
	{
		var ret = {};
		
		var r = Math.sqrt((coords.x-width/2)*(coords.x-width/2) + (coords.y-height/2)*(coords.y-height/2));
		ret.lat = Math.max(90 * (1 - r/(zoom*radius)),0);
		ret.lon = astro.mod360(astro.atan2d(width/2-coords.x,height/2-coords.y));
		return ret;
	}
		
	Planetarium.prototype.display_to_radec = function(coords)
	{
		var latlon = this.display_to_coords(coords);
		var vec = {};

		vec.y = astro.sind(latlon.lon) * astro.cosd(latlon.lat);
		vec.x = -astro.cosd(latlon.lon) * astro.cosd(latlon.lat);
		vec.z = astro.sind(latlon.lat);
		
		var orig = inverse.vecMult(vec);
		var ret = astro.rectangular_to_spherical(orig);
		return {ra:24*ret.lon/360, dec:ret.lat};
	}

	Planetarium.prototype.precess = function(coords, precessionMatrix)
	{
		var vec = {};
		var ret = {};
		vec.x = astro.cosd(coords.dec)*astro.cosd(360*coords.ra/24);
		vec.y = astro.cosd(coords.dec)*astro.sind(360*coords.ra/24);
		vec.z = astro.sind(coords.dec);
		coords = precessionMatrix.vecMult(vec);
		var lonlat = astro.rectangular_to_spherical(coords);
		
		ret.ra = 24*lonlat.lon/360;
		ret.dec = astro.mod90(lonlat.lat);
		return ret;	
	}
	
	Planetarium.prototype.inConstellation = function(ra, dec, year)
	{
		var name = null;
		if (constellationLimits==null)
			return name;
	
		var precessionMatrix = astro.CalculatePrecessionMatrix(2000,year);
		var vec = {};
		vec.x = astro.cosd(dec)*astro.cosd(360*ra/24);
		vec.y = astro.cosd(dec)*astro.sind(360*ra/24);
		vec.z = astro.sind(dec);
		var coords = precessionMatrix.vecMult(vec);
		var lonlat = astro.rectangular_to_spherical(coords);
		
		ra = 24*lonlat.lon/360;
		dec = astro.mod90(lonlat.lat);
		
		for (var i=0;i<constellationLimits.length;i++)
		{
			var item = constellationLimits[i];
			if ((ra >= item.ra_low) && (ra < item.ra_high) && (dec >= item.de_low))
			{
				name=item.name;
				break;
			}
		}
		return name;
	}

	Planetarium.prototype.render_item = function(context,item,x,y)
	{
		var oldFill = context.fillStyle;
		var oldStroke = context.strokeStyle;
	
		//var d= Math.ceil(6*(8-item.mag)/9.5);
		//var d= Math.ceil(2 + 0.5*(8-item.mag)/9.5);
		//context.globalAlpha = 0.5 + 0.5*(8-item.mag)/9.5;
		var d=1;
		if (item.mag<3) {context.globalAlpha = 1; d=4;}
		else if (item.mag<4) {context.globalAlpha = 0.9; d=2;}
		else {context.globalAlpha = 0.8; d=2;}
	    
		var cls = item.class.length==0 ? 'F' : item.class[0].toUpperCase();
		context.fillStyle = starColors[cls];
		context.strokeStyle = "white";

		if (item.mag<3)
		{
			context.beginPath();
			context.moveTo(x-d/2-2, y);
			context.lineTo(x+d/2+2, y);
			context.moveTo(x, y-d/2-2);
			context.lineTo(x, y+d/2+2);
			context.stroke();
		}
	    		
		context.beginPath();
		context.arc(x, y, d/2, 0, 2*Math.PI);
		context.fill();

		context.strokeStyle = oldStroke;
		context.globalAlpha = 1;
		
		if (showStarNames && item.mag<=2.5)
		{
			context.fillStyle = "#cccccc";
			context.fillText(item.name, x, y);
		}
		context.fillStyle = oldFill;
	}
	
	Planetarium.prototype.render_planets = function(context)
	{
		var oldFill = context.fillStyle;
		context.fillStyle= "#cccccc";
		for (name in planets)
		{
			if (name=="Earth")
				continue;
			var item = planets[name];
			var planet = item.planet;
			var spherical = planet.GetRAandDec(d);
			var vec = astro.spherical_to_rectangular(spherical);
			var coords = matrix.vecMult(vec);
			item.visible = (coords.z>0);
			if (coords.z>0)
			{
				var latLon = astro.rectangular_to_spherical(coords);
				var plot = this.coords_to_display(latLon);
				item.plotX = plot.x;
				item.plotY = plot.y;
				context.drawImage(item.image,0,0,94,94,plot.x-item.diameter/2,plot.y-item.diameter/2,item.diameter,item.diameter);
				if (showSatelliteNames)
					context.fillText(name, plot.x+item.diameter/2, plot.y-item.diameter/2);
			}
		}
		context.fillStyle = oldFill;

	}
	
	Planetarium.prototype.draw_bullseye = function(context)
	{
		if (bullseye==null)
			return;
	
		var coords = astro.spherical_to_rectangular(bullseye);
		coords = matrix.vecMult(coords);
		if (coords.z<0)
			return;
		var latLon = astro.rectangular_to_spherical(coords);
		var center = this.coords_to_display(latLon);
		var radius=20;
				
		var oldStyle = context.strokeStyle;
		context.strokeStyle = "#FF0000"
		context.beginPath();
		context.arc(center.x, center.y, radius, 0, 2*Math.PI);
		context.moveTo(center.x-radius, center.y);
		context.lineTo(center.x-4, center.y);
		context.moveTo(center.x+4, center.y);
		context.lineTo(center.x+radius, center.y);
		context.moveTo(center.x, center.y-radius);
		context.lineTo(center.x, center.y-4);
		context.moveTo(center.x, center.y+4);
		context.lineTo(center.x, center.y+radius);

		context.stroke();	
		context.strokeStyle = oldStyle;
	}

	Planetarium.prototype.draw_horizon = function(context)
	{
		if (!showHorizon)
			return;
	
		var oldFill = context.fillStyle;
		var oldStroke = context.strokeStyle;
		var oldAlign = context.textAlign;
		var oldBaseline = context.textBaseline;
		var oldFont = context.font;

		context.textAlign="center";
		context.textBaseline="bottom";
		context.font="16px Arial";

		var tilt = I.rotate(1,deltaAlt);
		var vec = {};
		var init = false;

		var oppositeHemisphere = (astro.mod360(deltaAlt)>180);

 		context.fillStyle = oppositeHemisphere ? "#303030" : "black";
 		context.arc(width/2,height/2,zoom*radius,0,2*Math.PI);
		context.fill();

 		context.strokeStyle="red";
		context.fillStyle = oppositeHemisphere ? "black" : "#303030";

		context.beginPath();
		context.arc(width/2,height/0,radius,0, Math.PI);
		var cosAlt = astro.cosd(deltaAlt);
		var sinAlt = astro.sind(deltaAlt);
		var drawn=false;
		context.moveTo(width/2-zoom*radius,height/2);
				
		for (var i=0;i<=180;i++)
		{
	  		vec.z = Math.abs(astro.sind(i)*sinAlt);
				var mult = (oppositeHemisphere ? -1 : 1);
	  		if (true) //vec.z>0)
	  		{
	  			drawn=true;
	  			vec.y = astro.cosd(i);
	  			vec.x = mult*astro.sind(i)*cosAlt;
	  			var latLon = astro.rectangular_to_spherical(vec);
	  			var plot = this.coords_to_display(latLon);
	  			context.lineTo(plot.x,plot.y);
				}
				context.fillStyle = "red";
				if (Math.floor(astro.mod360(i-deltaAz))==0) context.fillText("E",plot.x,plot.y);	
				if (Math.floor(astro.mod360(i-deltaAz)-90)==0) context.fillText("S",plot.x,plot.y);	
				if (Math.floor(astro.mod360(i-deltaAz)-180)==0) context.fillText("W",plot.x,plot.y);	
				if (Math.floor(astro.mod360(i-deltaAz)-270)==0) context.fillText("N",plot.x,plot.y);	
				context.fillStyle = oppositeHemisphere ? "black" : "#303030";
		}
		context.stroke();

		if (drawn)
		{
			context.arc(width/2,height/2,zoom*radius,0,Math.PI);
			//context.arcTo(width/2,height/2+radius,width/2-radius,height/2,radius);
			context.closePath();
			context.fill();
		}

 		context.fillStyle=oldFill;
 		context.strokeStyle=oldStroke;
 		context.textAlign=oldAlign;
		context.textBaseline=oldBaseline;
 		context.font=oldFont;
	}
		
	Planetarium.prototype.draw_ecliptic = function(context)
	{
		if (!showEcliptic)
			return;

		var M = I.rotate(0,-astro.earth_obliquity(d+deltaT)).rotate(2,lst).rotate(1,90-lat).rotate(2,deltaAz).rotate(1,deltaAlt);
		//console.log(d + " " + deltaT + " " + lst + " " + this.lat + " " + this.deltaAz + " " + this.deltaAlt);
		
		var oldStroke = context.strokeStyle;
 		context.strokeStyle="blue";
		
		var vec = {};
		var init = false;
		
		for (var i=0;i<=360;i++)
		{
	  		vec.x = astro.cosd(i);
	  		vec.y = astro.sind(i);
	  		vec.z = 0;
	  		var coords = M.vecMult(vec);
	  		if (coords.z>0)
	  		{
					var latLon = astro.rectangular_to_spherical(coords);
					var plot = this.coords_to_display(latLon);
					if (!init)
					{ 
						context.beginPath();
						context.moveTo(plot.x,plot.y);
						init = true;
					}
					else
						context.lineTo(plot.x,plot.y);
			}
			else if (init)
			{
				context.stroke();
				init=false;
			}
		}
		if (init)
			context.stroke();
 		context.strokeStyle=oldStroke;
	}
	
	Planetarium.prototype.draw_ra_dec = function(context)
	{
		if (!showRADec)
			return;

		var oldStroke = context.strokeStyle;
 		context.strokeStyle="white";

		for (var ra=0; ra<360; ra+=30)
		{
			var sinra = astro.sind(ra);
			var cosra = astro.cosd(ra);
			var init=false;
			for (var dec=-85;dec<=85;dec+=5)
			{
				var sindec = astro.sind(dec);
				var cosdec = astro.cosd(dec);			
				var vec = {x:cosdec*cosra, y:cosdec*sinra, z:sindec};
				var coords = matrix.vecMult(vec);
				if (coords.z>0)
				{
					var latLon = astro.rectangular_to_spherical(coords);
					var plot = this.coords_to_display(latLon);
					if (!init)
					{ 
						context.beginPath();
						context.moveTo(plot.x,plot.y);
						init = true;
					}
					else
						context.lineTo(plot.x,plot.y);
				}
				else if (init)
				{
					context.stroke();
					init=false;
				}
			}
			if (init)
				context.stroke();
		}
		
		for (var dec=-60; dec<=60; dec+=30)
		{
			var sindec = astro.sind(dec);
			var cosdec = astro.cosd(dec);			
			var init=false;
			for (var ra=0; ra<=360; ra+=10)
			{
				var sinra = astro.sind(ra);
				var cosra = astro.cosd(ra);
				var vec = {x:cosdec*cosra, y:cosdec*sinra, z:sindec};
				var coords = matrix.vecMult(vec);
				if (coords.z>0)
				{
					var latLon = astro.rectangular_to_spherical(coords);
					var plot = this.coords_to_display(latLon);
					if (!init)
					{ 
						context.beginPath();
						context.moveTo(plot.x,plot.y);
						init = true;
					}
					else
						context.lineTo(plot.x,plot.y);
				}
				else if (init)
				{
					context.stroke();
					init=false;
				}				
			}
			if (init)
				context.stroke();
		}
		context.strokeStyle=oldStroke;
	}
	
	Planetarium.prototype.draw_alt_az = function(context)
	{
		if (!showAltAz)
			return;

		var oldStroke = context.strokeStyle;
 		context.strokeStyle="white";
 		
 		var M = I.rotate(1,deltaAlt);
 	
 		
		for (var az=0; az<360; az+=30)
		{
			var sinaz = astro.sind(az);
			var cosaz = astro.cosd(az);
			var init=false;
			for (var alt=-85;alt<=85;alt+=5)
			{
				var sinalt = astro.sind(alt);
				var cosalt = astro.cosd(alt);			
				var vec = {x:cosalt*cosaz, y:cosalt*sinaz, z:sinalt};
				var coords = M.vecMult(vec);
				if (coords.z>-0.001)
				{
					var latLon = astro.rectangular_to_spherical(coords);
					var plot = this.coords_to_display(latLon);
					if (!init)
					{ 
						context.beginPath();
						context.moveTo(plot.x,plot.y);
						init = true;
					}
					else
						context.lineTo(plot.x,plot.y);
				}
				else if (init)
				{
					context.stroke();
					init=false;
				}
			}
			if (init)
				context.stroke();
		}
		
		for (var alt=-60; alt<=60; alt+=30)
		{
			var sinalt = astro.sind(alt);
			var cosalt = astro.cosd(alt);			
			var init=false;
			for (var az=0; az<=360; az+=10)
			{
				var sinaz = astro.sind(az);
				var cosaz = astro.cosd(az);
				var vec = {x:cosalt*cosaz, y:cosalt*sinaz, z:sinalt};
				var coords = M.vecMult(vec);
				if (coords.z>-0.001)
				{
					var latLon = astro.rectangular_to_spherical(coords);
					var plot = this.coords_to_display(latLon);
					if (!init)
					{ 
						context.beginPath();
						context.moveTo(plot.x,plot.y);
						init = true;
					}
					else
						context.lineTo(plot.x,plot.y);
				}
				else if (init)
				{
					context.stroke();
					init=false;
				}				
			}
			if (init)
				context.stroke();
		}
		context.strokeStyle=oldStroke;
	}
	
	Planetarium.prototype.draw_constellations = function(context)
	{
		if (!showConstellations || constellations==null)
			return;
			
		for (var abbrev in constellations)
			this.draw_constellation_boundary(context,name);
	}
	
	Planetarium.prototype.draw_constellationboundary = function(context, name)
	{
		if (name==null || constellations==null || constellations[name]===undefined || constellations[name].boundaries.length==0)
			return;
			
		var oldStroke = context.strokeStyle;
		var oldFill = context.fillStyle;
		var oldAlign = context.textAlign;
		//context.globalAlpha=1;
 		context.strokeStyle="#00FF00";
 		context.fillStyle="#00FF00";
 		context.textAlign="center";
 		
		var arr = constellations[name].boundaries;
				
		var coords = [];
		var init=false;

		context.beginPath();
		var iBegin = 0;

		for (var i=0;i<arr.length;i++)
		{
			if (arr[i].path==1)
			{
				if (i>0 && coords[iBegin].plot!==undefined && coords[i-1].plot!==undefined)
				{
					context.moveTo(coords[i-1].plot.x, coords[i-1].plot.y);
					context.lineTo(coords[iBegin].plot.x, coords[iBegin].plot.y);
				}
				iBegin=i;				
				
			}
			var radec = {ra:arr[i].ra*360/24, dec:arr[i].dec};
			var c = astro.spherical_to_rectangular(radec);
			coords[i] = matrix.vecMult(c);
			if (coords[i].z>0)
			{
				init=true;
				var latLon = astro.rectangular_to_spherical(coords[i]);
				coords[i].plot = this.coords_to_display(latLon);
				if (i>iBegin && coords[i-1].plot!==undefined)
				{
					context.moveTo(coords[i-1].plot.x, coords[i-1].plot.y);
					context.lineTo(coords[i].plot.x, coords[i].plot.y);
				}
			}
		}
		
		if (coords[arr.length-1].plot !== undefined>0 && coords[iBegin].plot !== undefined)
		{
			context.moveTo(coords[arr.length-1].plot.x, coords[arr.length-1].plot.y);
			context.lineTo(coords[iBegin].plot.x, coords[iBegin].plot.y);
		}
		
		if (init)
		{
			context.stroke();
		}
		var radec = {ra:parseFloat(constellations[name].ra*360/24), dec:parseFloat(constellations[name].de)};
		var c = astro.spherical_to_rectangular(radec);
		c = matrix.vecMult(c);
		if (c.z>0) {
			var latLon = astro.rectangular_to_spherical(c);
			var p = this.coords_to_display(latLon);
			context.fillText(constellations[name].name, p.x, p.y);
		}

		context.strokeStyle=oldStroke;
		context.fillStyle=oldFill;
 		context.textAlign=oldAlign;
	}
	
	Planetarium.prototype.draw_constellationfigures = function(context)
	{
		if (!showConstellations || constellations==null)
			return;
			 		
		for (var abbrev in constellations)
			this.draw_constellationfigure(context,abbrev);
	}

	Planetarium.prototype.draw_constellationfigure = function(context,name)
	{
		if (name==null || constellations==null || constellations[name]===undefined || constellations[name].figure.length==0)
			return;
			
		var oldStroke = context.strokeStyle;
 		context.strokeStyle="yellow";
 		
		var arr = constellations[name].figure;
			
		var coords = [];
		var init=false;
		context.beginPath();
			
		for (var i=0;i<arr.length;i++)
		{
			var radec = {ra:arr[i].ra*360/24, dec:arr[i].de};
			var c = astro.spherical_to_rectangular(radec);
			coords[i] = matrix.vecMult(c);
			if (i>0 && coords[i-1].z>0 && coords[i].z>0)
			{
				init=true;
				var latLon = astro.rectangular_to_spherical(coords[i-1]);
				var plot0 = this.coords_to_display(latLon);
				latLon = astro.rectangular_to_spherical(coords[i]);
				var plot1 = this.coords_to_display(latLon);
				if (arr[i].path!=1)
				{				
					context.moveTo(plot0.x,plot0.y);
					context.lineTo(plot1.x,plot1.y);
				}				
			}
		}
		context.stroke();
		context.strokeStyle=oldStroke;
	}

	Planetarium.prototype.build_matrices = function()
	{	
		matrix = I.rotate(2,lst).rotate(1,90-lat).rotate(2,deltaAz).rotate(1,deltaAlt);
		inverse = I.rotate(1,-deltaAlt).rotate(2,-deltaAz).rotate(1,lat-90).rotate(2,-lst);
	}
    
	Planetarium.prototype.change_viewer_orientation = function(alt,az,z)
	{	
		deltaAlt = (alt==null ? deltaAlt : astro.mod90(alt));
		deltaAz  = (az==null ? deltaAz : astro.mod360(az));
		zoom  = (z==null ? zoom : z);
		this.build_matrices();
		if (!this.animate)
    		this.animateSky();		
	}
	
	Planetarium.prototype.goTo = function(obj)
	{
		// initial transformation to AltAz system
		var m = I.rotate(2,lst).rotate(1,90-lat);
		// coordinates of destination vector in AltAz system
		var v = astro.spherical_to_rectangular({ra:360*obj.ra/24, dec:obj.dec});
		v = m.vecMult(v);
		//calculate rotation angles of difference vector (difference between meridian and destination vector)
		var r = Math.sqrt(v.y*v.y + v.x*v.x);
		var az = astro.atan2d(v.y,v.x);
		var alt = astro.atan2d(r,v.z);
		bullseye = {ra:360*obj.ra/24, dec:obj.dec};
		if (obj.type==2)
		{
			currentConstellation = obj.abbrev;
			bullseye=null;			
		}
		if (obj.type==1 && !this.isLoaded(obj.hr))
			this.loadObjects({hr:obj.hr, alt:alt, az:az});
		else
			this.change_viewer_orientation(alt,az,null);
	}
	
	Planetarium.prototype.isLoaded = function(id)
	{
		for (var i=0;i<stars.length;i++) {
			//console.log(item.hr);
			if (stars[i].hr==id)
				return true;
		}		
		console.log(id + " is not loaded");
		return false;
	}
	
	Planetarium.prototype.loadObjects = function(params)
	{
	
		$.ajax({
		dataType: "json",
		url: options.starServer,
		data: params,
		error: function(jqXHR, textStatus, errorThrown) {
			console.log(textStatus);
			//console.log(textStatus + " " + errorThrown);
		}
		}).done(function (data) {
			console.log("stars loaded");
			$.each(data, function(i,item) {
				item.x = astro.cosd(item.de) * astro.cosd(item.ra*360/24);
				item.y = astro.cosd(item.de) * astro.sind(item.ra*360/24);
				item.z = astro.sind(item.de);
				stars.push(item);
			});
			if (params.alt !== undefined)
				that.change_viewer_orientation(params.alt,params.az, null);
			else
				that.animateSky();
		});
	}
	
	Planetarium.prototype.animateSky = function()
	{
		ctx2.fillStyle="black";
		ctx2.fillRect(0,0,width,height);  
		ctx2.fillStyle="white";
		ctx2.strokeStyle = "white";
  	
 		that.draw_horizon(ctx2);
 		that.draw_ecliptic(ctx2);
 		that.draw_ra_dec(ctx2);
 		that.draw_alt_az(ctx2);
 		//this.draw_constellations(ctx2);
 		that.draw_constellationboundary(ctx2,currentConstellation);
 		that.draw_constellationfigure(ctx2,currentConstellation);
 		
		$.each(stars, function(i,item) {
				var coords = matrix.vecMult(item);
			
				item.visible=(coords.z>0);
				if (coords.z>0)
				{
					var latLon = astro.rectangular_to_spherical(coords);
					var plot = that.coords_to_display(latLon);
					item.plotX = plot.x;
					item.plotY = plot.y;
					that.render_item(ctx2,item,plot.x,plot.y)
				}
		});
		
		that.render_planets(ctx2);
		that.draw_bullseye(ctx2);
		
		ctx.drawImage(canvas2, 0, 0);
 
		var date = new Date(dateLocal.getTime() + 24*deltaT*3600*1000);
		if (that.displayTime != undefined)
			that.displayTime(date);

		if (that.animate)
		{
			deltaT += 1/1440.0;
			lst = astro.local_sidereal_time(d+deltaT,lon); // Local sidereal time ad longitiude 0	
			that.build_matrices();
			setTimeout(function() {that.animateSky();},50);
		}
	}

	Planetarium.prototype.resetTime = function()
	{
		deltaT=0;
		utc=astro.getUTC();
		d = astro.date_to_day(utc);
		lst = astro.local_sidereal_time(d,lon); // Local sidereal time ad longitiude 0	
		this.build_matrices();
		dateLocal = new Date();
		if (this.displayTime != undefined)
			this.displayTime(dateLocal);
		if (!this.animate) 
			this.animateSky();
	}

	Planetarium.prototype.setLocalTime = function(date)
	{
		deltaT=0;
		dateLocal=date;
		utc = new Date(dateLocal.getTime() + dateLocal.getTimezoneOffset()*60*1000);
		d = astro.date_to_day(utc);
		lst = astro.local_sidereal_time(d,lon); // Local sidereal time ad longitiude 0	
		this.build_matrices();
		if (this.displayTime != undefined)
			this.displayTime(dateLocal);			
		if (!this.animate) 
			this.animateSky();
	}
	
      	
	Planetarium.prototype.resetOrientation = function()
	{
		this.change_viewer_orientation(0,0,null);
	}
		
	this.loadObjects({mag:"5"});
	
	/*
	$.ajax({
		dataType: "json",
		url: options.starServer,
		data: {mag:"5"},
		error: function(jqXHR, textStatus, errorThrown) {
			console.log("ERR");
			//console.log(textStatus + " " + errorThrown);
		}
		}).done(function (data) {
			console.log("stars loaded");
			$.each(data, function(i,item) {
				item.x = astro.cosd(item.de) * astro.cosd(item.ra*360/24);
				item.y = astro.cosd(item.de) * astro.sind(item.ra*360/24);
				item.z = astro.sind(item.de);
				stars.push(item);
			});
			that.animateSky();
		});
	*/
	
	$.ajax({
		dataType: "json",
		url: options.constellationLimitsServer,
		error: function(jqXHR, textStatus, errorThrown) {
			console.log("ERR " + options.constellationLimitsServer);
			//console.log(textStatus + " " + errorThrown);
		}
		}).done(function (data) {
			console.log("constellation limits loaded");
			constellationLimits = data;
		});

	$.ajax({
		dataType: "json",
		url: options.constellationServer,
		error: function(jqXHR, textStatus, errorThrown) {
			console.log("ERR");
			//console.log(textStatus + " " + errorThrown);
		}
		}).done(function (data) {
			constellations={};
			for (var i=0;i<data.length;i++)
			{
				constellations[data[i].abbrev] = data[i];
				constellations[data[i].abbrev].boundaries = [];
				constellations[data[i].abbrev].figure = [];
			}
			$.ajax({
				dataType: "json",
				url: options.constellationBoundariesServer,
				error: function(jqXHR, textStatus, errorThrown) {
					console.log("ERR");
				}
				}).done(function (data) {
					var precessionMatrix = astro.CalculatePrecessionMatrix(2000,2013);
					for (var i=0;i<data.length;i++) {
						var coords = {ra:data[i].ra, dec:data[i].de};
						obj = that.precess(coords,precessionMatrix);
						obj.path = data[i].path;
						constellations[data[i].abbrev].boundaries.push(obj);	
					}			
					$.ajax({
						dataType: "json",
						url: options.constellationFiguresServer,
						error: function(jqXHR, textStatus, errorThrown) {
							console.log("ERR");
						}
						}).done(function (data) {
								for (var i=0;i<data.length;i++)
									constellations[data[i].abbrev].figure.push(data[i]);
									console.log(constellations);
								});			
				});	
			});		
}