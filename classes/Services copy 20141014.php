<?php
//require_once 'classes/User.php';

namespace CrossRiver;

class Services {
	
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
	private $paypal_live = true;
	private $endpoint_sandbox = "https://api.sandbox.paypal.com/";
	private $endpoint_live = "https://api.paypal.com/";
	
	private	$clientId_sandbox = "AevgFhBUSGH-FibLMrG-XKDxTHZhLyy4Rx7IvTrN7U10KMvKkJHW4Tx6x-Z2";
	private $secret_sandbox = "ENADIxBFbXcFe2LH0NJNW5_peq16kjrvkEeYud6nTX0aBNbs6XZC50HKkity";
	private $clientId_live = "AXqyexBtlWDla6vDbmRgl2IQZ67tCoDx7WEOglfUGuXw6vCw8sOSKQblGsRq";
	private $secret_live = "EJ7ZPhB-7BdlBJAX8HyybuA7dbA8acMek1xKaU6Nw3uhZkZcBywuQxPVMxki";

	public function __construct($options, $resource) 
	{		
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

		$this->locationpath = "http://" . $headers["HOST"] . $options["docroot"] . "/services/" . $this->resource ."/";
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

	protected function get_images($conn,$args,$params)
	{
		$ret = array();
		$arr = scandir(__DIR__.'/../assets/images');
		
		foreach($arr as $name)
		{
			if ($name[0] != '.')
				$ret[] = array("image" => "/assets/images/$name");
		}
			
		return json_encode($ret);
	}
	
	protected function post_images($conn,$args,$params)
	{
		$uploaddir = __DIR__.'/../assets/images/';
		$uploadfile = $uploaddir . basename($_FILES['upload']['name']);

		move_uploaded_file($_FILES['upload']['tmp_name'], $uploadfile);
	}
	
	protected function get_credentials($conn,$args,$params)
	{
		$salt = hash('sha256',$params['password'].uniqid(rand(), true));
		$encrypt = hash('sha256',$salt.$params['password']);
		return "$salt $encrypt";
	}
	
	protected function get_citynames($conn,$args,$params)
	{
		$term = $params['term'];
	
		$result = $conn->query("SELECT name, fullname, geonameid FROM city_names WHERE name LIKE '" . $term . "%'");
		return $this->fetch_rows($result,$args,TRUE);
	}
	
	protected function get_cities($conn,$args,$params)
	{
		$r = $this->resourcePath;
		$forceArray = TRUE;
	
		if (isset($params['id']))
			$result = $conn->query("SELECT * FROM cities WHERE geonameid IN ($params[id])");
		else if (count($r)==1)
			$result = $conn->query("SELECT * FROM cities");
		else {
			$result = $conn->query("SELECT * FROM cities WHERE geonameid=$r[1]");
			$forceArray = FALSE;
		}
		return $this->fetch_rows($result,$args,$forceArray);
	}

	protected function get_users($conn,$args,$params)
	{
		$r = $this->resourcePath;
		$filter = (count($r)>1 ? "u.id=$r[1]" : "1");
	
		$result = $conn->query("SELECT u.id, u.idclient, c.name AS clientname, u.username, u.name, u.email, u.created_at, u.updated_at, u.admin FROM users u INNER JOIN clients c ON c.id=u.idclient WHERE $filter");
		return $this->fetch_rows($result,$args,TRUE);
	}

	protected function post_users($conn,$args,$params)
	{
		$id = \CrossRiver\User::CreateUser($conn,$params);
		$this->response["Location"] = $this->locationpath . $id . "/";
		$this->response->status(201);
		return $this->get_users($conn,array('id'=>$id),null);
	}

	protected function put_users($conn,$args,$params)
	{
		foreach($params as $k=>$v)
			$this->app->getLog()->debug("$k = $v");		
		
		if (!isset($params['id'])) $params['id'] = $this->idresource;
		
		$this->app->getLog()->debug("id = $params[id]");
		\CrossRiver\User::UpdateUser($conn,$params);
		$this->response["Location"] = $this->locationpath . $this->idresource . "/";
		$this->response->status(204);
		return "";
	}

	protected function post_contact($conn,$args,$params)
	{
		$name = str_replace("'", "", $params['name']);
		$comments = str_replace("'", "", $params['comments']);
		
		$to = "casey@crossriver.com";
		$message = "Message from $params[name] ($params[email]):\n\n$comments";
		$headers = "From: $params[email]";
	
		$conn->query("INSERT INTO sitecontacts (name, email, comments) VALUES ('$name', '$params[email]', '$comments')");

		mail($to, "Cross River Software Website Contact", $message, $headers);

		return "";
	}

	protected function get_postal($conn,$args,$params)
	{
		$r = $this->resourcePath;
		$query = "";
		
		if (count($r)==2 && $r[1]=='states') {$query = "SELECT * FROM state_codes ORDER BY name";}
						
		$result = $conn->query($query);
		return $this->fetch_rows($result,$args,TRUE);
	}

	protected function get_clients($conn,$args,$params)
	{
		$r = $this->resourcePath;
		$query = "";
		
		$filter = (isset($params['filter']) ? $params['filter'] : '1');
		$order = (isset($params['order']) ? "ORDER BY $params[order]" : '');
		
		if (count($r)==1) {$query = "SELECT * FROM clients WHERE $filter $order" ;}
		else if (count($r)==2) {$query = "SELECT * FROM clients WHERE id=$r[1] AND $filter $order";}
		else if (count($r)>2)
		{
			if ($r[2]=="users") $table = "client_users";
			if ($r[2]=="payments") $table = "client_payments";
			else $table = $r[2]; 
			if (count($r)==3) {$query = "SELECT * FROM $table WHERE idclient=$r[1] AND $filter $order";}
			else if (count($r)==4) {$query = "SELECT * FROM $table WHERE idclient=$r[1] AND id=$r[3] AND $filter $order";}
		}
						
		$result = $conn->query($query);
		return $this->fetch_rows($result,$args,TRUE);
	}
	
	private function get_paypal($conn,$args,$params)
	{
		$r = $this->resourcePath;
		//if (!$this->user->isAdmin())
		//	return "";
		
		$endpoint = ($this->paypal_live ? $this->endpoint_live : $this->endpoint_sandbox);
		
		$access_token = $this->get_access_token();
		
		$this->app->getLog()->debug($access_token);

		$ch = curl_init(); 
		curl_setopt($ch, CURLOPT_URL, $endpoint ."v1/payments/payment" . (count($r)>1 ? "/$r[1]" : "")); 
		curl_setopt($ch, CURLOPT_HTTPHEADER, array("Content-Type: application/json", "Authorization:Bearer $access_token"));
		$results = curl_exec($ch);
		curl_close($ch);
	 	return $results;			
	}
	
	protected function put_clients($conn,$args,$params)
	{
		if (!isset($params['id'])) $params['id'] = $this->idresource;
		$this->response["Location"] = $this->locationpath . $this->idresource . "/";
		$this->response->status(204);
		return "";
	}
	
	protected function post_clients($conn,$args,$params)
	{
		$r = $this->resourcePath;
		$id=0;
		$idclient = 0;
		
		$results = "{}";

		if ($r[2]=='payments')
		{
			$endpoint = ($this->paypal_live ? $this->endpoint_live : $this->endpoint_sandbox);

			$access_token = $this->get_access_token();
			$payloadinvoices = $this->create_paypal_payload($params);
			$payload = $payloadinvoices['payload'];
					
			$ch = curl_init(); 
			curl_setopt($ch, CURLOPT_URL, $endpoint . "v1/payments/payment"); 
			curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
			curl_setopt($ch, CURLOPT_HEADER, false);
			curl_setopt($ch, CURLOPT_POST, true);
			curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);       
			curl_setopt($ch, CURLOPT_HTTPHEADER, array("Content-Type: application/json", "Authorization:Bearer $access_token"));
			curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
			
			$results = curl_exec($ch);
			curl_close($ch);   
  
			$arr = json_decode($results,TRUE);
			if (isset($arr['state']) && $arr['state']=='approved')
			{
				$invoices = $payloadinvoices['invoices'];
				foreach($invoices as $invoice)
				{
					$query = "INSERT INTO payments (idinvoice, idpayer, amount, method, payment_code) values (".
						$invoice['id']. ',' .
						$this->user->getId(). ',' .
						"\"$invoice[amount]\",".
						"\"$params[card_type]\",".
						"\"$arr[id]\")";
					$conn->query($query);
					$conn->query("UPDATE invoices SET balance=GREATEST(0,balance-$invoice[amount]) WHERE id=$invoice[id]");
				}
				
				// email a receipt if an email is given
				if (isset($params['email']) && strlen($params['email'])>0)
				{
						$message = 'Thank you for your online payment of $'. $arr['transactions'][0]['amount']['total'] . " to Cross River Software.\r\n" .
									     'Your payment id is ' . $arr['id'] . ".\r\n\r\n" .
									     'You may visit www.crossriver.com at any time to view your invoice balances and payment history.';
						$headers = 'From: sales@crossriver.com' . "\r\n" .
											 'Reply-To: sales@crossriver.com';
											 
						mail($params['email'], 'Online payment received', $message, $headers, null);
				}
			}
			else
			{
				$this->app->getLog()->debug("PAYMENT DENIED");	
			}

			$this->response["Location"] = $this->locationpath . $idclient ."/payments/" . $id;
			$this->response->status(201);
		}
		return $results;
	}
	
	private function get_access_token()
	{
		$clientId = ($this->paypal_live ? $this->clientId_live : $this->clientId_sandbox);
		$secret = ($this->paypal_live ? $this->secret_live : $this->secret_sandbox);
		$endpoint = ($this->paypal_live ? $this->endpoint_live : $this->endpoint_sandbox);

		$ch = curl_init(); 

		curl_setopt($ch, CURLOPT_URL, $endpoint . "v1/oauth2/token"); 
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		curl_setopt($ch, CURLOPT_HEADER, false);
		curl_setopt($ch, CURLOPT_POST, true);
		curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);       
		curl_setopt($ch, CURLOPT_HTTPHEADER, array('Accept: application/json', 'Accept-Language: en_US'));
		curl_setopt($ch, CURLOPT_USERPWD, $clientId.':'.$secret);
		curl_setopt($ch, CURLOPT_POSTFIELDS, "grant_type=client_credentials");
     
		$results = curl_exec($ch);
		curl_close($ch);   

		$arr = json_decode($results,TRUE);
		return $arr['access_token'];
	} 
	
	private function create_paypal_payload($params)
	{
		$payload = array();
		$invoices = array();
		
		$payload['intent'] = 'sale';

		$payer = array();
		$payer['payment_method'] = 'credit_card';
		$payer['funding_instruments'] = array();
		
		$transactions = array();
		$card = array();
		$address = array();
		
		$arrname = explode(' ',$params['card_name']);
		
		$card['first_name'] = $arrname[0];
		$card['last_name'] = $arrname[count($arrname)-1];
		$address['country_code'] = 'US';
		
		$description = "Payment on invoices";
		$total=0; 
		
		foreach ($params as $k=>$v)
		{
			switch ($k)
			{
				case 'card_number': $card['number'] = $v; break;
				case 'card_type': $card['type'] = $v; break;
				case 'card_month': $card['expire_month'] = $v; break;
				case 'card_year': $card['expire_year'] = $v; break;
				case 'card_code': $card['cvv2'] = $v; break;
				case 'billing_line1': $address['line1'] = $v; break;
				case 'billing_line2': if (strlen($v)>0) $address['line2'] = $v; break;
				case 'billing_state': $address['state'] = $v; break;
				case 'billing_zip': $address['postal_code'] = $v; break;
				case 'billing_city': $address['city'] = $v; break;
			}
			if (substr($k,0,7)=='amount_')
			{
				$ain = explode('_',$k);   // amount_invoiceId_invoiceName
				if ($v>0)
				{
					$invoices[] = array('id'=>$ain[1], 'amount'=>sprintf('%0.2f',$v));
					$total += $v;
				}
			}
		}
			
		$transaction = array();
		$transaction['description'] = $description;
		$transaction['amount'] = array();
		$transaction['amount']['total'] = sprintf('%0.2f',$total);
		$transaction['amount']['currency'] = 'USD';
		$transactions[] = $transaction;

		$card['billing_address'] = $address;
		$payer['funding_instruments'][] = array('credit_card'=>$card);
			
		$payload['payer'] = $payer;
		$payload['transactions'] = $transactions;

		$ret = json_encode($payload);
		$this->app->getLog()->debug("PAYLOAD = " . $ret);

		return array('payload'=>$ret,'invoices'=>$invoices);
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