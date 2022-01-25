<?php
//require_once 'classes/User.php';

namespace CrossRiver;

class Services {

	protected $_sortParam = "sortBy";
	protected $_app;
	protected $_request;
	protected $_response;
	protected $_resource;
	protected $_id;
	protected $_method;
	protected $_locationpath;
		
	public function __construct($app, $resource) {		
		$this->_app = $app;
		$this->_request = $app->request();
		if (strlen($this->_request->getBody())>0)
			$this->_postvals = json_decode($this->_request->getBody(),TRUE);
		else
			$this->_postvals = $this->_request->params();
		$this->_response = $app->response();
		$this->_resource = $resource[0];
		if (count($resource)>0 && $resource[count($resource)-1]=="")
			array_pop($resource);
		$this->_id = count($resource) <=1 ? 0 : $resource[1];
		$this->_resourcePath = $resource;
		$this->_method = $app->request()->getMethod();
		$str = "";
		$params = $this->_request->params();
		foreach ($params as $k=>$v)
			$str .= "$k=$v, ";
		$hstr = "";
		$headers = $this->_request->headers();	
		foreach ($headers as $k=>$v)
			$hstr .= "$k=$v,";
		$this->_locationpath = "http://" . $headers["HOST"] . $app->config("docroot") . "/services/" . $this->_resource ."/";
		//$this->_locationpath = $app->config("docroot") . "/services/" . $this->_resource ."/";
		/*
		$app->getLog()->debug("!REQUEST METHOD= " . $this->_method . " ON " . $this->_resource . " id=" . $this->_id . "\n" . 
							 "PARAMETERS: "  . $str . "\n".
							 "HEADERS: "  . $hstr . "\n".
							 "LOCATION: " . "http://" . $headers["HOST"] . $app->config("docroot") . "/services/" . $this->_resource ."/\n".
							 "BODY: *** " . $this->_request->getBody() . " ***\n\n");
		*/
	}
	
	public function process()
	{
		$args = array();
		$headers = $this->_request->headers();
		if ($this->_id != 0)
			$args["id"] = $this->_id;
		if (array_key_exists("RANGE",$headers))
		{
			$range = $headers["RANGE"];
			$i = strpos($range,'-');
			$args["first"] = substr($range,6,$i-6);
			$args["last"]  = substr($range,$i+1);
			if ($args["last"]<$args["first"]) $args["last"]=1000000000;
		}
		$this->_response['Content-Type'] = "text/html; charset=utf-8";
		//$this->_response['Content-Type'] = 'application/json';
		
		$method = strtolower($this->_method) . '_' . $this->_resource;
				
		if (!method_exists($this,$method))
		{
			if ($this->_method=="PUT")
			{
				$this->_response["Location"] = $this->_locationpath . $this->_id . "/";
				$this->_app->getLog()->debug("Location is " . $this->_response["Location"]);
				$this->_response->body("");
				$this->_response->status(204);
			}
			return "";
		}
		$this->_response->status(200);
		try
		{
			$this->_response->body(call_user_func(array($this,$method),$this->_app->config('connection'),$args,$this->_request->params(),$this->_postvals));
		}
		catch (Exception $e)
		{
			$this->_app->getLog()->debug("Services Exception: " . $e->getMessage());
		}
	}
	
	protected function get_documents($conn,$args,$params,$post)
	{
		//$result = $conn->query("SELECT name,type FROM plan_documents WHERE id=$args[id]");
		//$record = $result->fetch_assoc();
					
		$query = "SELECT id, idaction, name, type, idplan, idupdater, updated_at, comments FROM view_documents WHERE " . ($this->_id>0 ? "idplan=".$this->_id : "1");
		
		$result = $conn->query($query);

		if (count($this->_resourcePath)<=2)
			return $this->fetch_rows($result,$args);
		
		$name = $this->_resourcePath[2];
		$found=null;
		
		if ($result != null)
		{
			while ($row = $result->fetch_assoc())
			{
				if ($row["name"]==$name)
				{
					$found=$row;
					break;
				} 		
			}
		}
		$result->free();
		
		if ($found==null)
			return "FILE NOT FOUND";
			
		$filename = $_SERVER['DOCUMENT_ROOT'] . $this->_app->config("docroot") . "/documents/$found[idplan]/$name";			
			
		
		if (!file_exists($filename))
			return "FILE NOT FOUND";
		
		$size = filesize($filename);
		$this->_response['Content-Type'] = $found["type"];
		$this->_response['Content-Length'] = $size;
		$this->_response['Content-Disposition'] = "attachment; filename=\"$name\"";

		$handle = fopen($filename, "rb");
		$contents = fread($handle, $size);
		fclose($handle);
					
		return $contents;
	}
	
	protected function post_documents($conn,$args,$params,$post)
	{
		$this->_response->status(201);
		return "[]";
	}
	
	protected function put_documents($conn,$args,$params,$post)
	{
		$this->_app->getLog()->debug("PUTTING DOCUMENTS");

		$this->_response["Location"] = $this->_locationpath . $this->_id . "/";
		$this->_response->status(204);
		return "";
	}

	protected function get_preferences($conn,$args,$params,$post)
	{
		$result = $conn->query("SELECT * FROM config WHERE name='default'");
		return $this->fetch_rows($result,$args);
	}

	protected function get_actions($conn,$args,$params,$post)
	{
		$result = $conn->query("SELECT id, name, selecttext FROM actions");
		return $this->fetch_rows($result,$args);
	}

	protected function get_stages($conn,$args,$params,$post)
	{
		$result = $conn->query("SELECT id, name FROM stages");
		return $this->fetch_rows($result,$args);
	}

	protected function get_plantypes($conn,$args,$params,$post)
	{
		$result = $conn->query("SELECT id, name FROM plantypes");
		return $this->fetch_rows($result,$args);
	}

	protected function get_paymenttypes($conn,$args,$params,$post)
	{
		$result = $conn->query("SELECT id, code, name FROM paymenttypes");
		return $this->fetch_rows($result,$args);
	}
	
	protected function get_parties($conn,$args,$params,$post)
	{
		$result = $conn->query("SELECT id, name FROM parties");
		return $this->fetch_rows($result,$args);
	}

	protected function get_users($conn,$args,$params,$post)
	{
		$result = $conn->query("SELECT id, username, name, email, created_at, updated_at, user_type, typename, admin  FROM view_users_version2 WHERE 1" . $this->params_to_sql($args,$params);
		return $this->fetch_rows($result,$args);
	}
	
	protected function post_users($conn,$args,$params,$post)
	{
		$id = \CrossRiver\User::CreateUser($conn,$post);
		$this->_response["Location"] = $this->_locationpath . $id . "/";
		$this->_response->status(201);
		return $this->get_users($conn,array('id'=>$id),null);
	}

	protected function put_users($conn,$args,$params,$post)
	{
		$post["id"] = $this->_id;
		\CrossRiver\User::UpdateUser($conn,$post);
		$this->_response["Location"] = $this->_locationpath . $this->_id . "/";
		$this->_response->status(204);
		return "";
	}
	
	protected function get_usertypes($conn,$args,$params.$post)
	{
		$result = $conn->query("SELECT id, name AS label FROM usertypes");
		return $this->fetch_rows($result,$args);
	}

	protected function get_feed($conn,$args,$params,$post)
	{
		$result = $conn->query("SELECT id, updated_at, plan, due_date, office_due, action, actionname, stage, idupdater, updater, comments FROM view_log WHERE DATEDIFF(NOW(),updated_at)<=21" .
				$this->params_to_sql($args,$params));	
		return $this->fetch_rows($result,$args);	
	}
	
	protected function get_plans($conn,$args,$params,$post)
	{
		$result = $conn->query("SELECT id, plan, due_date, office_due, active, type, fee, balance_due, last_touched_by, attention, idadvisor, idemployee, stage, data_request, data_received, data_sent, lastadvisorcomments, lastpreparercomments from view_plans WHERE active<>0".
				$this->params_to_sql($args,$params));	
		return $this->fetch_rows($result,$args);	
	}

	protected function post_plans($conn,$args,$params,$post)
	{
		$stmt = $conn->prepare("INSERT into plans (name, type, due, office_due, idemployee, idadvisor, stage, last_touched_by, fee, balance_due, data_request, data_received, data_sent, flagged, attention, active) VALUES (?,?,?,?,?,?,?,?,?,?,0,0,0,0,0,1)"); 

	  $stmt->bind_param("sissiiiidd", 
	  	$post["plan"],
	  	$post["type"],
	  	$post["due_date"],
	  	$post["office_due"],
	  	$post["idemployee"],
	  	$post["idadvisor"],
	  	$post["stage"],
	  	$post["last_touched_by"],
	  	$post["fee"],
	  	$post["balance_due"]
	  );
			  
	  try {
	  	$stmt->execute();
	  	$id = mysqli_insert_id($conn);
			$stmt->close();
	  	if ($id>0)
	  	{
	  		$iduser = $this->_app->config('user')->getId();
	  		$conn->query("INSERT INTO plan_actions (idplan, idupdater, action, updated_at) VALUES ($id, $iduser, 1, NOW())");
				$this->_response["Location"] = $this->_locationpath . $id . "/";
				$this->_response->status(201);
				$ret = $this->get_plans($conn,array('id'=>$id),null);
			}
	  }
	  catch (Exception $e)
	  {
			$this->_app->getLog()->debug("Services Exception: " . $e->getMessage());
			$ret="[]";
	  }
	  
	  return $ret;
	}

	protected function put_plans($conn,$args,$params,$post)
	{
		$this->_app->getLog()->debug("POST");
		foreach ($post as $k=>$v)
			$this->_app->getLog()->debug("$k = $v");
		$this->_response->status(204);
		return "";
	}

	protected function get_advisorplans($conn,$args,$params,$post)
	{
		$user = $this->_app->config('user');
	
		$result = $conn->query("SELECT id, plan, due_date, office_due, active, type, fee, balance_due, last_touched_by, attention, idadvisor, idemployee, stage, data_request, data_received, data_sent, lastadvisorcomments, lastpreparercomments from view_plans WHERE active<>0".
				" AND idadvisor=" . $user->getId() . 
				$this->params_to_sql($args,$params));	
		return $this->fetch_rows($result,$args);	
	}

	protected function put_advisorplans($conn,$args,$params,$post)
	{
		$this->_app->getLog()->debug("POST");
		foreach ($post as $k=>$v)
			$this->_app->getLog()->debug("$k = $v");

		$this->_response["Location"] = $this->_locationpath . $this->_id . "/";
		$this->_response->status(204);		
	}
	
	protected function get_preparerplans($conn,$args,$params,$post)
	{
		$user = $this->_app->config('user');

		$result = $conn->query("SELECT id, plan, due_date, office_due, active, type, fee, balance_due, last_touched_by, attention, idadvisor, idemployee, stage, data_request, data_received, data_sent, lastadvisorcomments, lastpreparercomments from view_plans WHERE active<>0".
				" AND idemployee=" . $user->getId() . 
				$this->params_to_sql($args,$params));	
		return $this->fetch_rows($result,$args);	
	}

	private function fetch_rows($result,$args,$encode=TRUE)
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
			$this->_response['Content-Range'] = "items ".$first."-".($first+$count-1);
		
		if ($encode)
			return (count($ret)==1 ? json_encode($ret[0]) : json_encode($ret));
		return $ret;
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
				if ($k==$this->_sortParam)
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
		
		//$this->_app->getLog()->debug("SQL: $filter$sort$limit");
		return $filter.$sort.$limit;		
	}
}

?>