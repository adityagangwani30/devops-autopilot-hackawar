"""
Main FastAPI application for the core API
"""
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any, Optional
import logging
from datetime import datetime, timedelta

# Import core modules
from aws.cost_optimizer import AWSCostOptimizer, CostData, OptimizationRecommendation
from monitoring.log_analyzer import LogAnalyzer, LogEntry, Alert, AlertSeverity
from dashboard.api import DashboardAPI

# Initialize logger
logger = logging.getLogger(__name__)
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)

# Initialize FastAPI app
app = FastAPI(
    title="AI CTO Core API",
    description="Core API for AWS cost optimization, log monitoring, and dashboard services",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize core services
cost_optimizer = AWSCostOptimizer()
log_analyzer = LogAnalyzer()
dashboard_api = DashboardAPI()

# Add console alert handler for demo
def console_alert_handler(alert: Alert):
    logger.info(f"ALERT [{alert.severity.value.upper()}]: {alert.title}")

log_analyzer.add_alert_handler(console_alert_handler)

# AWS Cost Optimization Endpoints
@app.get("/api/aws/cost/summary", tags=["AWS Cost Optimization"])
async def get_cost_summary(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    granularity: str = "DAILY"
):
    """
    Get cost and usage summary from AWS Cost Explorer
    """
    try:
        # Handle None values by providing defaults
        if start_date is None:
            start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        if end_date is None:
            end_date = datetime.now().strftime('%Y-%m-%d')
            
        cost_data = cost_optimizer.get_cost_and_usage(start_date, end_date, granularity)
        formatted_data = dashboard_api.format_cost_data(cost_data)
        return formatted_data
    except Exception as e:
        logger.error(f"Error getting cost summary: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/aws/cost/trends", tags=["AWS Cost Optimization"])
async def get_cost_trends(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """
    Get cost trends over time
    """
    try:
        # Handle None values by providing defaults
        if start_date is None:
            start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        if end_date is None:
            end_date = datetime.now().strftime('%Y-%m-%d')
            
        cost_data = cost_optimizer.get_cost_and_usage(start_date, end_date, "DAILY")
        formatted_data = dashboard_api.format_cost_data(cost_data)
        return formatted_data
    except Exception as e:
        logger.error(f"Error getting cost trends: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/aws/reservations/utilization", tags=["AWS Cost Optimization"])
async def get_reservation_utilization(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """
    Get Reserved Instance utilization data
    """
    try:
        # Handle None values by providing defaults
        if start_date is None:
            start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        if end_date is None:
            end_date = datetime.now().strftime('%Y-%m-%d')
            
        utilization_data = cost_optimizer.get_reservation_utilization(start_date, end_date)
        return utilization_data
    except Exception as e:
        logger.error(f"Error getting reservation utilization: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/aws/savingsplans/utilization", tags=["AWS Cost Optimization"])
async def get_savings_plans_utilization(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """
    Get Savings Plans utilization data
    """
    try:
        # Handle None values by providing defaults
        if start_date is None:
            start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        if end_date is None:
            end_date = datetime.now().strftime('%Y-%m-%d')
            
        utilization_data = cost_optimizer.get_savings_plans_utilization(start_date, end_date)
        return utilization_data
    except Exception as e:
        logger.error(f"Error getting savings plans utilization: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/aws/ec2/instances", tags=["AWS Cost Optimization"])
async def get_ec2_instances():
    """
    Get analysis of EC2 instances for optimization opportunities
    """
    try:
        instances = cost_optimizer.analyze_ec2_instances()
        formatted_data = dashboard_api.format_utilization_data(instances)
        return formatted_data
    except Exception as e:
        logger.error(f"Error analyzing EC2 instances: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/aws/recommendations", tags=["AWS Cost Optimization"])
async def get_optimization_recommendations():
    """
    Get cost optimization recommendations
    """
    try:
        recommendations = cost_optimizer.generate_optimization_recommendations()
        # Convert to dict for JSON serialization
        return [rec.__dict__ for rec in recommendations]
    except Exception as e:
        logger.error(f"Error generating recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Monitoring Endpoints
@app.post("/api/monitoring/logs", tags=["Monitoring"])
async def ingest_logs(logs: List[str], service: str = "unknown"):
    """
    Ingest log entries for analysis
    """
    try:
        alerts = log_analyzer.process_logs(logs, service)
        return {
            "message": f"Processed {len(logs)} log entries",
            "alerts_generated": len(alerts),
            "alerts": [alert.__dict__ for alert in alerts]
        }
    except Exception as e:
        logger.error(f"Error processing logs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/monitoring/alerts", tags=["Monitoring"])
async def get_alerts(
    severity: Optional[str] = None,
    service: Optional[str] = None,
    limit: int = 100
):
    """
    Get recent alerts
    """
    try:
        # Get recent logs and extract alerts from them
        # In a real implementation, we would store alerts separately
        recent_logs = log_analyzer.get_recent_logs(minutes=60)  # Last hour
        
        # For demo, we'll re-analyze recent logs to get alerts
        # In production, you'd have a proper alert storage mechanism
        alert_logs = [log.raw_log for log in recent_logs]
        alerts = log_analyzer.process_logs(alert_logs, "recent-analysis")
        
        # Filter by severity if specified
        if severity:
            alerts = [alert for alert in alerts if alert.severity.value == severity.lower()]
        
        # Filter by service if specified
        if service:
            alerts = [alert for alert in alerts if alert.service == service]
        
        # Limit results
        alerts = alerts[:limit]
        
        return {
            "alerts": [alert.__dict__ for alert in alerts],
            "count": len(alerts)
        }
    except Exception as e:
        logger.error(f"Error getting alerts: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/monitoring/stats", tags=["Monitoring"])
async def get_log_statistics():
    """
    Get log processing statistics
    """
    try:
        stats = log_analyzer.get_log_stats()
        return stats
    except Exception as e:
        logger.error(f"Error getting log statistics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Dashboard Endpoints
@app.get("/api/dashboard/data/{source_name}", tags=["Dashboard"])
async def get_dashboard_data(source_name: str, force_refresh: bool = False):
    """
    Get data from a registered dashboard data source
    """
    try:
        data = dashboard_api.get_data(source_name, force_refresh)
        if data is None:
            raise HTTPException(status_code=404, detail=f"Data source '{source_name}' not found")
        return data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting dashboard data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/dashboard/register-source", tags=["Dashboard"])
async def register_data_source(
    name: str,
    ttl: int = 300
):
    """
    Register a new data source for the dashboard
    Note: In a real implementation, you would provide the data function
    """
    try:
        # This is a simplified version - in reality, you'd need to pass the actual data function
        dashboard_api.register_data_source(name, lambda: {"message": f"Data from {name}"}, ttl)
        return {"message": f"Data source '{name}' registered successfully"}
    except Exception as e:
        logger.error(f"Error registering data source: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Health check endpoint
@app.get("/health", tags=["System"])
async def health_check():
    """
    Health check endpoint
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }

# Root endpoint
@app.get("/", tags=["System"])
async def root():
    """
    Root endpoint with API information
    """
    return {
        "message": "AI CTO Core API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }