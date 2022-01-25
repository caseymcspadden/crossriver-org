<?php
//require_once 'classes/User.php';

namespace CrossRiver;

class Astronomy {
	private $idresource;
	private $app;
	private $connection;
	private $user;
	private $request;
	private $response;
	private $resource;
	private $method;
	private $resourcePath;
	private $locationpath;
	private $content_type = "application/json";
	private $content_disposition=null;

	public function __construct($options, $resource) {		
	
		$this->app = $options['app'];
		$this->request = $options['app']->request();
		$this->response = $options['app']->response();
		$this->connection = $options['connection'];
		$this->user = $options['user'];
		$this->content_type = "application/json";
				
		$lastresource = $resource[count($resource)-1];
		$pos = strpos($lastresource,'.');
		if ($pos!==FALSE)
		{
			$resource[count($resource)-1] = substr($lastresource,0,$pos);
			$extension = substr($lastresource,$pos+1); 
			switch ($extension)
			{
				case 'csv':
					$this->content_type="application/csv";
					$this->content_disposition = "attachment;filename=\"$lastresource\"";
					break;
				default:
					break;	
			}
		}		
		
		$this->resource = $resource[0];
		if (count($resource)>0 && $resource[count($resource)-1]=="")
			array_pop($resource);
		
		$this->idresource = count($resource) <=1 ? 0 : $resource[1];
		$this->method = strtolower($this->request->getMethod());
		$headers = $this->request->headers();	
		$this->resourcePath = $resource;

		$this->locationpath = "http://" . $headers["HOST"] . $options["docroot"] . "/astronomy/" . $this->resource ."/";
	}
		
	public function process()
	{
		$args = array();
		$headers = $this->request->headers();
		if ($this->idresource != 0)
			$args["id"] = $this->idresource;
		if (array_key_exists("RANGE",$headers))
		{
			$range = $headers["RANGE"];
			$i = strpos($range,'-');
			$args["first"] = substr($range,6,$i-6);
			$args["last"]  = substr($range,$i+1);
			if ($args["last"]<$args["first"]) $args["last"]=1000000000;
		}
		$this->response['Content-Type'] = $this->content_type;
		if ($this->content_disposition != null)
			$this->response['Content-Disposition'] = $this->content_disposition;
		
		$method = $this->method . '_' . $this->resource;
				
		if (!method_exists($this,$method))
		{
			if ($this->method=="PUT")
			{
				$this->response["Location"] = $this->locationpath . $this->idresource . "/";
				$this->app->getLog()->debug("Location is " . $this->response["Location"]);
				$this->response->body("");
				$this->response->status(204);
			}
			return "";
		}
		$this->response->status(200);
		try
		{
			$this->response->body(call_user_func(array($this,$method),$this->connection,$args,$this->request->params()));
		}
		catch (Exception $e)
		{
			$this->app->getLog()->debug("Services Exception: " . $e->getMessage());
		}
	}

	protected function get_stars($conn,$args,$params)
	{
		$mag = isset($params["mag"]) ? $params["mag"] : "5";
		if (isset($params['hr']))
			$result = $conn->query("SELECT hr, name, altname, ra, de, class, mag FROM stars WHERE hr=$params[hr]");
		else
			$result = $conn->query("SELECT hr, name, altname, ra, de, class, mag FROM stars WHERE mag<=$mag && mag<>0 ORDER BY mag");
		return $this->fetch_rows($result,$args,TRUE);
	}

	protected function get_constellationboundaries($conn,$args,$params)
	{
		$result = $conn->query("SELECT abbrev, ra, de, path FROM constellation_boundaries ORDER BY constellation_boundaries.order");
		return $this->fetch_rows($result,$args,TRUE);
	}

	protected function get_constellationlimits($conn,$args,$params)
	{
		$result = $conn->query("SELECT * FROM constellation_limits ORDER BY de_low DESC");
		return $this->fetch_rows($result,$args,TRUE);
	}
	
	protected function get_constellationfigures($conn,$args,$params)
	{
		$result = $conn->query("SELECT * FROM constellation_figures ORDER BY constellation_figures.order");
		return $this->fetch_rows($result,$args,TRUE);
	}

	protected function get_constellations($conn,$args,$params)
	{
		$result = $conn->query("SELECT * FROM constellations");
		return $this->fetch_rows($result,$args,TRUE);
	}

	protected function get_names($conn,$args,$params)
	{
		$term = $params['term'];
	
		if (isset($term) && strlen($term)>=4 && strncasecmp($term, "hr", 2)==0)
			$result = $conn->query("SELECT CONCAT('hr ',hr) AS name,  CONCAT('hr ',hr) AS abbrev, hr, ra, de, 1 AS otype FROM stars WHERE hr LIKE '" . substr($term,3) . "%'");
		else	
			$result = $conn->query("SELECT name, abbrev, hr, ra, de, otype FROM astro_names WHERE name LIKE '" . $term . "%'");
		return $this->fetch_rows($result,$args,TRUE);
	}

	private function fetch_rows($result,$args,$forceArray=FALSE,$encode=TRUE)
	{
		$ret = array();
		$count = 0;
		$first = (isset($args["first"]) ? $args["first"] : 0);
		
		if ($result != null)
		{
			while ($row = $result->fetch_assoc())
			{
				$ret[] = $row;
				$count++;
			}
		}
		$result->free();
		
		if (isset($args['first']))
			$this->response['Content-Range'] = "items ".$first."-".($first+$count-1);
		
		if ($encode)
		{
			if ($this->content_type=='application/json')
				return ((count($ret)==1&&$forceArray==FALSE) ? json_encode($ret[0]) : json_encode($ret));
			else
				return $this->array_to_csv($ret);
		}
		return $ret;
	}
	
	private function array_to_csv($arr)
	{
		$csv = "";
		for ($i=0;$i<count($arr);$i++)
		{
			if ($i==0)
				$csv .= implode(',',array_keys($arr[$i])) . "\n";
			$csv .= implode(',',array_values($arr[$i])) . "\n";
		}
		return $csv;
	}
		
	private function params_to_sql($args,$params)
	{
		$filter = (isset($args['id']) ? " AND id=" . $args['id'] : "");
		$sort = "";
		$limit = "";
				
		if ($params != null)
		{
			foreach ($params as $k=>$v)
			{
				if ($k==$this->sortParam)
				{
					$sortfields = explode(',', $v);
					foreach ($sortfields as $field)
					{
						$direction = (strpos($field, '-')===FALSE ? " ASC" : " DESC");
						$sort .= ((strlen($sort)==0 ? " ORDER BY " : ", ") . str_replace(array("-","+"), "", $field) . $direction);
					}
				}
				else
				{
					$filter .= " AND $k=\"$v\"";
				}
			}
		}
		if (isset($args["first"]))
			$limit = " LIMIT " . $args["first"] . "," . ($args["last"]-$args["first"]+1);
		
		return $filter.$sort.$limit;
	}
}

?>