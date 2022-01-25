<?php
//require_once 'classes/User.php';

namespace CrossRiver;

class Api {
	
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
	private $content_disposition = null;

	public function __construct($options, $resource) 
	{		
		$this->app = $options['app'];
		$this->request = $options['app']->request();
		$this->response = $options['app']->response();
		$this->connection = $options['connection'];
		$this->user = $options['user'];
		$this->content_type = "application/json";
				
		if (count($resource)>0 && $resource[count($resource)-1]=="")
			array_pop($resource);

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
		
		$this->idresource = count($resource) <=1 ? 0 : $resource[1];
		$this->method = strtolower($this->request->getMethod());
		$headers = $this->request->headers();	
		$this->resourcePath = $resource;

		$this->locationpath = "http://" . $headers["HOST"] . $options["docroot"] . "/services/" . $this->resource ."/";
	}
		
	public function process()
	{
		$headers = $this->request->headers();
		$this->response['Content-Type'] = $this->content_type;
		if ($this->content_disposition != null)
			$this->response['Content-Disposition'] = $this->content_disposition;
		
		$method = $this->method . '_' . $this->resource;
				
		if (!method_exists($this,$method))
		{
			if ($this->method=="PUT")
			{
				$this->response["Location"] = $this->locationpath . $this->idresource . "/";
				$this->response->body("");
				$this->response->status(204);
			}
			return "";
		}
		$this->response->status(200);
		try
		{
			$body = $this->request->getBody();
			$params = strlen($body)==0 ? $this->request->params() : json_decode($body,true);
			$this->response->body(call_user_func(array($this,$method),$this->connection,$params));
		}
		catch (Exception $e)
		{
			$this->app->getLog()->debug("Services Exception: " . $e->getMessage());
		}
	}

	protected function get_sightings($conn,$params)
	{
		$filter = '1';
		if (isset($params['species']))
			$filter .= " AND idspecies IN ($params[species])";
	
		$result = $conn->query("SELECT * FROM view_sightings_public WHERE $filter");
		return $this->fetch_rows($result,TRUE);	
	}

	protected function get_windfarms($conn,$params)
	{
		$filter = $this->idresource == 0 ? "1" : "id=".$this->idresource;
		if (isset($params['term']) && strlen($params['term'])>=3)
			$filter = "name LIKE '%$params[term]%'";
	
		if (isset($params['namesonly']))
			$result = $conn->query("SELECT id, name FROM wind_farms WHERE $filter");
		else
			$result = $conn->query("SELECT id, idsource, name, type, owner, developer, energy_purchaser, capacity, units, online_date, manufacturer, status, latitude, longitude, comments FROM wind_farms WHERE $filter");
		return $this->fetch_rows($result,TRUE);	
	}
	
	protected function put_windfarms($conn,$params)
	{
		$id = $this->idresource;
		$year = $params['online_date'] ? $params['online_date'] : 'null';
		$capacity = $params['capacity'] ? $params['capacity'] : 'null';
		$units = $params['units'] ? $params['units'] : 'null';
		
		$conn->query("UPDATE wind_farms SET name='$params[name]', owner='$params[owner]', type=$params[type], status=$params[status], developer='$params[developer]', energy_purchaser='$params[energy_purchaser]', manufacturer='$params[manufacturer]', latitude=$params[latitude], longitude=$params[longitude], online_date=$year, capacity=$capacity, units=$units, comments='$params[comments]' WHERE id=$id");
		return "";
	}

	protected function post_windfarms($conn,$params)
	{
		$year = $params['online_date'] ? $params['online_date'] : 'null';
		$capacity = $params['capacity'] ? $params['capacity'] : 'null';
		$units = $params['units'] ? $params['units'] : 'null';
		
		$conn->query("INSERT INTO wind_farms (name, owner, type, status, developer, energy_purchaser, manufacturer, latitude, longitude, online_date, capacity, units, comments, added_at) VALUES ('$params[name]', '$params[owner]', $params[type], $params[status], '$params[developer]','$params[energy_purchaser]', '$params[manufacturer]', $params[latitude], $params[longitude], $year, $capacity, $units, '$params[comments]', CURRENT_TIMESTAMP)");
		$params['id'] =  $conn->insert_id;
		return json_encode($params);
	}

	protected function get_windcompanies($conn,$params)
	{
		$filter = '1';
		$result = $conn->query("SELECT id, name, developer, owner, manufacturer, purchaser FROM wind_companies WHERE $filter ORDER BY name ASC");
		return $this->fetch_rows($result,TRUE);	
	}

	private function fetch_rows($result,$forceArray=FALSE,$encode=TRUE)
	{
		$ret = array();
		$count = 0;

		if ($result != null)
		{
			while ($row = $result->fetch_assoc())
			{
				$ret[] = $row;
				$count++;
			}
		}
		$result->free();
		
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
}

?>