WorldMap = function(canvasID, imageID, cityServer, cookieName, displayTime)
{
	this.animate = false;
	this.displayTime = displayTime;

	var fixedMap = true;
	var showNightDay = true;
	var canvas = document.getElementById(canvasID);
	var context = canvas.getContext("2d");
	var img=document.getElementById(imageID);
	var astro = new Astro();
	var sun = new Sun();
	var moon = new Moon();
	var utc = astro.getUTC();
	var dateLocal = new Date();
	var d0 = astro.date_to_day(utc);
	var deltaT = 0;
	var canvas2 = document.createElement('canvas');
	canvas2.width = canvas.width;
	canvas2.height = canvas.height;
	var context2 = canvas2.getContext('2d');
	var utility = new CMUtility();
	var mapLocations = {};
	var sunLocation = {x:0,y:0};
	var moonLocation = {x:0,y:0};
	var dialog = $('<div class="uiDialog"></div>') .html('').dialog({width:450, height:300, modal:true, autoOpen:false});
	var selectedLocation = null;
	var that = this;
	var helper = new CanvasHelper(canvasID,this);
	

	var remove_location = function() {
		if (selectedLocation != null)
		{
			delete mapLocations[selectedLocation.geonameid];
			var keys = [];
			for (var i in mapLocations)
				keys.push(i);
			utility.setCookie(cookieName,keys.join(","),100);
			if (!that.animate)
				that.animateMap();
		}
	}

	helper.click = function(data)
	{
		selectedLocation=null;
		var title = "";
		var html = "";
		
		if (Math.abs(data.X-sunLocation.x)<10 && Math.abs(data.Y-sunLocation.y)<10)
		{
			title = "Sun";
			dialog.dialog("option","buttons",{});
			html = "<p>Solar Meridian: " + Math.round(sunLocation.meridian) + "&deg longitude</p>"; 
		}
		else if (Math.abs(data.X-moonLocation.x)<10 && Math.abs(data.Y-moonLocation.y)<10)
		{
			title = "Moon";
			dialog.dialog("option","buttons",{});
			html = "<p>Lunar Meridian: " + Math.round(moonLocation.meridian) + "&deg longitude</p>";
			var phase;
			if (moonLocation.phase>=12 && moonLocation.phase<78) phase = "Waxing Crescent";
			else if (moonLocation.phase>=78 && moonLocation.phase<102) phase = "First Quarter";
			else if (moonLocation.phase>=102 && moonLocation.phase<168) phase = "Waxing Gibbous";
			else if (moonLocation.phase>=168 && moonLocation.phase<192) phase = "Full";
			else if (moonLocation.phase>=192 && moonLocation.phase<258) phase = "Waning Gibbous";
			else if (moonLocation.phase>=258 && moonLocation.phase<282) phase = "Last Quarter";
			else if (moonLocation.phase>=282 && moonLocation.phase<348) phase = "Waning Crescent";
			else phase = "New";
			html += "<p>Phase: " + phase + " (day " + Math.ceil(29.5 * moonLocation.phase / 360) + " of 30)</p>"; 
		}
		else
		{
			for (var id in mapLocations)
			{
				var loc = mapLocations[id];
				if (Math.abs(data.X-loc.x)<4 && Math.abs(data.Y-loc.y)<4)
				{
					selectedLocation=loc;
					dialog.dialog("option","buttons",{"remove location": function() {remove_location();$(this).dialog("close");}});
					title = loc.name;
					html = "<p>" + loc.fullname + "</p>";
					html += "Latitude: " + loc.latitude + "</p>";
					html += "Longitude: " + loc.longitude + "</p>";
					html += "Population: " + loc.population + "</p>";
					html += "Time Zone: " + loc.timezone + " (" + loc.gmt_offset + ", " + loc.dst_offset + ")</p>";
					break;
				}
			}
		}
		
		if (title.length>0)
		{
			dialog.dialog("option","title",title);
			dialog.html(html).dialog("open");
			dialog.dialog("widget").position({my:"left top", at:"left bottom", of:data.event});
		}

		return (title.length>0);
	}
		
	WorldMap.prototype.renderMap = function(ctx, d)
	{	
		ctx.globalAlpha = 1;
				
		var w = ctx.canvas.width;
		var h = ctx.canvas.height;
		
		var iw = img.width;
		var ih = img.height;
				
		var lst = astro.local_sidereal_time(d,0); // Local sidereal time at longitiude 0
		var rads = sun.GetRAandDec(d);  // right ascension and declination of sun
		var radm = moon.GetRAandDec(d);  // right ascension and declination of moon
		
		var meridian = astro.mod180(rads.ra-lst);         // solar meridian
		var lmoon = astro.mod180(radm.ra-lst);   // lunar meridian
		
		var screenLeft = (meridian >= 0 ? Math.round(w*meridian/360) :  Math.round(w/2 + w*(180+meridian)/360));
		var pixelLeft = (meridian >= 0 ? Math.round(iw*meridian/360) :  Math.round(iw/2 + iw*(180+meridian)/360));

		if (fixedMap)
		{
			ctx.drawImage(img,0,0,iw,ih,0,0,w,h);
		}
		else
		{	
			ctx.drawImage(img,pixelLeft,0,iw-pixelLeft,ih,0,0,w-screenLeft,h);
			ctx.drawImage(img,0,0,pixelLeft,ih,w-screenLeft,0,screenLeft,h);
		}
				
		// draw equator
		
		ctx.strokeStyle="#000000";

		ctx.beginPath();
		ctx.moveTo(0,h/2);
		ctx.lineTo(w,h/2);
		ctx.stroke();
		
		// draw locations
		ctx.strokeStyle="#FF0000";
		ctx.fillStyle="#FFFFFF";
		ctx.textAlign="center"
		for (var id in mapLocations)
		{
			var loc = mapLocations[id];
			loc.x = (fixedMap ? w/2 + (w/2)*(loc.longitude/180) : w/2 + (w/2)*astro.mod180(loc.longitude-meridian)/180);
			loc.y =  h/2 - (h/2)*(loc.latitude/90);
			ctx.beginPath();
			ctx.arc(loc.x, loc.y, 3, 0, 2*Math.PI);
			ctx.fill();
			var tm = new Date(utc.getTime() + 24*deltaT*3600*1000 + loc["gmt_offset"]*3600*1000);
			//ctx.fillText(loc.name + " (" + tm.toTimeString().substr(0, 8) + ")" ,loc.x,loc.y-5);
			ctx.fillText(loc.name + " (" + tm.toLocaleTimeString() + ")" ,loc.x,loc.y-5);
			//console.log(loc.name + " " + astro.julian_day_to_julian_date(astro.day_to_julian_day(d)+loc.tz/24));
		}

		// draw sun

		ctx.strokeStyle="#FFFF00";
		ctx.fillStyle="#FFFF00";
	
		sunLocation.x = (fixedMap ? w/2 + (w/2)*(meridian/180) : w/2);
		sunLocation.y = (h/2)*(1 - rads.dec/90);
		sunLocation.meridian = meridian;

		ctx.beginPath();
		ctx.moveTo(sunLocation.x,0);
		ctx.lineTo(sunLocation.x,h);
		ctx.stroke();
	
		ctx.beginPath();
		ctx.arc(sunLocation.x, sunLocation.y, 10, 0, 2*Math.PI);
		ctx.fill();
		
		
		// draw moon
		
		ctx.strokeStyle="#FFFFFF";
		ctx.fillStyle="#FFFFFF";
		
		moonLocation.x = (fixedMap ? w/2 + (w/2)*(lmoon/180) : w/2 + (w/2)*astro.mod180(lmoon-meridian)/180);
		moonLocation.y = (h/2)*(1 - radm.dec/90);
		moonLocation.phase = astro.mod360(lmoon-meridian);
		moonLocation.meridian = lmoon;

		ctx.beginPath();	
		ctx.moveTo(moonLocation.x,0);
		ctx.lineTo(moonLocation.x,h);
		ctx.stroke();

		ctx.beginPath();
		ctx.arc(moonLocation.x,moonLocation.y, 10, 0, 2*Math.PI);
		ctx.fill();	
		
		var angle = moonLocation.phase;     //180 * (1 - (15-moonLocation.phase)/15);
		
		var cosangle = astro.cosd(angle);

		ctx.fillStyle="#606060";
		ctx.strokeStyle="black";

		var c = {};
		c.x = moonLocation.x;
		c.y = moonLocation.y;
		
		ctx.beginPath();
		ctx.moveTo(c.x, c.y - 10);
		
		for (var i=0;i<=180;i++)
		{
			var y = astro.cosd(i);
			var x = astro.sind(i)*cosangle;
			//if (moonLocation.phase<15) ctx.lineTo(c.x + x*10, c.y - y*10);
			if (moonLocation.phase<180) ctx.lineTo(c.x + x*10, c.y - y*10);
			else ctx.lineTo(c.x - x*10, c.y + y*10);
		}
		
		//if (moonLocation.phase<15) ctx.arc(c.x,c.y,10,Math.PI/2,3*Math.PI/2);
		if (moonLocation.phase<180) ctx.arc(c.x,c.y,10,Math.PI/2,3*Math.PI/2);
		else ctx.arc(c.x,c.y,10,3*Math.PI/2,Math.PI/2);
			//context.arcTo(width/2,height/2+radius,width/2-radius,height/2,radius);
		ctx.closePath();
		ctx.fill();

		// draw day/night
		
		if (showNightDay)
		{
			ctx.globalAlpha = 0.35;
			ctx.fillStyle="#000000";

			var tandec = astro.tand(-rads.dec); // tangent of sun's declination
	
			for (var i=0; i<w ; i+=2)
			{
				var delta = (fixedMap ? meridian - (-180 + 360.0*(i/w)) : -180 + 360.0*(i/w));                  // degrees from meridiam
				var latnight = astro.atand(astro.cosd(delta)/tandec);
				if (rads.dec>0)
					ctx.fillRect(i, h/2 - h/2*(latnight/90), 2, h/2 + (h/2)*(latnight/90));
				else
					ctx.fillRect(i, 0, 2, h/2 - (h/2)*(latnight/90));
			}
		}		
	}
	
	WorldMap.prototype.animateMap = function()
	{
		this.renderMap(context2, d0 + deltaT);
		context.drawImage(canvas2, 0, 0);
		var date = new Date(dateLocal.getTime() + 24*deltaT*3600*1000);
		if (this.displayTime != undefined)
			this.displayTime(date);
		var that = this;
		if (this.animate)
		{
			deltaT += 1/1440.0;
			setTimeout(function(){that.animateMap();},20);
		}
	}
		
	WorldMap.prototype.setAnimate = function(animate)
	{
		this.animate = animate;
		if (this.animate)
			this.animateMap();
	}
	
	WorldMap.prototype.setFixedMap = function(fixed)
	{
		fixedMap = fixed;
		if (!this.animate)
			this.animateMap();
	}
	
	WorldMap.prototype.showNightDay = function(value) {
		showNightDay=value;
		if (!this.animate)
			this.animateMap();
	}

	WorldMap.prototype.resetTime = function()
	{
		deltaT=0;
		utc=astro.getUTC();
		d0 = astro.date_to_day(utc);
		dateLocal = new Date();
		if (this.displayTime != undefined)
			this.displayTime(dateLocal);
		if (!this.animate) 
			this.animateMap();
	}
	
	WorldMap.prototype.setLocalTime = function(date)
	{
		deltaT=0;
		dateLocal=date;
		utc = new Date(dateLocal.getTime() + dateLocal.getTimezoneOffset()*60*1000);
		d0 = astro.date_to_day(utc);
		if (this.displayTime != undefined)
			this.displayTime(dateLocal);			
		if (!this.animate) 
			this.animateMap();
	}
	
	WorldMap.prototype.addLocation = function(id)
	{
		$.getJSON(
			cityServer+id,
			function (data) {
				mapLocations[id] = data;
				var keys = [];
				for (var i in mapLocations)
					keys.push(i);
				utility.setCookie(cookieName,keys.join(","),100);
				if (!that.animate)
					that.animateMap();
			}
		);
	}
	
	this.animateMap();
		
	var cookie = utility.getCookie(cookieName);
	if (cookie!=null && cookie.length>0)
	{
		$.getJSON(
			cityServer+"?id="+cookie,
			function (data) {
				for (var i=0;i<data.length;i++)
				{
					var loc = data[i];
					mapLocations[loc["geonameid"]] = loc;
				}
				if (!that.animate)
					that.animateMap();
			}
		);
	}
}