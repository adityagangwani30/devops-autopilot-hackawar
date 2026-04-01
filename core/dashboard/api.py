"""
Dashboard API for serving metrics and visualization data
"""
from typing import Dict, List, Any, Optional, Callable
from datetime import datetime, timedelta
import logging

# Initialize logger
logger = logging.getLogger(__name__)
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)

class DashboardAPI:
    """API for dashboard data retrieval and visualization"""
    
    def __init__(self):
        self.data_sources = {}
        self.cached_data = {}
        self.cache_ttl = 300  # 5 minutes default TTL
    
    def register_data_source(self, name: str, data_func: Callable[[], Any], ttl: Optional[int] = None):
        """
        Register a data source for the dashboard
        
        Args:
            name: Name of the data source
            data_func: Function that returns data for this source
            ttl: Time to live in seconds (uses default if None)
        """
        self.data_sources[name] = {
            'func': data_func,
            'ttl': ttl or self.cache_ttl,
            'last_updated': None
        }
        logger.info(f"Registered data source: {name}")
    
    def get_data(self, source_name: str, force_refresh: bool = False) -> Any:
        """
        Get data from a registered source
        
        Args:
            source_name: Name of the data source
            force_refresh: Whether to force refresh cached data
            
        Returns:
            Data from the source or None if not found
        """
        if source_name not in self.data_sources:
            logger.warning(f"Data source '{source_name}' not found")
            return None
        
        source = self.data_sources[source_name]
        
        # Check if we need to refresh cache
        now = datetime.utcnow()
        if (force_refresh or 
            source['last_updated'] is None or 
            (now - source['last_updated']).total_seconds() > source['ttl']):
            
            try:
                data = source['func']()
                source['cached_data'] = data
                source['last_updated'] = now
                logger.debug(f"Refreshed data for source: {source_name}")
            except Exception as e:
                logger.error(f"Error refreshing data for {source_name}: {str(e)}")
                # Return cached data if available, even if stale
                if 'cached_data' in source:
                    return source['cached_data']
                return None
        
        return source.get('cached_data')
    
    def get_multiple_data(self, source_names: List[str]) -> Dict[str, Any]:
        """
        Get data from multiple sources
        
        Args:
            source_names: List of source names
            
        Returns:
            Dictionary mapping source names to their data
        """
        result = {}
        for name in source_names:
            result[name] = self.get_data(name)
        return result
    
    def format_cost_data(self, raw_cost_data: List[Any]) -> Dict[str, Any]:
        """
        Format raw cost data for dashboard consumption
        
        Args:
            raw_cost_data: Raw cost data from AWS or other sources
            
        Returns:
            Formatted data suitable for charts and tables
        """
        if not raw_cost_data:
            return {
                'services': [],
                'costs': [],
                'timeline': [],
                'total_cost': 0
            }
        
        # Aggregate by service
        service_costs = {}
        timeline_data = {}
        total_cost = 0
        
        for item in raw_cost_data:
            if hasattr(item, 'service'):
                service = item.service
                amount = getattr(item, 'amount', 0)
                time_period = getattr(item, 'time_period', 'unknown')
            elif isinstance(item, dict):
                service = item.get('service', 'unknown')
                amount = item.get('amount', 0)
                time_period = item.get('time_period', 'unknown')
            else:
                continue
            
            # Sum costs by service
            service_costs[service] = service_costs.get(service, 0) + amount
            total_cost += amount
            
            # Build timeline data
            if time_period not in timeline_data:
                timeline_data[time_period] = {}
            timeline_data[time_period][service] = timeline_data[time_period].get(service, 0) + amount
        
        # Convert to lists for charting
        services = list(service_costs.keys())
        costs = [service_costs[s] for s in services]
        
        # Format timeline for time series charts
        timeline = []
        for period in sorted(timeline_data.keys()):
            period_data = {
                'period': period,
                'services': list(timeline_data[period].keys()),
                'costs': [timeline_data[period][s] for s in timeline_data[period].keys()]
            }
            timeline.append(period_data)
        
        return {
            'services': services,
            'costs': costs,
            'timeline': timeline,
            'total_cost': total_cost
        }
    
    def format_utilization_data(self, raw_utilization_data: List[Any]) -> Dict[str, Any]:
        """
        Format raw utilization data for dashboard consumption
        
        Args:
            raw_utilization_data: Raw utilization data
            
        Returns:
            Formatted data suitable for charts and tables
        """
        if not raw_utilization_data:
            return {
                'instances': [],
                'utilization': [],
                'average_utilization': 0,
                'underutilized_count': 0
            }
        
        instances = []
        utilization_values = []
        underutilized_count = 0
        
        for item in raw_utilization_data:
            if hasattr(item, 'InstanceId'):
                instance_id = item.InstanceId
                cpu_util = getattr(item, 'AvgCPUUtilization', 0) or 0
            elif isinstance(item, dict):
                instance_id = item.get('InstanceId', 'unknown')
                cpu_util = item.get('AvgCPUUtilization', 0) or 0
            else:
                continue
            
            instances.append(instance_id)
            utilization_values.append(cpu_util)
            
            if cpu_util < 20:  # Consider underutilized if < 20% CPU
                underutilized_count += 1
        
        avg_utilization = sum(utilization_values) / len(utilization_values) if utilization_values else 0
        
        return {
            'instances': instances,
            'utilization': utilization_values,
            'average_utilization': avg_utilization,
            'underutilized_count': underutilized_count
        }
    
    def format_alerts_data(self, raw_alerts: List[Any]) -> Dict[str, Any]:
        """
        Format raw alerts data for dashboard consumption
        
        Args:
            raw_alerts: Raw alerts data
            
        Returns:
            Formatted data suitable for alerts panel
        """
        if not raw_alerts:
            return {
                'alerts': [],
                'count_by_severity': {},
                'recent_alerts': [],
                'total_count': 0
            }
        
        alerts = []
        severity_counts = {}
        
        for item in raw_alerts:
            if hasattr(item, 'id'):
                alert_dict = {
                    'id': item.id,
                    'timestamp': getattr(item, 'timestamp', datetime.utcnow()).isoformat() if hasattr(item, 'timestamp') else datetime.utcnow().isoformat(),
                    'severity': getattr(item, 'severity', 'info'),
                    'title': getattr(item, 'title', 'Unknown Alert'),
                    'description': getattr(item, 'description', ''),
                    'service': getattr(item, 'service', 'unknown')
                }
            elif isinstance(item, dict):
                alert_dict = {
                    'id': item.get('id', 'unknown'),
                    'timestamp': item.get('timestamp', datetime.utcnow().isoformat()),
                    'severity': item.get('severity', 'info'),
                    'title': item.get('title', 'Unknown Alert'),
                    'description': item.get('description', ''),
                    'service': item.get('service', 'unknown')
                }
            else:
                continue
            
            alerts.append(alert_dict)
            severity = alert_dict['severity']
            # Handle both string and enum severity values
            if hasattr(severity, 'value'):
                severity_str = severity.value
            else:
                severity_str = str(severity)
            severity_counts[severity_str] = severity_counts.get(severity_str, 0) + 1
        
        # Sort by timestamp descending (most recent first)
        alerts.sort(key=lambda x: x['timestamp'], reverse=True)
        recent_alerts = alerts[:10]  # Last 10 alerts
        
        return {
            'alerts': alerts,
            'count_by_severity': severity_counts,
            'recent_alerts': recent_alerts,
            'total_count': len(alerts)
        }