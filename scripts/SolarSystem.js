SolarSystem = function(canvasID, planets, displayTime)
{
	this.animate = false;
	this.zoom = 1;
	this.displayTime = displayTime;

	var zAngle=0;
	var xAngle=0;
	var zAngle0=0;
	var xAngle0=0;
	var centerPlanet = "Sun";
	var I = new Matrix4(true);
	var matrix = I.projection(10,1,-30,30);
	var astro = new Astro();
	var sun = planets["Sun"].planet;
	var utc = astro.getUTC();
	var d0 = astro.date_to_day(utc);
	var d = d0;
	var deltaT = 0;
	var dateLocal = new Date();
	var c=document.getElementById(canvasID);
	var ctx=c.getContext("2d");
	var width = ctx.canvas.width;
	var height = ctx.canvas.height;
	var canvas2 = document.createElement('canvas');
	canvas2.width = c.width;
	canvas2.height = c.height;
	var ctx2 = canvas2.getContext('2d');
	var dialog = $('<div class="uiDialog"></div>') .html('').dialog({width:300, height:150, autoOpen:false}); 


	var helper = new CanvasHelper(canvasID,this);
	helper.drag = function(data) {
		if (data.beginDrag)
		{
			zAngle0 = zAngle;
			xAngle0 = xAngle;
		}
		zAngle = zAngle0 - data.deltaX;
		xAngle = xAngle0 + data.deltaY; 
		matrix = I.rotate(2,zAngle).rotate(0,xAngle).projection(10,1,-30,30);
		if (!data.context.animate)
			data.context.animateSolarSystem();
	}
	helper.hover = function()
	{
		//console.log(helper);
	}
	
	helper.click = function(data)
	{
 		for (name in planets)
		{
			var item = planets[name];
			if (Math.abs(data.X-item.x)<item.diam/2 && Math.abs(data.Y-item.y)<item.diam/2)
			{
				var html = "";
				dialog.dialog("option","title",name);
				dialog.html(html).dialog("open");
				return true;	
			}
		}
		return false;
	}
		
	SolarSystem.prototype.renderPlanet = function(ctx, p, d)
	{
		var oldStyle = ctx.strokeStyle;
		ctx.strokeStyle = "white";
	
		var period = p.planet.GetPeriod(d) * astro.DAYSINYEAR;
		var maxP = Math.min(width,height)/2;
		
		var center = centerPlanet=="Sun" ? {x:0,y:0,z:0} : planets[centerPlanet].planet.GetRectangularCoordinates(d);
		
		if (centerPlanet=="Sun" && p.planet.name != "Sun")
		{		
			ctx.beginPath();
			for (var i=0;i<=360;i+=2)
			{
				var dval = d + i * period / 360;			
				var coords = p.planet.GetRectangularCoordinates(dval);
				coords.w = 1;
				var projected = matrix.vecMult(coords);
				var x = width/2  + maxP * this.zoom*(projected.x/projected.z)/35;
				var y = height/2 - maxP * this.zoom*(projected.y/projected.z)/35;
				if (i==0)
					ctx.moveTo(x,y);
				else
					ctx.lineTo(x,y);
			}
			ctx.stroke();	
		}
		
		var coords = p.planet.name=="Sun" ? {x:0,y:0,z:0} : p.planet.GetRectangularCoordinates(d);
		coords.x -= center.x;
		coords.y -= center.y;
		coords.z -= center.z;
		coords.w = 1;
		var projected = matrix.vecMult(coords);
		
		var x = width/2 + maxP * this.zoom * (projected.x/projected.z)/35;
		var y = height/2 - maxP * this.zoom * (projected.y/projected.z)/35;

		var diam = Math.round(10 + this.zoom/10); 
		p.x = x;
		p.y = y;
		p.diam = diam;
				
		ctx.drawImage(p.image,0,0,94,94,x-diam/2,y-diam/2,diam,diam);

		ctx.strokeStyle = oldStyle;
	}

	SolarSystem.prototype.animateSolarSystem = function()
	{
		ctx2.fillStyle = "black";
		ctx2.fillRect(0,0,width,height);
				
		for (name in planets)
		{
			if (name=="Moon")
				continue;
			var p = planets[name];
			this.renderPlanet(ctx2, p, d+deltaT);
		}
		
		ctx.drawImage(canvas2, 0, 0);
		
		var date = new Date(dateLocal.getTime() + 24*deltaT*3600*1000);
		if (this.displayTime != undefined)
			this.displayTime(date);
		
		if (this.animate)
		{
			deltaT += 1;
			var that = this;
			setTimeout(function() {that.animateSolarSystem()},40);
		}
	}
	
	SolarSystem.prototype.setZoom = function(value)
	{
		this.zoom = value;
		if (!this.animate)
			this.animateSolarSystem();
	}
	
	SolarSystem.prototype.setAnimate = function(animate)
	{
		this.animate = animate;
		if (this.animate)
			this.animateSolarSystem();
	}
	
	SolarSystem.prototype.resetTime = function()
	{
		deltaT=0;
		utc=astro.getUTC();
		dateLocal = new Date();
		d0 = astro.date_to_day(utc);
		if (this.displayTime != undefined)
			this.displayTime(dateLocal);
		if (!this.animate) 
			this.animateSolarSystem();
	}
	
	SolarSystem.prototype.setLocalTime = function(date)
	{
		deltaT=0;
		dateLocal=date;
		utc = new Date(dateLocal.getTime() + dateLocal.getTimezoneOffset()*60*1000);
		d0 = astro.date_to_day(utc);	
		d=d0;
		if (this.displayTime != undefined)
			this.displayTime(dateLocal);
		if (!this.animate) 
			this.animateSolarSystem();
	}
	

	SolarSystem.prototype.resetOrientation = function()
	{
		xAngle=zAngle=0;
		matrix = I.projection(10,1,-30,30);
		if (!this.animate) 
			this.animateSolarSystem();
	}
	
	SolarSystem.prototype.setCenterObject = function(name)
	{
		centerPlanet = name;
		if (!this.animate) 
			this.animateSolarSystem();
	}
	
	this.animateSolarSystem();
}