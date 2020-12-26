/****************************************************************************
 *
 * Sample Javascript code for Wily Introscope

 * This script looks up a metric value of type String, as defined in getMetricRegex()
 * and stitches it back as a numeric value.

 * Motivation: Introscope cannot alert on Strings values but only on Numerical values
 * hence this script helps us map String to Number values, so we can create alert on these metrics
 *
 * Author: Omar O.
 ****************************************************************************/

/*
 * The execute() function get called every 15 sec by the scripting engine
 * The function takes two arguments:
 * metricData - is an array of Metric Data supplied to the function when it is 
 *              called at every 15 sec
 * javascriptResultSetHelper - is an obejct that collects the new metric data
 *                             produced by the script
 */
function execute(metricData, javascriptResultSetHelper)
{
    var i=0;
    var agentNameList = {};             // list of agent names matched (see getAgentRegex())
    var metricNameList = {}             // list of metrics matched (see getMetricRegex())
    var metricTypeList = {}             // list of metric types
    var metricValueList = {}            // list of metric values

    // We receive as an argument an array with all the Agents and Metrics matched
    //Let's iterate through each match metric and process it
    //
    for(i=0; i < metricData.length; i++)
    {
        // Let's take a look at what each entry in the Metric Array looks like
        //
        log.info("metricData[i] = " + metricData[i] );

        // Let's extract the Agent name and metric name
        //
        var agentName = metricData[i].agentName.processURL;
        var metricName = metricData[i].agentMetric.attributeURL;
        log.info("agentName = " + agentName );
        log.info("metricName = " + metricName );

        // Let's extract the metric value and value type
        //
        var metricStringValue = metricData[i].timeslicedValue.getValueAsString();
        //var metricValue = metricData[i].timeslicedValue.value;
        var type = metricData[i].timeslicedValue.type;
        log.info("metricStringValue = " + metricStringValue);
        log.info("metricValue Type = " + type);

        // Let's store the AgentName, MetricNames, MetricValue and MetricType  
        //
        // if we haven't seen this agent name yet add it to the list of agents
        if (agentNameList[agentName] == null)
        {
            agentNameList[agentName] = agentName;
        }

        // if we haven't seen this metric name, add it and add its value and type
        if (metricNameList[metricName] == null)
		{
			metricNameList[metricName] = metricName;
			metricValueList[metricName] = metricStringValue;
			metricTypeList[metricName] = type;
        }

    }

    // now iterate through found agents & metrics, and stitch new metric under the found Agent name
    for (var agentName in agentNameList)
    {
		for (var metricName in metricNameList)
    	{
            // Let's stitch the numerical value under a new metric name. 
            // Let's add the suffix "_Int" to the existing metric name 
            var metricArray = metricName.split(":");
            var metric_path = metricArray[0];
            var metric_name = metricArray[1];
            log.info("metric_path = " + metric_path );
            log.info("metric_name = " + metric_name );

            var metric_name_suffix = metric_name + "_Int";
            log.info("metric_name_suffix = " + metric_name_suffix);

			var newMetricName = metric_path + ":" + metric_name_suffix;
			log.info("newMetricName = " + newMetricName);

            // Let's now build the full metric name, which includes AgentName + new MetricName
            var agent_metric_name = agentName + "|" + newMetricName;

            // Let's now map the metric string value to a numerical value
            stringValue = metricValueList[metricName];

            numericValue = 0;
            if (stringValue.indexOf("true") >= 0 )
                numericValue = 1;
            else if (stringValue.indexOf("false") >= 0 )
                numericValue = 0;
            else
                numericValue = 0;

            log.info("numericValue = " + numericValue);

			javascriptResultSetHelper.addMetric(
                agent_metric_name, 
                new java.lang.Integer(numericValue), 
                Packages.com.wily.introscope.spec.metric.MetricTypes.kIntegerFluctuatingCounter, 
                javascriptResultSetHelper.kDefaultFrequency);
		}
    }

    // return the result set
    return javascriptResultSetHelper;
}

// Tell the EM what Agents we should match against
function getAgentRegex()
{
    //SuperDomain|C02XF2KLJGH6|TomcatProcess|TixChangeWebPortalAgent|
    return "(.*)\|C02XF2KLJGH6\|TomcatProcess\|TixChangeWebPortalAgent";
}

// The the EM what metrics we should match against
function getMetricRegex()
{
    // JMX|tomcat.jdbc|class=org.apache.tomcat.jdbc.pool.DataSource|context=/jtixchange_web|engine=Catalina|host=localhost|name=jdbc/tixchangeDB|type=ConnectionPool:Url
    // JMX|tomcat.jdbc|class=org.apache.tomcat.jdbc.pool.DataSource|context=/jtixchange_web|engine=Catalina|host=localhost|name=jdbc/tixchangeDB|type=ConnectionPool:FairQueue
    return "JMX\|tomcat.jdbc\|class=org.apache.tomcat.jdbc.pool.DataSource\|(.*):(Url|FairQueue)";
}

// must return a multiple of default system frequency (currently 15 seconds)
function getFrequency()
{
        return 15;
}

// Return false if the script should not run on the MOM.
// Scripts that create metrics on agents other than the Custom Metric Agent
// should not run on the MOM because the agents exist only in the Collectors.
// Default is true.
function runOnMOM()
{
        return false;
}

