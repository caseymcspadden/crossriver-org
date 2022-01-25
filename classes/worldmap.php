<?php
$_droot = '../';
require_once($_droot.'inc/AstroClass.inc');

$im    = imagecreatefromjpeg($_droot.'i/worldmap.jpg');
imagealphablending ($im,1);
$shadow = imagecolorallocatealpha($im,0,0,0,80);
$yellow = imagecolorallocatealpha($im,255,255,0,20);
$white = imagecolorallocatealpha($im,255,255,255,20);
$red = imagecolorallocatealpha($im,255,0,0,0);
$grid = imagecolorallocatealpha($im,0,0,0,80);

$d = date_to_day(getgmt());
//$gmt = getdate(mktime(0,0,0,3,10,2006));
//$d = date_to_day($gmt);

$moon = new Moon();
$sun = new Sun();
	
$sun->GetRAandDec($d,$ras,$decs);
$moon->GetRAandDec($d,$ram,$decm);

$lst = local_sidereal_time($d,0);
$meridian = mod180($ras-$lst);
$lmoon = mod180($ram-$lst);

$latmax = floor(90-abs($decs)); 
$latmin = ceil(-90+abs($decs)); 

if ($decs<0)
	imagefilledrectangle($im,0,0,359,90-$latmax-1,$shadow);
else
	imagefilledrectangle($im,0,90-$latmin+1,359,179,$shadow);

for ($lat=$latmax;$lat>=$latmin;$lat--)
{
	$arc = rad_to_deg(acos(tan(deg_to_rad(-$decs))*tan(deg_to_rad($lat))));
	$lonmin = round($meridian-$arc);
	$lonmax = round($meridian+$arc);
	if ($lonmin<-180)
	{
		$min=$lonmax;
		$max=360+$lonmin;
	}
	elseif ($lonmax>180)
	{
		$max=$lonmin;
		$min=$lonmax-360;
	}
	else
	{
		$min=-180;
		$max=$lonmin;
	}
	imagefilledrectangle($im,$min+180,90-$lat,$max+180,90-$lat,$shadow);
	if ($lonmin>=-180 && $lonmax<=180)
	{
		$min=$lonmax;
		$max=180;
		imagefilledrectangle($im,$min+180,90-$lat,$max+180,90-$lat,$shadow);
	}
}
imageline($im,0,90,359,90,$grid);
imageline($im,$meridian+180,90-$latmax,$meridian+180,90-$latmin,$yellow);
imagefilledellipse($im,180-122,90-48,4,4,$red);
imagefilledellipse($im,$meridian+180,90-$decs,10,10,$yellow);
imagefilledellipse($im,$lmoon+180,90-$decm,10,10,$white);
header("Content-type: image/gif");
imagegif($im);
imagedestroy($im);
?>