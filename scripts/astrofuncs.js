<?php
require_once($_droot.'inc/matrix.inc');

define("KEPLERCONST", 9.9071e-14); // ratio of T^2/R^3 in mks units
define("EARTH_RADIUS", 6378.135);
define("DAYSINYEAR", 365.2568984);
define("SECSPERDAY", 86400);
define("OMEGA_E", 1.00273790934); // earth rotation per sideral day
define("EARTH_FLATTENING", .003352779); // Earth flattening (WGS '72) for calculating latitude (= 1.0/298.26) 
define("GREGORIAN_EPOCH",1721425.5);

$latitude = 39.0997;
$longitude = -94.5783;
$sun = null;

function getgmt() {return getdate(mktime()+4*3600);}
function day_to_julian_day($d) {return $d+2451543.5;}
function julian_day_to_day($d) {return $d-2451543.5;}
function mod360($angle) {return $angle - floor($angle/360)*360;}
function mod180($angle) {$angle = mod360($angle); return ($angle > 180) ? $angle-360 : $angle;}
function mod90($angle) {$angle = mod360($angle); return ($angle > 270) ? $angle-360 : $angle;}
function deg_to_rad($val) {return M_PI*($val/180);}
function rad_to_deg($val) {return 180*($val/M_PI);}
function earth_obliquity($d) {return 23.4393 - 3.563E-7*$d;}
function cosd($deg) {return cos(M_PI*$deg/180);}
function sind($deg) {return sin(M_PI*$deg/180);}
function tand($deg) {return tan(M_PI*$deg/180);}
function acosd($d)  {return 180*acos($d)/M_PI;}
function asind($d)  {return 180*asin($d)/M_PI;}
function atand($d)  {return 180*atan($d)/M_PI;}
function atan2d($y,$x) {return 180*atan2($y,$x)/M_PI;}

function in_constellation($ra,$de,$data,$precession_matrix=false)
{
	echo "$ra $de<br>";
	if ($precession_matrix !== false)
	{
		$vec = array();
	    $A=cosd($de) ;
		$vec[0]=$A*cosd(360*$ra/24) ;
		$vec[1]=$A*sind(360*$ra/24) ;
		$vec[2]=sind($de) ;
    
		VecMult($precession_matrix,$vec,1,$result);

		$ra=24*(mod360(atan2d($result[1],$result[0]))/360);
		$de=asind($result[2]);
	}
	echo "$ra $de<br>";
	for ($i=0; $i<count($data); $i++) 
	{
	    if (($ra >= $data[$i]['ra_low']) && ($ra < $data[$i]['ra_high']) && ($de >= $data[$i]['de_low'])) break ;
	}
	return ($i<count($data) ? $data[$i]['name'] : '');
}

function rotate2($axis,$dcosangle,$dsinangle,&$x,&$y,&$z)
{
	switch ($axis) {
		case 0: // XAXIS 
			$xret=$x;
			$yret=$y*$dcosangle - $z*$dsinangle;
			$zret=$y*$dsinangle + $z*$dcosangle;
			break;
		case 1: // YAXIS 
			$yret=$y;
			$zret=$z*$dcosangle - $x*$dsinangle;
			$xret=$z*$dsinangle + $x*$dcosangle;
			break;
		case 2: // ZAXIS
			$zret=$z; 
			$xret=$x*$dcosangle - $y*$dsinangle;
			$yret=$x*$dsinangle + $y*$dcosangle;
			break;
	}
	$x=$xret;$y=$yret;$z=$zret;
}

function rotate($axis,$angle,&$x,&$y,&$z)
{
	rotate2($axis,cosd($angle),sind($angle),$x,$y,$z);
}

function rectangular_to_spherical($dx,$dy,$dz,&$lon,&$lat)
{
	$dr = $dx*$dx+$dy*$dy;
	$lon = mod360(atan2d($dy,$dx));
	$lat = mod90(atan2d($dz,sqrt($dr)));
	return sqrt($dr+$dz*$dz);
}

function leap_gregorian($year)
{
    return (($year % 4) == 0) &&
            (!((($year % 100) == 0) && (($year % 400) != 0)));
}

function gregorian_to_jd($year,$month,$day)
{
    return (GREGORIAN_EPOCH - 1) +
           (365 * ($year - 1)) +
           floor(($year - 1) / 4) +
           (-floor(($year - 1) / 100)) +
           floor(($year - 1) / 400) +
           floor((((367 * $month) - 362) / 12) +
           (($month <= 2) ? 0 : (leap_gregorian($year) ? -1 : -2)) +
           $day);
}


function date_to_day($date)
{
	return 367*$date['year'] - floor(7*($date['year'] + floor(($date['mon']+9)/12))/4) + floor(275*$date['mon']/9) + $date['mday'] - 730530 + ($date['hours']*3600+$date['minutes']*60+$date['seconds'])/86400;
}

/*
function day_to_date($d)
{
	$jd = day_to_julian_day($d);
	$wjd = floor($jd - 0.5) + 0.5;
	$UT   = ($jd + 0.5) - floor($jd+0.5);
	$jd   -= $UT;

	$secs = 86400*$UT;
	$h = floor($secs/3600);
	$m = floor(($secs-($h*3600))/60);
	$secs -= ($h*3600 + $m*60);

	$l = (int)($jd + 68569);
	$n = (int)(( 4 * $l ) / 146097);
	$l = $l - (int)(( 146097 * $n + 3 ) / 4);
	$i = (int)(( 4000 * ( $l + 1 ) ) / 1461001);
	$l = $l - floor(( 1461 * $i ) / 4) + 31;
	$j = (int)(( 80 * $l ) / 2447);
	$day = $l - (int)(( 2447 * $j ) / 80); // day
	$l = (int)($j / 11);
	$month = $j + 2 - ( 12 * $l ); //month
	$year = 100 * ( $n - 49 ) + $i + l; //year
	return getdate(mktime($h,$m,round($secs,0),$month,$day,$year));	
}
*/

function day_to_date($d)
{
	$jd = day_to_julian_day($d);
	$UT   = ($jd + 0.5) - floor($jd+0.5);
	$jd   -= $UT;

	$secs = 86400*$UT;
	$h = floor($secs/3600);
	$m = floor(($secs-($h*3600))/60);
	$secs -= ($h*3600 + $m*60);
    
    $depoch = $jd - GREGORIAN_EPOCH;
    $quadricent = floor($depoch / 146097);
    $dqc = $depoch % 146097;
    $cent = floor($dqc / 36524);
    $dcent = $dqc % 36524;
    $quad = floor($dcent / 1461);
    $dquad = $dcent % 1461;
    $yindex = floor($dquad / 365);
    $year = ($quadricent * 400) + ($cent * 100) + ($quad * 4) + $yindex;
    if (!(($cent == 4) || ($yindex == 4)))
        $year++;
    $yearday = $jd - gregorian_to_jd($year, 1, 1);
    $leapadj = (($jd < gregorian_to_jd($year, 3, 1)) ? 0
                                                  :
                  (leap_gregorian($year) ? 1 : 2)
              );
    $month = floor(((($yearday + $leapadj) * 12) + 373) / 367);
    $day = ($jd - gregorian_to_jd($year, $month, 1)) + 1;

	return getdate(mktime($h,$m,round($secs,0),$month,$day,$year));	
}

function julian_day_to_julian_date($jd)
{
	$jd0 = floor($jd);
	$secs = 86400*($jd - $jd0);
	$h = floor($secs/3600);
	$m = floor(($secs-($h*3600))/60);
	$s = $secs - $h*3600 - $m*60;

	$j = $jd0 + 1402;
	$k = floor(($j - 1) / 1461);
	$l = $j - 1461 * $k;
	$n = floor(($l - 1) / 365) - floor($l / 1461);
	$i = $l - 365 * $n + 30;
	$j = floor((80 * i) / 2447);
	$day = floor($i - (2447 * $j) / 80);
	$i = floor($j / 11);
	$month = $j + 2 - 12 * $i;
	$year = 4 * $k + $n + $i - 4716;
	
	return getdate(mktime($h,$m,$s,$month,$day,$year));	
}


function local_sidereal_time($d,$lon)
{
	$jd = day_to_julian_day($d);
	$UT   = ($jd + 0.5) - floor($jd+0.5);
	$jd   -= $UT;
	$TU   = ($jd - 2451545.0)/36525.0;
	$GMST = 24110.54841 + $TU * (8640184.812866 + $TU * (0.093104 - $TU * 6.2E-6));
    $GMST = ($GMST + SECSPERDAY*OMEGA_E*$UT)%SECSPERDAY;
	return mod360(360.0*$GMST/SECSPERDAY + $lon);
}

function deg_to_hms($deg,&$h,&$m,&$s)
{
	$val = 24*$deg/360;
	$h = floor($val);
	$val = 60*($val-$h);
	$m = floor($val);
	$s = 60*($val-$m);
}

function deg_to_dms($deg,&$d,&$m,&$s)
{
	$isneg = ($deg<0);
	$deg = abs($deg);
	$d = floor($deg);
	$val = 60*($deg-$d);
	$m = floor($val);
	$s = 60*($val-$m);
	if ($isneg) $d=-$d;
}

function RADecToAltitudeAzimuth($dcoslat,$dsinlat,$dlst,$ra,$dec,&$alt,&$az)
{
	$lha = mod360($dlst - $ra);   // local hour angle
	$azisnegative= ($lha<=180);
	
	$dsindec = sind($dec);
	$dcosdec = cosd($dec);;

	$dsinalt = $dsindec*$dsinlat+$dcosdec*cosd($lha)*$dcoslat;
	$dcosalt = sqrt(1-$dsinalt*$dsinalt);

	$alt = asind($dsinalt);

	$cosaz  = ($dsindec - $dsinalt*$dsinlat)/($dcosalt*$dcoslat);
	if ($cosaz < -1) $cosaz=-1;
	if ($cosaz > 1)  $cosaz=1;

	$az = acosd($cosaz);
	if ($azisnegative) $az = 360 - $az;
}

function RiseSet($day,$dcoslat,$dsinlat,$dlon,$dalt,$ra,$dec,&$rise,&$set)
{
	$lst = local_sidereal_time($day,$dlon);
	$lha = mod180($lst - $ra);   // local hour angle
	
	$dcosha = (sind($dalt) - $dsinlat*sind($dec))/($dcoslat*cosd($dec));

	if (abs($dcosha) >= 1) {
		$rise=$set=0;
		return;
	}

	$ha = acosd($dcosha);
	$IsVisible = (abs($lha) < $ha);

	if ($IsVisible || ($lha<0)) {					  // rise happened earlier, set happens later
		$rise = ($day-($lha+$ha)/360.98568);
		$set  = ($day+($ha-$lha)/360.98568);
	}
	else {
		$rise = ($day+(360-$ha-$lha)/360.98568); // both rise & set happen later
		$set  = ($day+(360+$ha-$lha)/360.98568);
	}
}

function CalculatePrecessionMatrix($fromyear,$toyear)
{
	$dMatrix = array();

	$CSR = 4.8481368110953e-06;

    $T=0.001*($toyear-$fromyear);
    $ST=0.001*($fromyear-1900.0);
    $A=$CSR*$T*(23042.53+$ST*(139.75+0.06*$ST)+$T*(30.23-0.27*$ST+18.0*$T)) ;
    $B=$CSR*$T*$T*(79.27+0.66*$ST+0.32*$T)+$A ;
    $C=$CSR*$T*(20046.85-$ST*(85.33+0.37*$ST)+$T*(-42.67-0.37*$ST-41.8*$T)) ;
    $SINA=sin($A) ;
    $SINB=sin($B) ;
    $SINC=sin($C) ;
    $COSA=cos($A) ;
    $COSB=cos($B) ;
    $COSC=cos($C) ;
	$dMatrix[0]=$COSA*$COSB*$COSC-$SINA*$SINB ;
    $dMatrix[1]=-$COSA*$SINB-$SINA*$COSB*$COSC ;
    $dMatrix[2]=-$COSB*$SINC ;
    $dMatrix[3]=$SINA*$COSB+$COSA*$SINB*$COSC ;
    $dMatrix[4]=$COSA*$COSB-$SINA*$SINB*$COSC ;
    $dMatrix[5]=-$SINB*$SINC ;
    $dMatrix[6]=$COSA*$SINC ;
    $dMatrix[7]=-$SINA*$SINC ;
    $dMatrix[8]=$COSC ;
    return $dMatrix;
}

class Orbiter
{
	var $m_strName;
	var $m_N = array();
	var $m_i = array();
	var $m_w = array();
	var $m_a = array();
	var $m_e = array();
	var $m_M = array();

	var $m_nIter = 30;
	var $m_dPrecision = 1e-4;

	function Orbiter($name) {$this->m_strName=$name;}

	function get_N($d) {return mod360($this->m_N[0] + $this->m_N[1]*$d);}
	function get_i($d) {return mod360($this->m_i[0] + $this->m_i[1]*$d);}
	function get_w($d) {return mod360($this->m_w[0] + $this->m_w[1]*$d);}
	function get_a($d) {return $this->m_a[0] + $this->m_a[1]*$d;}
	function get_e($d) {return $this->m_e[0] + $this->m_e[1]*$d;}
	function get_M($d) {return mod360($this->m_M[0] + $this->m_M[1]*$d);}

	function GetMeanAnomaly($d) {return mod360($this->m_M[0] + $this->m_M[1]*$d);}
	function GetPerihelionArgument($d) {return mod360($this->m_w[0] + $this->m_w[1]*$d);}
	function GetMeanLongitude($d) {return mod360($this->GetMeanAnomaly($d) + $this->GetPerihelionArgument($d));}

	function GetRectangularCoordinates($d,&$dx,&$dy,&$dz)
	{
		$dN = $this->get_N($d);
		$dw = $this->GetPerihelionArgument($d);
		$di = $this->get_i($d);
		
		$this->GetTrueAnomalyAndDistance($d,$dv,$dr);

		$dx = $dr * ( cosd($dN)*cosd($dv+$dw) - sind($dN)*sind($dv+$dw)*cosd($di) );
		$dy = $dr * ( sind($dN)*cosd($dv+$dw) + cosd($dN)*sind($dv+$dw)*cosd($di) );
		$dz = $dr * ( sind($dv+$dw) * sind($di) );

		return $dr;
	}

	function get_eccentric_anomaly($d)
	{
		$dM = $this->GetMeanAnomaly($d);
		$de = $this->get_e($d);

		$dE = $dM + rad_to_deg($de) * sind($dM) * (1.0 + $de*cosd($dM));

		if ($de < 0.05) return $dE;
	
		for ($i=0;$i<$this->m_nIter;$i++) 
		{
			$dE0 = $dE;
			$dE = $dE0 - ($dE0 - rad_to_deg($de)*sind($dE0) - $dM) / (1.0 - $de*cosd($dE0));
			if (abs($dE-$dE0) < $this->m_dPrecision)
				break;
		}

		return $dE;
	}

	function ecliptic_to_equatorial($d,&$dx,&$dy,&$dz)
	{
		$decl = earth_obliquity($d);
		$dyret = $dy*cosd($decl) - $dz*sind($decl);
		$dzret = $dy*sind($decl) + $dz*cosd($decl);
		$dy = $dyret;
		$dz = $dzret;
	}
	
	function GetHeliocentricCoordinates($d,&$dx,&$dy)
	{
		$dE = $this->get_eccentric_anomaly($d);
		$de = $this->get_e($d);
		$da = $this->get_a($d);

		$dx = $da * (cosd($dE) - $de);
		$dy = $da * (sqrt(1.0 - $de*$de) * sind($dE));
		$dz = 0;
	}

	function GetTrueAnomalyAndDistance($d,&$dv,&$dr)
	{
		$this->GetHeliocentricCoordinates($d,&$dxv,&$dyv);
		$dv = atan2d($dyv,$dxv);
		if ($dv<0) $dv+=360;
		$dr = sqrt($dxv*$dxv + $dyv*$dyv);
	}

	function IteratedRiseSet($d,$dcoslat,$dsinlat,$dlon,$dalt,&$rise,&$set)
	{
		$MaxIter=10;
		$bComputingRise=true;

		$day=$d;
		$obl = earth_obliquity($day);
		$dcosobl = cosd($obl);	
		$dsinobl = sind($obl);	
	
		for ($i=0;$i<$MaxIter;$i++) 
		{
			$this->GetRectangularCoordinates($day,$dx,$dy,$dz);
			rotate2(0,$dcosobl,$dsinobl,$dx,$dy,$dz);
			rectangular_to_spherical($dx,$dy,$dz,$ra,$dec);
			
			RiseSet($day,$dcoslat,$dsinlat,$dlon,$dalt,$ra,$dec,$drise,$dset);
			if ($bComputingRise) 
			{
				if (abs($drise-$day)>0.00139)
					$day=$drise;
				else 
				{
					$day=$d;
					$rise=$drise;
					$bComputingRise=false;
				}
			}
			else 
			{			
				if (abs($dset-$day)>0.00139) 
					$day=$dset;
				else 
				{
					$set=$dset;
					break;
				}
			}
		}
	}			
}

class Sun extends Orbiter
{
	function Sun()
	{
		$this->m_strName = "Sun";
		$this->m_N[0] = $this->m_N[1] = 0.0;
		$this->m_i[0] = $this->m_i[1] = 0.0;
		$this->m_w[0] = 282.9404; 
		$this->m_w[1] = 4.70935E-5;
		$this->m_a[0] = 1.000000;
		$this->m_a[1] = 0;
		$this->m_e[0] = 0.016709; 
		$this->m_e[1] = -1.151E-9;
		$this->m_M[0] = 356.0470; 
		$this->m_M[1] = 0.9856002585;
	}
	
	function GetRAandDec($d,&$ra,&$dec)
	{
		$dr = $this->GetRectangularCoordinates($d,$dx,$dy,$dz);
		$this->ecliptic_to_equatorial($d,$dx,$dy,$dz);
		$ra  = mod360(atan2d($dy,$dx));
		$dec = mod90(atan2d($dz,sqrt($dx*$dx+$dy*$dy)));
		return $dr;
	}
}

class Moon extends Orbiter
{
	var $m_sun = null;

	function Moon()
	{
		$this->m_sun = new Sun();
		$this->m_strName = "Moon";
		$this->m_N[0] = 125.1228; $this->m_N[1] = -0.0529538083;
		$this->m_i[0] = 5.1454; $this->m_i[1] = 0;
		$this->m_w[0] = 318.0634; $this->m_w[1] = 0.1643573223;
		$this->m_a[0] = 60.2666; $this->m_a[1] = 0;
		$this->m_e[0] = 0.054900; $this->m_e[1] = 0;
		$this->m_M[0] = 115.3654; $this->m_M[1] = 13.0649929509;
	}

	function GetRAandDec($d,&$ra,&$dec,$topo=false,$lat=0,$lon=0)
	{
		$dMm = $this->GetMeanAnomaly($d);				// Mean anomaly of Sun
		$dMs = $this->m_sun->GetMeanAnomaly($d);		// Mean anomaly of Moon
		$dNm = $this->get_N($d);						// Longitude of moon's node
		$dwm = $this->GetPerihelionArgument($d);		 // Argument of moon's perihelion	
		$dws = $this->m_sun->GetPerihelionArgument($d); // Argument of sun's perihelion
		$dLs = $dMs + $dws;						   // Mean longitude of sun
		$dLm = $dMm + $dwm + $dNm;				   // Mean longitude of moon
		$D = $dLm - $dLs;						// Mean elongation of moon			
		$F = $dLm - $dNm;						// Argument of latitude for moon
	
		$dr = $this->GetRectangularCoordinates($d,$dx,$dy,$dz);	
		$dlonecl = atan2d($dy,$dx);
		$dlatecl = atan2d($dz,sqrt($dx*$dx+$dy*$dy));

		$dlonecl -= 1.274 * sind($dMm - 2*$D);
		$dlonecl += 0.658 * sind(2*$D);
		$dlonecl -= 0.186 * sind($dMs);
		$dlonecl -= 0.059 * sind(2*$dMm - 2*$D);
		$dlonecl -= 0.057 * sind($dMm - 2*$D + $dMs);
		$dlonecl += 0.053 * sind($dMm + 2*$D);
		$dlonecl += 0.046 * sind(2*$D - $dMs);
		$dlonecl += 0.041 * sind($dMm - $dMs);
		$dlonecl -= 0.035 * sind($D);
		$dlonecl -= 0.031 * sind($dMm + $dMs);
		$dlonecl -= 0.015 * sind(2*$F - 2*$D);
		$dlonecl += 0.011 * sind($dMm - 4*$D);
	
		$dlatecl -= 0.173 * sind($F - 2*$D);
		$dlatecl -= 0.055 * sind($dMm - $F - 2*$D);
		$dlatecl -= 0.046 * sind($dMm + $F - 2*$D);
		$dlatecl += 0.033 * sind($F + 2*$D);
		$dlatecl += 0.017 * sind(2*$dMm + $F);

		$dr -= 0.58 * cosd($dMm - 2*$D);
		$dr -= 0.46 * cosd(2*$D);

		$dx = $dr * cosd($dlonecl) * cosd($dlatecl);
		$dy = $dr * sind($dlonecl) * cosd($dlatecl);
		$dz = $dr * sind($dlatecl);

		$this->ecliptic_to_equatorial($d,$dx,$dy,$dz);

		$ra  = mod360(atan2d($dy,$dx));
		$dec = mod90(atan2d($dz,sqrt($dx*$dx+$dy*$dy)));

		// convert to topocentric
		if ($topo)
		{
			$mpar = asind(1/$dr);
			$gclat = $lat - 0.1924 * sind(2*$lat);
			$rho = 0.99883 + 0.00167 * cosd(2*$lat);
			$lha = $this->m_sun->GetMeanLongitude($d) + 180 + $d*360 + $lon - $ra;
			$g = atand(tand($gclat)/cosd($lha));
	
			$topRA = $ra - $mpar * $rho * cosd($gclat) * sind($lha) / cosd($dec);
			$topDec = $dec - $mpar * $rho * sind($gclat) * sind($g - $dec) / sind($g);

			$ra = $topRA;
			$dec = $topDec;
		}
		return $dr;
	}
}

class Planet extends Orbiter
{ 
	var $m_sun = null;
	
	function Planet()
	{
		$this->m_sun = new Sun();
	}
	
	function GetRAandDec($d,&$ra,&$dec)
	{
		$this->GetRectangularCoordinates($d,$dx,$dy,$dz);

		$this->m_sun->GetRectangularCoordinates($d,$dxsun,$dysun,$dzsun);

		$dx += $dxsun;$dy += $dysun;$dz += $dzsun;

		$this->ecliptic_to_equatorial($d,$dx,$dy,$dz);

		$ra  = mod360(atan2d($dy,$dx));
		$dec = mod90(atan2d($dz,sqrt($dx*$dx+$dy*$dy)));
		return sqrt($dx*$dx+$dy*$dy+$dz*$dz);
	}
}

class Mercury extends Planet
{
	function Mercury()
	{
		Planet::Planet();
		$this->m_strName = "Mercury";
	    $this->m_N[0] = 48.3313; $this->m_N[1] = 3.24587E-5;
		$this->m_i[0] = 7.0047; $this->m_i[1] = 5.00E-8;
		$this->m_w[0] = 29.1241; $this->m_w[1] = 1.01444E-5;
		$this->m_a[0] = 0.387098; $this->m_a[1] = 0;
		$this->m_e[0] = 0.205635; $this->m_e[1] = 5.59E-10;
		$this->m_M[0] = 168.6562; $this->m_M[1] = 4.0923344368;
	}
}

class Venus extends Planet
{
	function Venus()
	{
		Planet::Planet();
		$this->m_strName = "Venus";
	    $this->m_N[0] = 76.6799; $this->m_N[1] = 2.46590E-5;
		$this->m_i[0] = 3.3946; $this->m_i[1] = 2.75E-8;
		$this->m_w[0] = 54.8910; $this->m_w[1] = 1.38374E-5;
		$this->m_a[0] = 0.723330; $this->m_a[1] = 0;
		$this->m_e[0] = 0.006773; $this->m_e[1] = -1.302E-9;
		$this->m_M[0] = 48.0052; $this->m_M[1] = 1.6021302244;
	}
}

class Mars extends Planet
{
	function Mars()
	{
		Planet::Planet();
		$this->m_strName = "Mars";
	    $this->m_N[0] = 49.5574; $this->m_N[1] = 2.11081E-5;
		$this->m_i[0] = 1.8497; $this->m_i[1] = 1.78E-8;
		$this->m_w[0] = 286.5016; $this->m_w[1] = 2.92961E-5;
		$this->m_a[0] = 1.523688; $this->m_a[1] = 0;
		$this->m_e[0] = 0.093405; $this->m_e[1] = 2.516E-9;
	    $this->m_M[0] = 18.6021; $this->m_M[1] = 0.5240207766;
	}
}

class Jupiter extends Planet
{
	function Jupiter()
	{
		Planet::Planet();
		$this->m_strName = "Jupiter";
	    $this->m_N[0] = 100.4542; $this->m_N[1] = 2.76854E-5;
		$this->m_i[0] = 1.3030; $this->m_i[1] = -1.557E-7;
		$this->m_w[0] = 273.8777; $this->m_w[1] = 1.64505E-5;
		$this->m_a[0] = 5.20256; $this->m_a[1] = 0;
		$this->m_e[0] = 0.048498; $this->m_e[1] = 4.469E-9;
		$this->m_M[0] = 19.8950; $this->m_M[1] = 0.0830853001;
	}

	function GetRectangularCoordinates($d,&$dx,&$dy,&$dz)
	{
		$dMj = $this->GetMeanAnomaly($d);
		$dMs = 316.9670 + 0.0334442282*$d; //saturn mean anomaly

		$dr = parent::GetRectangularCoordinates($d,$dx,$dy,$dz);

		$dlonecl = atan2d($dy,$dx);
		$dlatecl = atan2d($dz,sqrt($dx*$dx+$dy*$dy));

		$dlonecl -= 0.332 * sind(2*$dMj - 5*$dMs - 67.6);
		$dlonecl -= 0.056 * sind(2*$dMj - 2*$dMs + 21);
		$dlonecl += 0.042 * sind(3*$dMj - 5*$dMs + 21);
		$dlonecl -= 0.036 * sind($dMj - 2*$dMs);
		$dlonecl += 0.022 * cosd($dMj - $dMs);
		$dlonecl += 0.023 * sind(2*$dMj - 3*$dMs + 52);
		$dlonecl -= 0.016 * sind($dMj - 5*$dMs - 69);

		$dx = $dr * cosd($dlonecl) * cosd($dlatecl);
		$dy = $dr * sind($dlonecl) * cosd($dlatecl);
	
		return sqrt($dx*$dx+$dy*$dy+$dz*$dz);
	}
}

class Saturn extends Planet
{
	function Saturn()
	{
		Planet::Planet();
		$this->m_strName = "Saturn";
	    $this->m_N[0] = 113.6634; $this->m_N[1] = 2.38980E-5;
		$this->m_i[0] = 2.4886; $this->m_i[1] = -1.081E-7;
		$this->m_w[0] = 339.3939; $this->m_w[1] = 2.97661E-5;
		$this->m_a[0] = 9.55475; $this->m_a[1] = 0;
		$this->m_e[0] = 0.055546; $this->m_e[1] = -9.499E-9;
	    $this->m_M[0] = 316.9670; $this->m_M[1] = 0.0334442282;
	}

	function GetRectangularCoordinates($d,&$dx,&$dy,&$dz)
	{
		$dMs = $this->GetMeanAnomaly($d);
		$dMj = 19.8950 + 0.0830853001*$d; //Jupiter mean anomaly

		$dr = parent::GetRectangularCoordinates($d,$dx,$dy,$dz);

		$dlonecl = atan2d($dy,$dx);
		$dlatecl = atan2d($dz,sqrt($dx*$dx+$dy*$dy));

		$dlonecl += 0.812 * sind(2*$dMj - 5*$dMs - 67.6);
		$dlonecl -= 0.229 * cosd(2*$dMj - 4*$dMs - 2);
		$dlonecl += 0.119 * sind($dMj - 2*$dMs - 3);
		$dlonecl += 0.046 * sind(2*$dMj - 6*$dMs - 69);
		$dlonecl += 0.014 * sind($dMj - 3*$dMs + 32);

		$dlatecl -= 0.020 * cosd(2*$dMj - 4*$dMs - 2);
		$dlatecl += 0.018 * sind(2*$dMj - 6*$dMs - 49);
	
		$dx = $dr * cosd($dlonecl) * cosd($dlatecl);
		$dy = $dr * sind($dlonecl) * cosd($dlatecl);
		$dz = $dr * sind($dlatecl);
		return sqrt($dx*$dx+$dy*$dy+$dz*$dz);
	}
}

class Uranus extends Planet
{
	function Uranus()
	{
		Planet::Planet();
		$this->m_strName = "Uranus";
	    $this->m_N[0] = 74.0005; $this->m_N[1] = 1.3978E-5;
		$this->m_i[0] = 0.7733; $this->m_i[1] = 1.9E-8;
	    $this->m_w[0] = 96.6612; $this->m_w[1] = 3.0565E-5;
        $this->m_a[0] = 19.18171; $this->m_a[1] = - 1.55E-8;
        $this->m_e[0] = 0.047318; $this->m_e[1] = 7.45E-9;
        $this->m_M[0] = 142.5905; $this->m_M[1] = 0.011725806;
	}
}

class Neptune extends Planet
{
	function Neptune()
	{
		Planet::Planet();
		$this->m_strName = "Neptune";
	    $this->m_N[0] = 131.7806; $this->m_N[1] = 3.0173E-5;
		$this->m_i[0] = 1.7700; $this->m_i[1] = -2.55E-7;
		$this->m_w[0] = 272.8461; $this->m_w[1] = -6.027E-6;
		$this->m_a[0] = 30.05826; $this->m_a[1] = 3.313E-8;
		$this->m_e[0] = 0.008606; $this->m_e[1] = 2.15E-9;
		$this->m_M[0] = 260.2471; $this->m_M[1] = 0.005995147;
	}
}

class Pluto extends Planet
{
	function Pluto()
	{
		Planet::Planet();
		$this->m_strName = "Pluto";
	}

	function GetRectangularCoordinates($d,&$dx,&$dy,&$dz)
	{
		$S  =   50.03  +  0.033459652 * $d;
		$P  =  238.95  +  0.003968789 * $d;

		$lonecl = 238.9508  +  0.00400703 * $d
            - 19.799 * sind($P)     + 19.848 * cosd($P)
             + 0.897 * sind(2*$P)    - 4.956 * cosd(2*$P)
             + 0.610 * sind(3*$P)    + 1.211 * cosd(3*$P)
             - 0.341 * sind(4*$P)    - 0.190 * cosd(4*$P)
             + 0.128 * sind(5*$P)    - 0.034 * cosd(5*$P)
             - 0.038 * sind(6*$P)    + 0.031 * cosd(6*$P)
             + 0.020 * sind($S-$P)    - 0.010 * cosd($S-$P);

		$latecl =  -3.9082
             - 5.453 * sind($P)     - 14.975 * cosd($P)
             + 3.527 * sind(2*$P)    + 1.673 * cosd(2*$P)
             - 1.051 * sind(3*$P)    + 0.328 * cosd(3*$P)
             + 0.179 * sind(4*$P)    - 0.292 * cosd(4*$P)
             + 0.019 * sind(5*$P)    + 0.100 * cosd(5*$P)
             - 0.031 * sind(6*$P)    - 0.026 * cosd(6*$P)
                                   + 0.011 * cosd($S-$P);

		$r     =  40.72
           + 6.68 * sind($P)       + 6.90 * cosd($P)
           - 1.18 * sind(2*$P)     - 0.03 * cosd(2*$P)
           + 0.15 * sind(3*$P)     - 0.14 * cosd(3*$P);

		$dx = $r * cosd($lonecl) * cosd($latecl);
		$dy = $r * sind($lonecl) * cosd($dlatecl);
		$dz = $r * sind($latecl);
		return sqrt($dx*$dx+$dy*$dy+$dz*$dz);
	}
}
?>