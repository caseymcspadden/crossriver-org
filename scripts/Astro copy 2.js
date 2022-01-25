Astro = function()
{
	var KEPLERCONST = 9.9071e-14; // ratio of T^2/R^3 in mks units
	var EARTH_RADIUS = 6378.135;
	Astro.prototype.DAYSINYEAR = 365.2568984;
	var SECSPERDAY =  86400;
	var OMEGA_E = 1.00273790934; // earth rotation per sideral day
	var EARTH_FLATTENING = .003352779; // Earth flattening (WGS '72) for calculating latitude (= 1.0/298.26) 
	var GREGORIAN_EPOCH = 1721425.5;

	Astro.prototype.day_to_julian_day = function(d) {return d+2451543.5;},
	Astro.prototype.julian_day_to_day =function(d) {return d-2451543.5;}	
	Astro.prototype.mod360 = function(angle) {return angle - Math.floor(angle/360)*360;}
	Astro.prototype.mod180 = function(angle) {angle = this.mod360(angle); return (angle > 180) ? angle-360 : angle;}
	Astro.prototype.mod90 = function(angle) {angle = this.mod360(angle); return (angle > 270) ? angle-360 : angle;}
	Astro.prototype.deg_to_rad = function(val) {return Math.PI*(val/180);}
	Astro.prototype.rad_to_deg = function(val) {return 180*(val/Math.PI);}
	Astro.prototype.earth_obliquity = function(d) {return 23.4393 - 3.563E-7*d;}
	Astro.prototype.cosd = function(deg) {return Math.cos(Math.PI*deg/180);}
	Astro.prototype.sind = function(deg) {return Math.sin(Math.PI*deg/180);}
	Astro.prototype.tand = function(deg) {return Math.tan(Math.PI*deg/180);}
	Astro.prototype.acosd = function(v) {return 180*Math.acos(v)/Math.PI;}
	Astro.prototype.asind = function(v) {return 180*Math.asin(v)/Math.PI;}
	Astro.prototype.atand = function(v) {return 180*Math.atan(v)/Math.PI;}
	Astro.prototype.atan2d = function(y,x) {return 180*Math.atan2(y,x)/Math.PI;}

	Astro.prototype.getUTC = function()
	{
		//var now = new Date(2013,2,21); 
		var now = new Date(); 
		return new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
	}

	Astro.prototype.date_to_day3 = function(date)
	{
		var year = date.getFullYear();
		var mday = date.getDate();
		var mon = date.getMonth() + 1;
		var hours = date.getHours();
		var minutes = date.getMinutes();
		var seconds = date.getSeconds();
	
		return 367*year - Math.floor( 7 * (year + Math.floor( (mon+9)/12 ))/4) + Math.floor((275*mon)/9) + mday - 730530 + (hours*3600+minutes*60+seconds)/86400;
	}
	
	Astro.prototype.date_to_julian_day = function(date)
	{
		var year = date.getFullYear();
		if (year<0) year++;
		var mday = date.getDate();
		var mon = date.getMonth() + 1;
		var hours = date.getHours();
		var minutes = date.getMinutes();
		var seconds = date.getSeconds();
		
		var a = Math.floor((14-mon)/12);
		var y = year + 4800 - a;
		var m = mon + 12*a -3;
		
		return mday  + Math.floor((153*m+2)/5) + 365*y + Math.floor(y/4) - Math.floor(y/100) + Math.floor(y/400) - 32045 - 0.5 + (hours*3600+minutes*60+seconds)/86400;
	}
	
	Astro.prototype.date_to_day = function(date)
	{
		return this.julian_day_to_day(this.date_to_julian_day(date));
	}
	
	Astro.prototype.date_to_julian_day2 = function(date)
	{
		var hours = date.getHours();
		var minutes = date.getMinutes();
		var seconds = date.getSeconds();
		var year = date.getFullYear();
		if (year<0) year++;
		var month = date.getMonth()+1;
		var jy=year;
		var jm = month+1;
		var day = date.getDate();
		if (month<=2) {jy--; jm += 12;}
		var jul = Math.floor(365.25*jy) + Math.floor(30.6001*jm) + day + 1720995;
		if (day + 31*(month+12*year) >= (15+31*(10+12*1582)))
		{
			var ja = Math.floor(0.01 * jy);
			jul = jul + 2 - ja + Math.floor(0.25 * ja);
		}
		return jul-0.5+(hours*3600+minutes*60+seconds)/86400;
	}


	Astro.prototype.rotate2 = function(axis,dcosangle,dsinangle,coords) // returns object {x:X, y:Y, z:Z}
	{
		var ret = {}
		
		if (coords.r!==undefined) ret.r = coords.r;
	
		switch (axis) {
			case 0: // XAXIS 
				ret.x = coords.x;
				ret.y = coords.y * dcosangle - coords.z * dsinangle;
				ret.z = coords.y * dsinangle + coords.z * dcosangle;
				break;
		case 1: // YAXIS 
				ret.y = coords.y;
				ret.z = coords.z * dcosangle - coords.x * dsinangle;
				ret.x = coords.z * dsinangle + coords.x * dcosangle;
			break;
		case 2: // ZAXIS
				ret.z = coords.z; 
				ret.x = coords.x * dcosangle - coords.y * dsinangle;
				ret.y = coords.x * dsinangle + coords.y * dcosangle;
			break;
		}
		return ret;
	}

	Astro.prototype.rotate = function(axis,angle,coords)
	{
		return this.rotate2(axis,this.cosd(angle),this.sind(angle),coords);
	}

	Astro.prototype.spherical_to_rectangular = function(coords)  // returns object {x:X, y:Y, z:Z, r:R}
	{
		var ret = {};
		ret.x = this.cosd(coords.dec) * this.cosd(coords.ra);
		ret.y = this.cosd(coords.dec) * this.sind(coords.ra);
		ret.z = this.sind(coords.dec);
		ret.r = 1;
		return ret; 
	}

	Astro.prototype.rectangular_to_spherical = function(coords)  // returns object {lon: LON, lat:LAT, r:R}
	{
		var ret = {};
		var r = coords.x*coords.x+coords.y*coords.y;
		ret.lon = this.mod360(this.atan2d(coords.y,coords.x));
		ret.lat = this.mod90(this.atan2d(coords.z,Math.sqrt(r)));
		ret.r = Math.sqrt(r+coords.z*coords.z);
		return ret; 
	}	
	
	Astro.prototype.leap_gregorian = function(year)
	{
    return ((year % 4) == 0) &&
            (!(((year % 100) == 0) && ((year % 400) != 0)));
	}

	Astro.prototype.gregorian_to_jd = function(year,month,day)
	{
    return (GREGORIAN_EPOCH - 1) +
           (365 * (year - 1)) +
           Math.floor((year - 1) / 4) +
           (-Math.floor((year - 1) / 100)) +
           Math.floor((year - 1) / 400) +
           Math.floor((((367 * month) - 362) / 12) +
           ((month <= 2) ? 0 : (this.leap_gregorian(year) ? -1 : -2)) +
           day);
	}
	
	Astro.prototype.julian_day_to_julian_date = function(jd)
	{
		var jd0 = Math.floor(jd);
		var secs = 86400*(jd - jd0);
		var h = Math.floor(secs/3600);
		var m = Math.floor((secs-(h*3600))/60);
		var s = secs - h*3600 - m*60;

		var j = jd0 + 1402;
		var k = Math.floor((j - 1) / 1461);
		var l = j - 1461 * k;
		var n = Math.floor((l - 1) / 365) - Math.floor(l / 1461);
		var i = l - 365 * n + 30;
		j = Math.floor((80 * i) / 2447);
		var day = Math.floor(i - (2447 * j) / 80);
		i = Math.floor(j / 11);
		var month = j + 2 - 12 * i;
		var year = 4 * k + n + i - 4716;
	
		return new Date(year,month,day,h,m,s);	
	}

	Astro.prototype.local_sidereal_time = function(d,lon)
	{
		jd = this.day_to_julian_day(d);
		UT   = (jd + 0.5) - Math.floor(jd+0.5);
		jd	-= UT;
		TU   = (jd - 2451545.0)/36525.0;
		GMST = 24110.54841 + TU * (8640184.812866 + TU * (0.093104 - TU * 6.2E-6));
		GMST = (GMST + SECSPERDAY*OMEGA_E*UT)%SECSPERDAY;
		return this.mod360(360.0*GMST/SECSPERDAY + lon);
	}
	
	Astro.prototype.day_to_hms = function(d)  // returns object {h:H, m:M, s:S}
	{
		var day = Math.floor(d);
		var val = 24*(d-day);
		var h = Math.floor(val);
		val = 60*(val-h);
		var m = Math.floor(val);
		var s = 60*(val-m);
		
		return {day:day, h:h, m:m, s:s};
	}

	Astro.prototype.deg_to_hms = function(deg)  // returns object {h:H, m:M, s:S}
	{
		var val = 24*deg/360;
		var h = Math.floor(val);
		val = 60*(val-h);
		var m = Math.floor(val);
		var s = 60*(val-m);
		
		return {h:h, m:m, s:s};
	}

	Astro.prototype.deg_to_dms = function(deg) // returns object (d:D, m:M, s:S)
	{
		var isneg = (deg<0);
		var deg = Math.abs(deg);
		var d = Math.floor(deg);
		var val = 60*(deg-d);
		var m = Math.floor(val);
		var s = 60*(val-m);
		if (isneg) d=-d;
		return {d:d, m:m, s:s};
	}
	
	
	Astro.prototype.RADecToAltitudeAzimuth = function(dcoslat,dsinlat,dlst,ra,dec)  // returns object {alt:ALT, az:AZ}
	{
		var lha = this.mod360(dlst - ra);   // local hour angle
		azisnegative= (lha<=180);
	
		var dsindec = this.sind(dec);
		var dcosdec = this.cosd(dec);

		var dsinalt = dsindec*dsinlat+dcosdec*this.cosd(lha)*dcoslat;
		var dcosalt = Math.sqrt(1-dsinalt*dsinalt);

		var alt = this.asind(dsinalt);

		var dcosaz  = (dsindec - dsinalt*dsinlat)/(dcosalt*dcoslat);
		if (dcosaz < -1) dcosaz=-1;
		if (dcosaz > 1)  dcosaz=1;

		var az = this.acosd(dcosaz);
		if (azisnegative) az = 360 - az;
		
		return {alt:alt, az:az};
	}

	Astro.prototype.RiseSet = function(day,dcoslat,dsinlat,dlon,dalt,ra,dec)  // return object {rise:RISE, set:SET}
	{
		var lst = this.local_sidereal_time(day,dlon);
		var lha = this.mod180(lst - ra);   // local hour angle

		var dcosha = (this.sind(dalt) - dsinlat*this.sind(dec))/(dcoslat*this.cosd(dec));

		if (Math.abs(dcosha) >= 1) {
			return {rise:0, set:0};
		}

		var ha = this.acosd(dcosha);
		var IsVisible = (Math.abs(lha) < ha);
		
		var rise=0, set=0;

		if (IsVisible || (lha<0)) {					  // rise happened earlier, set happens later
			rise = (day-(lha+ha)/360.98568);
			set  = (day+(ha-lha)/360.98568);
		}
		else {
			rise = (day+(360-ha-lha)/360.98568); // both rise & set happen later
			set  = (day+(360+ha-lha)/360.98568);
		}
		return {rise:rise, set:set};
	}
	
	Astro.prototype.CalculatePrecessionMatrix = function(fromyear,toyear)
	{
		var dMatrix = new Array();

		var CSR = 4.8481368110953e-06;

    var T=0.001*(toyear-fromyear);
    var ST=0.001*(fromyear-1900.0);
    var A=CSR*T*(23042.53+ST*(139.75+0.06*ST)+T*(30.23-0.27*ST+18.0*T)) ;
    var B=CSR*T*T*(79.27+0.66*ST+0.32*T)+A ;
    var C=CSR*T*(20046.85-ST*(85.33+0.37*ST)+T*(-42.67-0.37*ST-41.8*T)) ;
    var SINA=Math.sin(A) ;
    var SINB=Math.sin(B) ;
    var SINC=Math.sin(C) ;
    var COSA=Math.cos(A) ;
    var COSB=Math.cos(B) ;
    var COSC=Math.cos(C) ;
		dMatrix[0]=COSA*COSB*COSC-SINA*SINB ;
    dMatrix[1]=-COSA*SINB-SINA*COSB*COSC ;
    dMatrix[2]=-COSB*SINC ;
    dMatrix[3]=SINA*COSB+COSA*SINB*COSC ;
    dMatrix[4]=COSA*COSB-SINA*SINB*COSC ;
    dMatrix[5]=-SINB*SINC ;
    dMatrix[6]=COSA*SINC ;
    dMatrix[7]=-SINA*SINC ;
    dMatrix[8]=COSC ;
    return dMatrix;
	}
	
	Astro.prototype.lunarPhase = function(d)
	{
		var jd = this.day_to_julian_day(d);
		var date = this.julian_day_to_julian_date(jd);
	
		var year = date.getFullYear();
		var month = date.getMonth() + 1;
	
		var n = Math.floor(12.37 * (year -1900 + ((1.0 * month - 0.5)/12.0)));
		var RAD = Math.PI/180.0;
		var t = n / 1236.85;
		var t2 = t * t;
		var as = 359.2242 + 29.105356 * n;
		var am = 306.0253 + 385.816918 * n + 0.010730 * t2;
		var xtra = 0.75933 + 1.53058868 * n + ((1.178e-4) - (1.55e-7) * t) * t2;
		xtra += (0.1734 - 3.93e-4 * t) * Math.sin(RAD * as) - 0.4068 * Math.sin(RAD * am);
		var i = (xtra > 0.0 ? Math.floor(xtra) :  Math.ceil(xtra - 1.0));
	
		var j0 = (2415020-0.5 + 28 * n) + i;
		return (jd-j0 + 30)%30;		
	}
}

Orbiter = function(name)
{
	this.name = name;
	this.astro = new Astro();
	
	Orbiter.prototype.m_N = function(d) {return 0;}
	Orbiter.prototype.m_i = function(d) {return 0;}
	Orbiter.prototype.m_w = function(d) {return 0;}
	Orbiter.prototype.m_a = function(d) {return 0;}
	Orbiter.prototype.m_e = function(d) {return 0;}
	Orbiter.prototype.m_M = function(d) {return 0;}
	
	this.m_nIter = 30;
	this.m_dPrecision = 1e-4;

	Orbiter.prototype.get_N = function(d) {return this.astro.mod360(this.m_N(d));}
	Orbiter.prototype.get_i = function(d) {return this.astro.mod360(this.m_i(d));}
	Orbiter.prototype.get_w = function(d) {return this.astro.mod360(this.m_w(d));}
	Orbiter.prototype.get_a = function(d) {return this.m_a(d);}
	Orbiter.prototype.get_e = function(d) {return this.m_e(d);}
	Orbiter.prototype.get_M = function(d) {return this.astro.mod360(this.m_M(d));}

	Orbiter.prototype.GetMeanAnomaly = function(d) {return this.get_M(d);}
	Orbiter.prototype.GetPerihelionArgument = function(d) {return this.get_w(d);}
	Orbiter.prototype.GetMeanLongitude = function(d) {return this.astro.mod360(this.GetMeanAnomaly(d) + this.GetPerihelionArgument(d));}
	Orbiter.prototype.GetPeriod = function(d) {return Math.pow(this.m_a(d), 1.5);}

	Orbiter.prototype.GetRectangularCoordinates = function(d) // returns object {x:X, y:Y, z:Z, r:R}
	{
		dN = this.get_N(d);
		dw = this.GetPerihelionArgument(d);
		di = this.get_i(d);
		
		var vr = this.GetTrueAnomalyAndDistance(d);

		dx = vr.r * ( this.astro.cosd(dN)*this.astro.cosd(vr.v+dw) - this.astro.sind(dN)*this.astro.sind(vr.v+dw)*this.astro.cosd(di) );
		dy = vr.r * ( this.astro.sind(dN)*this.astro.cosd(vr.v+dw) + this.astro.cosd(dN)*this.astro.sind(vr.v+dw)*this.astro.cosd(di) );
		dz = vr.r * ( this.astro.sind(vr.v+dw) * this.astro.sind(di) );

		return {x:dx, y:dy, z:dz, r:vr.r};
	}

	Orbiter.prototype.get_eccentric_anomaly = function(d)
	{
		dM = this.GetMeanAnomaly(d);
		de = this.get_e(d);

		dE = dM + this.astro.rad_to_deg(de) * this.astro.sind(dM) * (1.0 + de*this.astro.cosd(dM));

		if (de < 0.05) return dE;
	
		for (var i=0;i<this.m_nIter;i++) 
		{
			var dE0 = dE;
			dE = dE0 - (dE0 - this.astro.rad_to_deg(de)*this.astro.sind(dE0) - dM) / (1.0 - de*this.astro.cosd(dE0));
			if (Math.abs(dE-dE0) < this.m_dPrecision)
				break;
		}

		return dE;
	}

	Orbiter.prototype.ecliptic_to_equatorial = function(d,xyz)  // xyz = coordinate object returns object {x:X, y:Y, z:Z}
	{
		var decl = this.astro.earth_obliquity(d);
		var dyret = xyz.y*this.astro.cosd(decl) - xyz.z*this.astro.sind(decl);
		var dzret = xyz.y*this.astro.sind(decl) + xyz.z*this.astro.cosd(decl);
		return {x:xyz.x, y:dyret, z:dzret};
	}
	
	Orbiter.prototype.GetHeliocentricCoordinates = function(d)   // returns xyz coordinate object
	{
		var dE = this.get_eccentric_anomaly(d);
		var de = this.get_e(d);
		var da = this.get_a(d);

		var dx = da * (this.astro.cosd(dE) - de);
		var dy = da * (Math.sqrt(1.0 - de*de) * this.astro.sind(dE));
		return {x:dx, y:dy, z:0};
	}

	Orbiter.prototype.GetTrueAnomalyAndDistance = function(d) // returns object {v:V, r:R}
	{
		var xyz = this.GetHeliocentricCoordinates(d);
		dv = this.astro.atan2d(xyz.y,xyz.x);
		if (dv<0) dv+=360;
		dr = Math.sqrt(xyz.x*xyz.x + xyz.y*xyz.y);
		return {v:dv, r:dr}
	}

	Orbiter.prototype.IteratedRiseSet = function(d,dcoslat,dsinlat,dlon,dalt)    // returns object {rise:RISE, set:SET)
	{
		var MaxIter=10;
		var bComputingRise=true;

		var day=d;
		var obl = this.astro.earth_obliquity(day);
		var dcosobl = this.astro.cosd(obl);	
		var dsinobl = this.astro.sind(obl);
		
		var ret = {}
	
		for (var i=0;i<MaxIter;i++) 
		{
			xyz = this.GetRectangularCoordinates(day);
						
			xyz = this.astro.rotate2(0,dcosobl,dsinobl,xyz);

			var lonlat = this.astro.rectangular_to_spherical(xyz);
			
			var rs = this.astro.RiseSet(day,dcoslat,dsinlat,dlon,dalt,lonlat.lon,lonlat.lat);
						
			if (bComputingRise) 
			{
				if (Math.abs(rs.rise-day)>0.00139)
					day=rs.rise;
				else 
				{
					day=d;
					ret.rise=rs.rise;
					bComputingRise=false;
				}
			}
			else 
			{			
				if (Math.abs(rs.set-day)>0.00139) 
					day=rs.set;
				else 
				{
					ret.set=rs.set;
					break;
				}
			}
		}
		return ret;
	}			
}

Sun = function()
{
	Sun.prototype.name = "Sun";
	Sun.prototype.m_N = function(d) {return 0.0;}
	Sun.prototype.m_i = function(d) {return 0.0;}
	Sun.prototype.m_w = function(d) {return 282.9404 + 4.70935E-5*d;} 
	Sun.prototype.m_a = function(d) {return 1.000000;}
	Sun.prototype.m_e = function(d) {return 0.016709 + -1.151E-9*d;}
	Sun.prototype.m_M = function(d) {return 356.0470 + 0.9856002585*d;} 
	
	Sun.prototype.GetRAandDec = function(d)  // returns object {re:RA, dec:DEC}
	{
		var ret = {};
		var xyz = this.GetRectangularCoordinates(d);
		xyz = this.ecliptic_to_equatorial(d,xyz);
		ret.ra  = this.astro.mod360(this.astro.atan2d(xyz.y,xyz.x));
		ret.dec = this.astro.mod90(this.astro.atan2d(xyz.z,Math.sqrt(xyz.x*xyz.x+xyz.y*xyz.y)));
		return ret;
	}
}
Sun.prototype = new Orbiter();

Moon = function()
{
	this.m_sun = new Sun();
	Moon.prototype.name = "Moon";
	Moon.prototype.m_N  = function(d) {return 125.1228 + -0.0529538083*d;} 
	Moon.prototype.m_i = function(d) {return 5.1454;}
	Moon.prototype.m_w = function(d) {return 318.0634 + 0.1643573223*d;}
	Moon.prototype.m_a = function(d) {return 60.2666;}
	Moon.prototype.m_e = function(d) {return 0.054900;}
	Moon.prototype.m_M = function(d) {return 115.3654 + 13.0649929509*d;}

	Moon.prototype.GetRAandDec = function(d,topo,lat,lon) // returns object {ra:RA, dec:DEC}
	{
		var dMm = this.GetMeanAnomaly(d);				// Mean anomaly of Moon
		var dMs = this.m_sun.GetMeanAnomaly(d);		// Mean anomaly of Sun
		var dNm = this.get_N(d);						// Longitude of moon's node
		var dwm = this.GetPerihelionArgument(d);		 // Argument of moon's perihelion	
		var dws = this.m_sun.GetPerihelionArgument(d); // Argument of sun's perihelion
		var dLs = dMs + dws;						   // Mean longitude of sun
		var dLm = dMm + dwm + dNm;				   // Mean longitude of moon
		var D = dLm - dLs;						// Mean elongation of moon			
		var F = dLm - dNm;						// Argument of latitude for moon
	
		var xyz = this.GetRectangularCoordinates(d);	
		var dlonecl = this.astro.atan2d(xyz.y,xyz.x);
		var dlatecl = this.astro.atan2d(xyz.z,Math.sqrt(xyz.x*xyz.x+xyz.y*xyz.y));

		dlonecl -= 1.274 * this.astro.sind(dMm - 2*D);
		dlonecl += 0.658 * this.astro.sind(2*D);
		dlonecl -= 0.186 * this.astro.sind(dMs);
		dlonecl -= 0.059 * this.astro.sind(2*dMm - 2*D);
		dlonecl -= 0.057 * this.astro.sind(dMm - 2*D + dMs);
		dlonecl += 0.053 * this.astro.sind(dMm + 2*D);
		dlonecl += 0.046 * this.astro.sind(2*D - dMs);
		dlonecl += 0.041 * this.astro.sind(dMm - dMs);
		dlonecl -= 0.035 * this.astro.sind(D);
		dlonecl -= 0.031 * this.astro.sind(dMm + dMs);
		dlonecl -= 0.015 * this.astro.sind(2*F - 2*D);
		dlonecl += 0.011 * this.astro.sind(dMm - 4*D);
	
	  dlatecl -= 0.173 * this.astro.sind(F - 2*D);
		dlatecl -= 0.055 * this.astro.sind(dMm - F - 2*D);
		dlatecl -= 0.046 * this.astro.sind(dMm + F - 2*D);
		dlatecl += 0.033 * this.astro.sind(F + 2*D);
		dlatecl += 0.017 * this.astro.sind(2*dMm + F);

		dr -= 0.58 * this.astro.cosd(dMm - 2*D);
		dr -= 0.46 * this.astro.cosd(2*D);

		xyz.x = dr * this.astro.cosd(dlonecl) * this.astro.cosd(dlatecl);
		xyz.y = dr * this.astro.sind(dlonecl) * this.astro.cosd(dlatecl);
		xyz.z = dr * this.astro.sind(dlatecl);

		xyz = this.ecliptic_to_equatorial(d,xyz);

		var ra  = this.astro.mod360(this.astro.atan2d(xyz.y,xyz.x));
		var dec = this.astro.mod90(this.astro.atan2d(xyz.z,Math.sqrt(xyz.x*xyz.x+xyz.y*xyz.y)));

		// convert to topocentric
		if (topo)
		{
			var mpar = this.astro.asind(1/dr);
			var gclat = lat - 0.1924 * this.astro.sind(2*lat);
			var rho = 0.99883 + 0.00167 * this.astro.cosd(2*lat);
			var lha = this.m_sun.GetMeanLongitude(d) + 180 + d*360 + lon - ra;
			var g = this.astro.atand(this.astro.tand(gclat)/this.astro.cosd(lha));
	
			var topRA = ra - mpar * rho * this.astro.cosd(gclat) * this.astro.sind(lha) / this.astro.cosd(dec);
			var topDec = dec - mpar * rho * this.astro.sind(gclat) * this.astro.sind(g - dec) / this.astro.sind(g);

			ra = topRA;
			dec = topDec;
		}
		return {ra:ra, dec:dec};
	}
}
Moon.prototype = new Orbiter();

Planet = function()           
{ 
	this.m_sun = new Sun();
		
	Planet.prototype.GetRAandDec = function(d) // returns object {ra:RA, dec:DEC, r:R}
	{
		var ret = {};
	
		var xyz = this.GetRectangularCoordinates(d);

		var xyzsun = this.m_sun.GetRectangularCoordinates(d);

		xyz.x += xyzsun.x; xyz.y += xyzsun.y; xyz.z += xyzsun.z;

		xyz = this.ecliptic_to_equatorial(d,xyz);

		xysq = xyz.x*xyz.x + xyz.y*xyz.y 

		ret.ra  = this.astro.mod360(this.astro.atan2d(xyz.y,xyz.x));
		ret.dec = this.astro.mod90(this.astro.atan2d(xyz.z,Math.sqrt(xysq)));
		ret.r = Math.sqrt(xysq + xyz.z*xyz.z);
		return ret;
	}
}
Planet.prototype = new Orbiter();

Mercury = function()
{
	Mercury.prototype.name = "Mercury";
	Mercury.prototype.m_N = function(d) {return 48.3313 + 3.24587E-5 * d;}
	Mercury.prototype.m_i = function(d) {return 7.0047 + 5.00E-8 * d;}
	Mercury.prototype.m_w = function(d) {return 29.1241 + 1.01444E-5 * d;}
	Mercury.prototype.m_a = function(d) {return 0.387098;}
	Mercury.prototype.m_e = function(d) {return 0.205635 + 5.59E-10 * d;}
	Mercury.prototype.m_M = function(d) {return 168.6562 + 4.0923344368 * d;}
}
Mercury.prototype = new Planet();

Venus = function()
{
	Venus.prototype.name = "Venus";

	this.m_N = function(d) {return 76.6799 + 2.46590E-5 * d;}
	this.m_i = function(d) {return 3.3946 + 2.75E-8 * d;}
	this.m_w = function(d) {return 54.8910 + 1.38374E-5 * d;}
	this.m_a = function(d) {return 0.723330;}
	this.m_e = function(d) {return 0.006773 - 1.302E-9 * d;}
	this.m_M = function(d) {return 48.0052 + 1.6021302244 * d;}
}
Venus.prototype = new Planet();

Earth = function()
{
	Earth.prototype.name = "Earth";
	this.m_N = function(d) {return  0;}
	this.m_i = function(d) {return  0;}
	this.m_w = function(d) {return  102.9404 + 4.70935e-5 * d;}
	this.m_a = function(d) {return  1.00000018;}
	this.m_e = function(d) {return  0.016709 - 1.151e-9 * d;}
	this.m_M = function(d) {return  356.0470 + 0.9856002585 * d;}
}
Earth.prototype = new Planet();

Mars = function()
{
	Mars.prototype.name = "Mars";
	this.m_N = function(d) {return  49.5574 + 2.11081E-5 * d;}
	this.m_i = function(d) {return  1.8497 + 1.78E-8 * d;}
	this.m_w = function(d) {return  286.5016 + 2.92961E-5 * d;}
	this.m_a = function(d) {return  1.523688;}
	this.m_e = function(d) {return  0.093405 + 2.516E-9 * d;}
	this.m_M = function(d) {return  18.6021 + 0.5240207766 * d;}
}
Mars.prototype = new Planet();

Jupiter = function()
{
	Jupiter.prototype.name = "Jupiter";
	Jupiter.prototype.m_N = function(d) {return  100.4542 + 2.76854E-5 * d;}
	Jupiter.prototype.m_i = function(d) {return  1.3030 - 1.557E-7 * d;}
	Jupiter.prototype.m_w = function(d) {return  273.8777 + 1.64505E-5 * d;}
	Jupiter.prototype.m_a = function(d) {return  5.20256;}
	Jupiter.prototype.m_e = function(d) {return  0.048498 + 4.469E-9 * d;}
	Jupiter.prototype.m_M = function(d) {return  19.8950 + 0.0830853001 * d;}

	this.GetRectangularCoordinates = function(d)
	{
		var dMj = this.GetMeanAnomaly(d);
		var dMs = 316.9670 + 0.0334442282*d; //saturn mean anomaly

		var xyzr = Jupiter.prototype.GetRectangularCoordinates(d);

		var dlonecl = this.astro.atan2d(xyzr.y,xyzr.x);
		var dlatecl = this.astro.atan2d(xyzr.z,Math.sqrt(xyzr.x*xyzr.x+xyzr.y*xyzr.y));

		dlonecl -= 0.332 * this.astro.sind(2*dMj - 5*dMs - 67.6);
		dlonecl -= 0.056 * this.astro.sind(2*dMj - 2*dMs + 21);
		dlonecl += 0.042 * this.astro.sind(3*dMj - 5*dMs + 21);
		dlonecl -= 0.036 * this.astro.sind(dMj - 2*dMs);
		dlonecl += 0.022 * this.astro.cosd(dMj - dMs);
		dlonecl += 0.023 * this.astro.sind(2*dMj - 3*dMs + 52);
		dlonecl -= 0.016 * this.astro.sind(dMj - 5*dMs - 69);

		xyzr.x = xyzr.r * this.astro.cosd(dlonecl) * this.astro.cosd(dlatecl);
		xyzr.y = xyzr.r * this.astro.sind(dlonecl) * this.astro.cosd(dlatecl);
	
		xyzr.r = Math.sqrt(xyzr.x*xyzr.x+xyzr.y*xyzr.y+xyzr.z*xyzr.z);
		
		return xyzr;
	}
}
Jupiter.prototype = new Planet();

Saturn = function()
{
	Saturn.prototype.name = "Saturn";
	Saturn.prototype.m_N = function(d) {return  113.6634 + 2.38980E-5 * d;}
	Saturn.prototype.m_i = function(d) {return  2.4886 - 1.081E-7 * d;}
	Saturn.prototype.m_w = function(d) {return  339.3939 + 2.97661E-5 * d;}
	Saturn.prototype.m_a = function(d) {return  9.55475;}
	Saturn.prototype.m_e = function(d) {return  0.055546 - 9.499E-9 * d;}
	Saturn.prototype.m_M = function(d) {return  316.9670 + 0.0334442282 * d;}

	this.GetRectangularCoordinates = function(d)
	{
		var dMs = this.GetMeanAnomaly(d);
		var dMj = 19.8950 + 0.0830853001*d; //Jupiter mean anomaly

		var xyzr = Saturn.prototype.GetRectangularCoordinates(d);

		var dlonecl = this.astro.atan2d(xyzr.y,xyzr.x);
		var dlatecl = this.astro.atan2d(xyzr.z,Math.sqrt(xyzr.x*xyzr.x+xyzr.y*xyzr.y));

		dlonecl += 0.812 * this.astro.sind(2*dMj - 5*dMs - 67.6);
		dlonecl -= 0.229 * this.astro.cosd(2*dMj - 4*dMs - 2);
		dlonecl += 0.119 * this.astro.sind(dMj - 2*dMs - 3);
		dlonecl += 0.046 * this.astro.sind(2*dMj - 6*dMs - 69);
		dlonecl += 0.014 * this.astro.sind(dMj - 3*dMs + 32);

		dlatecl -= 0.020 * this.astro.cosd(2*dMj - 4*dMs - 2);
		dlatecl += 0.018 * this.astro.sind(2*dMj - 6*dMs - 49);
	
		xyzr.x  = xyzr.r * this.astro.cosd(dlonecl) * this.astro.cosd(dlatecl);
		xyzr.y  = xyzr.r * this.astro.sind(dlonecl) * this.astro.cosd(dlatecl);
		xyzr.z  = xyzr.r * this.astro.sind(dlatecl);
		xyzr.r = Math.sqrt(xyzr.x*xyzr.x + xyzr.y*xyzr.y + xyzr.z*xyzr.z);
		
		return xyzr;
	}
}
Saturn.prototype = new Planet();

Uranus = function()
{
	Uranus.prototype.name = "Uranus";
	this.m_N = function(d) {return  74.0005 + 1.3978E-5 * d;}
	this.m_i = function(d) {return  0.7733 + 1.9E-8 * d;}
	this.m_w = function(d) {return  96.6612 + 3.0565E-5 * d;}
	this.m_a = function(d) {return  19.18171 - 1.55E-8 * d;}
	this.m_e = function(d) {return  0.047318 + 7.45E-9 * d;}
	this.m_M = function(d) {return  142.5905 + 0.011725806 * d;}
}
Uranus.prototype = new Planet();

Neptune = function()
{
	Neptune.prototype.name = "Neptune";
	this.m_N = function(d) {return  131.7806 + 3.0173E-5 * d;}
	this.m_i = function(d) {return  1.7700 - 2.55E-7 * d;}
	this.m_w = function(d) {return  272.8461 - 6.027E-6 * d;}
	this.m_a = function(d) {return  30.05826 + 3.313E-8 * d;}
	this.m_e = function(d) {return  0.008606 + 2.15E-9 * d;}
	this.m_M = function(d) {return  260.2471 + 0.005995147 * d;}
}
Neptune.prototype = new Planet();

Pluto = function()
{
	Pluto.prototype.name = "Pluto";
	this.m_a = function(d) {return  39.48168677;}

	this.GetRectangularCoordinates = function(d)
	{
		var S  =   50.03  +  0.033459652 * d;
		var P  =  238.95  +  0.003968789 * d;

		var lonecl = 238.9508  +  0.00400703 * d
            - 19.799 * this.astro.sind(P)     + 19.848 * this.astro.cosd(P)
             + 0.897 * this.astro.sind(2*P)    - 4.956 * this.astro.cosd(2*P)
             + 0.610 * this.astro.sind(3*P)    + 1.211 * this.astro.cosd(3*P)
             - 0.341 * this.astro.sind(4*P)    - 0.190 * this.astro.cosd(4*P)
             + 0.128 * this.astro.sind(5*P)    - 0.034 * this.astro.cosd(5*P)
             - 0.038 * this.astro.sind(6*P)    + 0.031 * this.astro.cosd(6*P)
             + 0.020 * this.astro.sind(S-P)    - 0.010 * this.astro.cosd(S-P);

		var latecl =  -3.9082
             - 5.453 * this.astro.sind(P)     - 14.975 * this.astro.cosd(P)
             + 3.527 * this.astro.sind(2*P)    + 1.673 * this.astro.cosd(2*P)
             - 1.051 * this.astro.sind(3*P)    + 0.328 * this.astro.cosd(3*P)
             + 0.179 * this.astro.sind(4*P)    - 0.292 * this.astro.cosd(4*P)
             + 0.019 * this.astro.sind(5*P)    + 0.100 * this.astro.cosd(5*P)
             - 0.031 * this.astro.sind(6*P)    - 0.026 * this.astro.cosd(6*P)
                                   + 0.011 * this.astro.cosd(S-P);

		var r     =  40.72
           + 6.68 * this.astro.sind(P)       + 6.90 * this.astro.cosd(P)
           - 1.18 * this.astro.sind(2*P)     - 0.03 * this.astro.cosd(2*P)
           + 0.15 * this.astro.sind(3*P)     - 0.14 * this.astro.cosd(3*P);

		var dx = r * this.astro.cosd(lonecl) * this.astro.cosd(latecl);
		var dy = r * this.astro.sind(lonecl) * this.astro.cosd(latecl);
		var dz = r * this.astro.sind(latecl);
		r = Math.sqrt(dx*dx+dy*dy+dz*dz);
		return {x:dx, y:dy, z:dz, r:r};
	}
}
Pluto.prototype = new Planet();



