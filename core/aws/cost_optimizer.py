"""
AWS Cost Optimization Module
Handles AWS Cost Explorer integration, cost analysis, and optimization recommendations
"""
import boto3
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class CostData:
    """Data class for cost information"""
    service: str
    amount: float
    unit: str
    time_period: str
    usage_quantity: Optional[float] = None

@dataclass
class OptimizationRecommendation:
    """Data class for optimization recommendations"""
    type: str  # e.g., 'reserved_instance', 'rightsizing', 'unused_resource'
    resource_id: str
    current_cost: float
    estimated_savings: float
    confidence: float  # 0.0 to 1.0
    description: str
    action_required: str

class AWSCostOptimizer:
    """Main class for AWS cost optimization operations"""
    
    def __init__(self, access_key: str = None, secret_key: str = None, region: str = 'us-east-1'):
        """
        Initialize AWS Cost Optimizer
        
        Args:
            access_key: AWS access key ID
            secret_key: AWS secret access key
            region: AWS region name
        """
        self.access_key = access_key
        self.secret_key = secret_key
        self.region = region
        
        # Initialize AWS clients
        self._init_aws_clients()
    
    def _init_aws_clients(self):
        """Initialize AWS service clients"""
        try:
            session_kwargs = {}
            if self.access_key and self.secret_key:
                session_kwargs = {
                    'aws_access_key_id': self.access_key,
                    'aws_secret_access_key': self.secret_key,
                    'region_name': self.region
                }
            
            session = boto3.Session(**session_kwargs)
            self.ce_client = session.client('ce')  # Cost Explorer
            self.ec2_client = session.client('ec2')
            self.cloudwatch_client = session.client('cloudwatch')
            self.config_client = session.client('config')
            
            logger.info("AWS clients initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize AWS clients: {str(e)}")
            raise
    
    def get_cost_and_usage(self, 
                          start_date: str = None, 
                          end_date: str = None,
                          granularity: str = 'DAILY') -> List[CostData]:
        """
        Get cost and usage data from AWS Cost Explorer
        
        Args:
            start_date: Start date in YYYY-MM-DD format (defaults to 30 days ago)
            end_date: End date in YYYY-MM-DD format (defaults to today)
            granularity: DAILY, MONTHLY, or HOURLY
            
        Returns:
            List of CostData objects
        """
        if not start_date:
            start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        if not end_date:
            end_date = datetime.now().strftime('%Y-%m-%d')
        
        try:
            response = self.ce_client.get_cost_and_usage(
                TimePeriod={
                    'Start': start_date,
                    'End': end_date
                },
                Granularity=granularity,
                Metrics=['BlendedCost', 'UsageQuantity'],
                GroupBy=[
                    {
                        'Type': 'DIMENSION',
                        'Key': 'SERVICE'
                    }
                ]
            )
            
            cost_data = []
            for result in response['ResultsByTime']:
                for group in result['Groups']:
                    service = group['Keys'][0] if group['Keys'] else 'Unknown'
                    amount = float(group['Metrics']['BlendedCost']['Amount'])
                    unit = group['Metrics']['BlendedCost']['Unit']
                    
                    usage_quantity = None
                    if 'UsageQuantity' in group['Metrics']:
                        usage_quantity = float(group['Metrics']['UsageQuantity']['Amount'])
                    
                    cost_data.append(CostData(
                        service=service,
                        amount=amount,
                        unit=unit,
                        time_period=result['TimePeriod']['Start'],
                        usage_quantity=usage_quantity
                    ))
            
            logger.info(f"Retrieved cost data for {len(cost_data)} services")
            return cost_data
            
        except Exception as e:
            logger.error(f"Error fetching cost and usage data: {str(e)}")
            return []
    
    def get_reservation_utilization(self, 
                                  start_date: str = None, 
                                  end_date: str = None) -> Dict[str, Any]:
        """
        Get Reserved Instance utilization data
        
        Args:
            start_date: Start date in YYYY-MM-DD format
            end_date: End date in YYYY-MM-DD format
            
        Returns:
            Dictionary with reservation utilization data
        """
        if not start_date:
            start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        if not end_date:
            end_date = datetime.now().strftime('%Y-%m-%d')
        
        try:
            response = self.ce_client.get_reservation_utilization(
                TimePeriod={
                    'Start': start_date,
                    'End': end_date
                },
                Granularity='DAILY'
            )
            
            logger.info("Retrieved reservation utilization data")
            return response
            
        except Exception as e:
            logger.error(f"Error fetching reservation utilization: {str(e)}")
            return {}
    
    def get_savings_plans_utilization(self, 
                                    start_date: str = None, 
                                    end_date: str = None) -> Dict[str, Any]:
        """
        Get Savings Plans utilization data
        
        Args:
            start_date: Start date in YYYY-MM-DD format
            end_date: End date in YYYY-MM-DD format
            
        Returns:
            Dictionary with Savings Plans utilization data
        """
        if not start_date:
            start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        if not end_date:
            end_date = datetime.now().strftime('%Y-%m-%d')
        
        try:
            response = self.ce_client.get_savings_plans_utilization(
                TimePeriod={
                    'Start': start_date,
                    'End': end_date
                },
                Granularity='DAILY'
            )
            
            logger.info("Retrieved savings plans utilization data")
            return response
            
        except Exception as e:
            logger.error(f"Error fetching savings plans utilization: {str(e)}")
            return {}
    
    def analyze_ec2_instances(self) -> List[Dict[str, Any]]:
        """
        Analyze EC2 instances for optimization opportunities
        
        Returns:
            List of EC2 instance analysis results
        """
        try:
            instances = []
            paginator = self.ec2_client.get_paginator('describe_instances')
            
            for page in paginator.paginate():
                for reservation in page['Reservations']:
                    for instance in reservation['Instances']:
                        instance_data = {
                            'InstanceId': instance['InstanceId'],
                            'InstanceType': instance['InstanceType'],
                            'State': instance['State']['Name'],
                            'LaunchTime': instance['LaunchTime'].isoformat() if 'LaunchTime' in instance else None,
                            'Tags': {tag['Key']: tag['Value'] for tag in instance.get('Tags', [])},
                            'VpcId': instance.get('VpcId'),
                            'SubnetId': instance.get('SubnetId')
                        }
                        
                        # Get monitoring data for CPU utilization
                        try:
                            cpu_utilization = self._get_instance_cpu_utilization(
                                instance['InstanceId']
                            )
                            instance_data['AvgCPUUtilization'] = cpu_utilization
                        except Exception as e:
                            logger.warning(f"Could not get CPU utilization for {instance['InstanceId']}: {str(e)}")
                            instance_data['AvgCPUUtilization'] = None
                        
                        instances.append(instance_data)
            
            logger.info(f"Analyzed {len(instances)} EC2 instances")
            return instances
            
        except Exception as e:
            logger.error(f"Error analyzing EC2 instances: {str(e)}")
            return []
    
    def _get_instance_cpu_utilization(self, instance_id: str, hours: int = 24) -> Optional[float]:
        """
        Get average CPU utilization for an EC2 instance
        
        Args:
            instance_id: EC2 instance ID
            hours: Number of hours to look back
            
        Returns:
            Average CPU utilization percentage or None if not available
        """
        try:
            end_time = datetime.utcnow()
            start_time = end_time - timedelta(hours=hours)
            
            response = self.cloudwatch_client.get_metric_statistics(
                Namespace='AWS/EC2',
                MetricName='CPUUtilization',
                Dimensions=[
                    {
                        'Name': 'InstanceId',
                        'Value': instance_id
                    }
                ],
                StartTime=start_time,
                EndTime=end_time,
                Period=3600,  # 1 hour periods
                Statistics=['Average']
            )
            
            if response['Datapoints']:
                avg_cpu = sum(dp['Average'] for dp in response['Datapoints']) / len(response['Datapoints'])
                return round(avg_cpu, 2)
            
            return None
            
        except Exception as e:
            logger.warning(f"Error getting CPU utilization for {instance_id}: {str(e)}")
            return None
    
    def generate_optimization_recommendations(self) -> List[OptimizationRecommendation]:
        """
        Generate cost optimization recommendations based on AWS data
        
        Returns:
            List of OptimizationRecommendation objects
        """
        recommendations = []
        
        # Analyze EC2 instances for rightsizing opportunities
        ec2_instances = self.analyze_ec2_instances()
        for instance in ec2_instances:
            if instance['State'] == 'running' and instance.get('AvgCPUUtilization') is not None:
                cpu_util = instance['AvgCPUUtilization']
                
                # Recommend downsizing if CPU utilization is consistently low
                if cpu_util < 20:  # Less than 20% average CPU utilization
                    # This is a simplified example - in reality, you'd need to
                    # map instance types to find appropriate smaller alternatives
                    recommendation = OptimizationRecommendation(
                        type='rightsizing',
                        resource_id=instance['InstanceId'],
                        current_cost=0.0,  # Would need to calculate actual cost
                        estimated_savings=0.0,  # Would need to calculate savings
                        confidence=0.8,
                        description=f"EC2 instance {instance['InstanceId']} has low average CPU utilization ({cpu_util}%)",
                        action_required="Consider downsizing to a smaller instance type"
                    )
                    recommendations.append(recommendation)
        
        # Get reservation utilization and recommend purchases
        try:
            reservation_util = self.get_reservation_utilization()
            # Process reservation utilization data to recommend purchases
            # This would involve analyzing the utilization percentages
            # and recommending RI purchases for consistently used resources
        except Exception as e:
            logger.warning(f"Could not process reservation utilization: {str(e)}")
        
        # Get savings plans utilization
        try:
            sp_util = self.get_savings_plans_utilization()
            # Process savings plans utilization data
        except Exception as e:
            logger.warning(f"Could not process savings plans utilization: {str(e)}")
        
        logger.info(f"Generated {len(recommendations)} optimization recommendations")
        return recommendations

# Example usage function
def example_usage():
    """Example of how to use the AWSCostOptimizer"""
    # Note: In production, you would get credentials from secure storage
    # or use IAM roles when running on AWS
    
    optimizer = AWSCostOptimizer()  # Uses default credential provider chain
    
    # Get cost data
    cost_data = optimizer.get_cost_and_usage()
    print(f"Retrieved cost data for {len(cost_data)} services")
    
    # Get optimization recommendations
    recommendations = optimizer.generate_optimization_recommendations()
    print(f"Generated {len(recommendations)} optimization recommendations")
    
    for rec in recommendations[:5]:  # Show first 5 recommendations
        print(f"- {rec.type}: {rec.description}")
        print(f"  Action: {rec.action_required}")

if __name__ == "__main__":
    example_usage()